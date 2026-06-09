import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, generateToken, getBaseUrl } from '@/lib/auth';
import { createToken } from '@/lib/tokens';
import { sendEmail, verificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, display_name, city } = body;

    if (!email || !password || !display_name) {
      return NextResponse.json({ error: 'Email, password, and display name are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, display_name, city) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role, city, email_verified',
      [email.toLowerCase(), password_hash, display_name, city]
    );

    const user = result.rows[0];

    // Send a confirmation email. Don't fail registration if email sending hiccups —
    // the user can resend from their account page.
    try {
      const verifyToken = await createToken(user.id, 'email_verify');
      const link = `${getBaseUrl(request)}/verify-email?token=${verifyToken}`;
      const { subject, html } = verificationEmail(link);
      await sendEmail({ to: user.email, subject, html, devLink: link });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    const token = generateToken(user.id, user.email, user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        city: user.city,
        email_verified: user.email_verified,
      },
      token,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
