import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { createToken } from "@/lib/tokens";
import { getAuthUser, getBaseUrl } from "@/lib/auth";
import { sendEmail, verificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await pool.query("SELECT email, email_verified FROM users WHERE id = $1", [auth.userId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (result.rows[0].email_verified) {
      return NextResponse.json({ message: "Your email is already confirmed." });
    }

    const email = result.rows[0].email;
    const token = await createToken(auth.userId, "email_verify");
    const link = `${getBaseUrl(request)}/verify-email?token=${token}`;
    const { subject, html } = verificationEmail(link);
    const sendResult = await sendEmail({ to: email, subject, html, devLink: link });

    return NextResponse.json({
      message: "Confirmation email sent.",
      ...(sendResult.devLink ? { devLink: sendResult.devLink } : {}),
    });
  } catch (error) {
    console.error("Error in resend-verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
