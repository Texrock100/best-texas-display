import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const user = verifyToken(authHeader.split(' ')[1]);
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET /api/admin/displays - List all displays (any status)
export async function GET(request: NextRequest) {
  const user = requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT d.*, u.display_name as owner_name, u.email as owner_email,
      s.name as season_name,
      (SELECT COUNT(*) FROM photos p WHERE p.display_id = d.id) as photo_count
    FROM displays d
    LEFT JOIN users u ON u.id = d.owner_id
    LEFT JOIN seasons s ON s.id = d.season_id
  `;
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (status !== 'all') {
    query += ` WHERE d.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Count
  let countQuery = 'SELECT COUNT(*) FROM displays';
  const countParams: string[] = [];
  if (status !== 'all') {
    countQuery += ' WHERE status = $1';
    countParams.push(status);
  }
  const countResult = await pool.query(countQuery, countParams);

  return NextResponse.json({
    displays: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  });
}

// PATCH /api/admin/displays - Update display status
export async function PATCH(request: NextRequest) {
  const user = requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { id, status, featured } = body;

  if (!id) return NextResponse.json({ error: 'Display ID required' }, { status: 400 });

  const updates: string[] = [];
  const params: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (typeof featured === 'boolean') {
    updates.push(`featured = $${paramIndex}`);
    params.push(featured);
    paramIndex++;
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid updates' }, { status: 400 });
  }

  params.push(id);
  const result = await pool.query(
    `UPDATE displays SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  return NextResponse.json({ display: result.rows[0] });
}
