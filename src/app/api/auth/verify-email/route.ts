import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { consumeToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const userId = await consumeToken(token, "email_verify");
    if (!userId) {
      return NextResponse.json(
        { error: "This confirmation link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    await pool.query("UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1", [userId]);

    return NextResponse.json({ message: "Your email has been confirmed." });
  } catch (error) {
    console.error("Error in verify-email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
