import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const user = verifyToken(authHeader.split(" ")[1]);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/removal-requests — list requests (pending first), with display info.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await pool.query(`
    SELECT r.id, r.display_id, r.requester_name, r.requester_email, r.requested_type,
           r.message, r.status, r.created_at,
           d.title AS display_title, d.status AS display_status
    FROM removal_requests r
    LEFT JOIN displays d ON d.id = r.display_id
    ORDER BY (r.status = 'pending') DESC, r.created_at DESC
  `);

  return NextResponse.json({ requests: result.rows });
}

// PATCH /api/admin/removal-requests — act on a request.
// action: 'remove_location' (clear coords + address, keep photo),
//         'remove_home' (hide the display), or 'dismiss' (no change to the display).
export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id, action } = await request.json();
    if (!id || !["remove_location", "remove_home", "dismiss"].includes(action)) {
      return NextResponse.json({ error: "A request id and valid action are required." }, { status: 400 });
    }

    const reqRow = await pool.query("SELECT display_id FROM removal_requests WHERE id = $1", [id]);
    if (reqRow.rows.length === 0) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const displayId = reqRow.rows[0].display_id;

    if (action === "remove_location") {
      // Off the map, but the photo and votes stay. Keep the coarse neighborhood name.
      await pool.query(
        "UPDATE displays SET latitude = NULL, longitude = NULL, address = NULL, updated_at = NOW() WHERE id = $1",
        [displayId]
      );
    } else if (action === "remove_home") {
      // Hide everywhere public (kept in DB for the record; reversible).
      await pool.query("UPDATE displays SET status = 'removed', updated_at = NOW() WHERE id = $1", [displayId]);
    }

    const newStatus = action === "dismiss" ? "dismissed" : "resolved";
    await pool.query("UPDATE removal_requests SET status = $1, resolved_at = NOW() WHERE id = $2", [newStatus, id]);

    return NextResponse.json({ message: "Request updated.", status: newStatus });
  } catch (error) {
    console.error("Error updating removal request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
