import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// PATCH /api/displays/[id]/photos - Reorder a display's photos (owner or admin only).
// Body: { order: number[] } - photo ids in the desired display order.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const displayId = parseInt(id);

    const ownerResult = await pool.query('SELECT owner_id FROM displays WHERE id = $1', [displayId]);
    if (!ownerResult.rows[0]) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }
    if (ownerResult.rows[0].owner_id !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to edit this display' }, { status: 403 });
    }

    const { order } = await request.json();
    if (!Array.isArray(order) || order.some((v) => typeof v !== 'number')) {
      return NextResponse.json({ error: 'order must be an array of photo ids' }, { status: 400 });
    }

    // Only reorder photos that actually belong to this display.
    const photosResult = await pool.query('SELECT id FROM photos WHERE display_id = $1', [displayId]);
    const validIds = new Set(photosResult.rows.map((p) => p.id));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let sortOrder = 0;
      for (const photoId of order) {
        if (!validIds.has(photoId)) continue;
        await client.query('UPDATE photos SET sort_order = $1 WHERE id = $2 AND display_id = $3', [
          sortOrder,
          photoId,
          displayId,
        ]);
        sortOrder++;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const updated = await pool.query(
      'SELECT * FROM photos WHERE display_id = $1 ORDER BY sort_order, id',
      [displayId]
    );
    return NextResponse.json({ photos: updated.rows });
  } catch (error) {
    console.error('Error reordering photos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
