import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { createToken } from "@/lib/tokens";
import { getBaseUrl } from "@/lib/auth";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);

    // Only act if the account exists, but always return the same response so the
    // endpoint can't be used to discover which emails are registered.
    let devLink: string | undefined;
    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      const token = await createToken(userId, "password_reset");
      const link = `${getBaseUrl(request)}/reset-password?token=${token}`;
      const { subject, html } = passwordResetEmail(link);
      const sendResult = await sendEmail({ to: email.toLowerCase(), subject, html, devLink: link });
      devLink = sendResult.devLink;
    }

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
      // Present only in dev (no RESEND_API_KEY) so you can test without email set up.
      ...(devLink ? { devLink } : {}),
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
