import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { consumeToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const userId = await consumeToken(token, "password_reset");
    if (!userId) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      password_hash,
      userId,
    ]);

    return NextResponse.json({ message: "Your password has been reset. You can now log in." });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
