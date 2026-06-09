import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [auth.userId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const password_hash = await hashPassword(newPassword);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      password_hash,
      auth.userId,
    ]);

    return NextResponse.json({ message: "Password updated." });
  } catch (error) {
    console.error("Error in change-password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
