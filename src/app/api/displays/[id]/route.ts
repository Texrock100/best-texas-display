import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Fields an owner is allowed to edit, mapped to how they're parsed/normalized.
const EDITABLE_FIELDS: Record<string, (v: unknown) => string | number | null> = {
  title: (v) => (typeof v === 'string' ? v.trim() : null),
  description: (v) => (v ? String(v) : null),
  address: (v) => (v ? String(v).trim() : null),
  neighborhood: (v) => (v ? String(v).trim() : null),
  city: (v) => (typeof v === 'string' ? v.trim() : null),
  region: (v) => (typeof v === 'string' ? v.trim() : null),
  season_id: (v) => (v ? parseInt(String(v)) : null),
  latitude: (v) => (v === null || v === undefined || v === '' ? null : Number(v)),
  longitude: (v) => (v === null || v === undefined || v === '' ? null : Number(v)),
};

// GET /api/displays/[id] - Fetch a single display with its photos (owner or admin).
// Used to pre-fill the edit form, so it must work for pending displays too.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const displayId = parseInt(id);

    const result = await pool.query('SELECT * FROM displays WHERE id = $1', [displayId]);
    const display = result.rows[0];
    if (!display) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }
    if (display.owner_id !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to edit this display' }, { status: 403 });
    }

    const photosResult = await pool.query(
      'SELECT * FROM photos WHERE display_id = $1 ORDER BY sort_order, id',
      [displayId]
    );

    return NextResponse.json({ display, photos: photosResult.rows });
  } catch (error) {
    console.error('Error fetching display:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/displays/[id] - Update display fields (owner or admin only).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const displayId = parseInt(id);

    // Verify ownership
    const ownerResult = await pool.query('SELECT owner_id FROM displays WHERE id = $1', [displayId]);
    if (!ownerResult.rows[0]) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }
    if (ownerResult.rows[0].owner_id !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to edit this display' }, { status: 403 });
    }

    const body = await request.json();

    // Build a dynamic update from the editable fields actually present in the body.
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    for (const [field, normalize] of Object.entries(EDITABLE_FIELDS)) {
      if (!(field in body)) continue;
      const value = normalize(body[field]);
      // Required fields must not be blanked out.
      if ((field === 'title' || field === 'city' || field === 'region') && !value) {
        return NextResponse.json({ error: `${field} cannot be empty` }, { status: 400 });
      }
      if (field === 'season_id' && !value) {
        return NextResponse.json({ error: 'season_id cannot be empty' }, { status: 400 });
      }
      updates.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(displayId);

    const result = await pool.query(
      `UPDATE displays SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({ display: result.rows[0] });
  } catch (error) {
    console.error('Error updating display:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
