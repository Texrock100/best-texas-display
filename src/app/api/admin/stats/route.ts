import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const user = verifyToken(authHeader.split(' ')[1]);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [users, displays, votes, pending, photos] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM displays'),
    pool.query('SELECT COUNT(*) FROM votes'),
    pool.query("SELECT COUNT(*) FROM displays WHERE status = 'pending'"),
    pool.query('SELECT COUNT(*) FROM photos'),
  ]);

  const recentDisplays = await pool.query(`
    SELECT d.id, d.title, d.city, d.status, d.created_at, u.display_name as owner_name
    FROM displays d
    LEFT JOIN users u ON u.id = d.owner_id
    ORDER BY d.created_at DESC
    LIMIT 10
  `);

  const topCities = await pool.query(`
    SELECT city, COUNT(*) as display_count, SUM(vote_count) as total_votes
    FROM displays
    WHERE status = 'approved'
    GROUP BY city
    ORDER BY display_count DESC
    LIMIT 10
  `);

  return NextResponse.json({
    stats: {
      totalUsers: parseInt(users.rows[0].count),
      totalDisplays: parseInt(displays.rows[0].count),
      totalVotes: parseInt(votes.rows[0].count),
      pendingReview: parseInt(pending.rows[0].count),
      totalPhotos: parseInt(photos.rows[0].count),
    },
    recentDisplays: recentDisplays.rows,
    topCities: topCities.rows,
  });
}
