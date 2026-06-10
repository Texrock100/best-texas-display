import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { deleteFromR2, keyFromPublicUrl } from '@/lib/s3';

// DELETE /api/photos/[id] - Remove a photo from a display (owner or admin only).
// Deletes the underlying R2 objects (full image + thumbnail) before the DB row.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const photoId = parseInt(id);

    // Look up the photo and the owner of its display in one query.
    const result = await pool.query(
      `SELECT p.id, p.url, p.thumbnail_url, d.owner_id
       FROM photos p JOIN displays d ON d.id = p.display_id
       WHERE p.id = $1`,
      [photoId]
    );
    const photo = result.rows[0];
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    if (photo.owner_id !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to delete this photo' }, { status: 403 });
    }

    // Remove the R2 objects we manage. Don't let a storage hiccup block the DB
    // delete — a dangling object is preferable to a broken UI reference.
    const keys = [keyFromPublicUrl(photo.url), keyFromPublicUrl(photo.thumbnail_url)].filter(
      (k): k is string => !!k
    );
    for (const key of keys) {
      try {
        await deleteFromR2(key);
      } catch (err) {
        console.error('Failed to delete R2 object', key, err);
      }
    }

    await pool.query('DELETE FROM photos WHERE id = $1', [photoId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
