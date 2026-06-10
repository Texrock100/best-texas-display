import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getBaseUrl } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

// Where to notify on a new homeowner request.
const NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "drockaway1@gmail.com";

// POST /api/removal-requests — public. A homeowner asks to remove the location
// or the whole display. Goes into the admin queue for review (we don't auto-act,
// since ownership can't be verified from the form alone).
export async function POST(request: NextRequest) {
  try {
    const { display_id, requester_name, requester_email, requested_type, message } = await request.json();

    if (!display_id || !requester_name || !requester_email || !requested_type) {
      return NextResponse.json({ error: "Name, email, and a preference are required." }, { status: 400 });
    }
    if (!["remove_location", "remove_home"].includes(requested_type)) {
      return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(requester_email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Confirm the display exists (and grab its title for the notification).
    const display = await pool.query("SELECT id, title FROM displays WHERE id = $1", [display_id]);
    if (display.rows.length === 0) {
      return NextResponse.json({ error: "Display not found." }, { status: 404 });
    }

    await pool.query(
      `INSERT INTO removal_requests (display_id, requester_name, requester_email, requested_type, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [display_id, requester_name.trim(), requester_email.trim().toLowerCase(), requested_type, message?.trim() || null]
    );

    // Notify the admin (best-effort — don't fail the request if email hiccups).
    try {
      const label = requested_type === "remove_home" ? "Remove home entirely" : "Remove location (keep photo)";
      const link = `${getBaseUrl(request)}/admin`;
      await sendEmail({
        to: NOTIFY_EMAIL,
        subject: `Homeowner request: ${display.rows[0].title}`,
        html: `
          <p>A homeowner preference request was submitted.</p>
          <ul>
            <li><strong>Display:</strong> ${display.rows[0].title} (#${display_id})</li>
            <li><strong>Requested:</strong> ${label}</li>
            <li><strong>From:</strong> ${requester_name} &lt;${requester_email}&gt;</li>
            ${message ? `<li><strong>Message:</strong> ${message}</li>` : ""}
          </ul>
          <p>Review it in the <a href="${link}">admin dashboard</a> → Homeowner Requests.</p>`,
      });
    } catch (emailError) {
      console.error("Failed to send removal-request notification:", emailError);
    }

    return NextResponse.json({ message: "Your request has been received. We'll review it shortly." }, { status: 201 });
  } catch (error) {
    console.error("Error creating removal request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
