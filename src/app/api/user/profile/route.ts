import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Returns the current user's account details plus their submitted displays.
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userResult = await pool.query(
      `SELECT id, email, display_name, role, city, email_verified, last_login_at, created_at
       FROM users WHERE id = $1`,
      [auth.userId]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const displaysResult = await pool.query(
      `SELECT id, title, city, status, vote_count, created_at
       FROM displays WHERE owner_id = $1 ORDER BY created_at DESC`,
      [auth.userId]
    );

    return NextResponse.json({ user: userResult.rows[0], displays: displaysResult.rows });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Updates editable profile fields (display name, city).
export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { display_name, city } = await request.json();
    if (display_name !== undefined && !display_name.trim()) {
      return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE users
         SET display_name = COALESCE($1, display_name),
             city = $2,
             updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, display_name, role, city, email_verified`,
      [display_name?.trim() ?? null, city?.trim() || null, auth.userId]
    );

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
