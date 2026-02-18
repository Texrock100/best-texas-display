import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/votes - Cast a vote
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Must be logged in to vote' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { display_id, season_id } = body;

    if (!display_id || !season_id) {
      return NextResponse.json({ error: 'Missing display_id or season_id' }, { status: 400 });
    }

    // Check if season voting is open
    const seasonResult = await pool.query('SELECT voting_open FROM seasons WHERE id = $1', [season_id]);
    if (!seasonResult.rows[0]?.voting_open) {
      return NextResponse.json({ error: 'Voting is not currently open for this season' }, { status: 400 });
    }

    // Check if display exists and is approved
    const displayResult = await pool.query('SELECT city, status FROM displays WHERE id = $1', [display_id]);
    if (!displayResult.rows[0]) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }
    if (displayResult.rows[0].status !== 'approved') {
      return NextResponse.json({ error: 'Display is not approved for voting' }, { status: 400 });
    }

    // Get voter IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0';

    // Get voter's city from their profile
    const voterResult = await pool.query('SELECT city FROM users WHERE id = $1', [user.userId]);
    const voterCity = voterResult.rows[0]?.city;

    // Check if already voted (unique constraint will also catch this)
    const existingVote = await pool.query(
      'SELECT id FROM votes WHERE voter_id = $1 AND display_id = $2 AND season_id = $3',
      [user.userId, display_id, season_id]
    );

    if (existingVote.rows.length > 0) {
      return NextResponse.json({ error: 'You have already voted for this display this season' }, { status: 409 });
    }

    // Insert vote
    await pool.query(
      'INSERT INTO votes (voter_id, display_id, season_id, voter_city, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [user.userId, display_id, season_id, voterCity, ip]
    );

    // Update vote counts on display
    const displayCity = displayResult.rows[0].city;
    const isLocal = voterCity && voterCity.toLowerCase() === displayCity.toLowerCase();

    await pool.query(
      `UPDATE displays SET 
        vote_count = vote_count + 1,
        local_vote_count = local_vote_count + ${isLocal ? 1 : 0}
       WHERE id = $1`,
      [display_id]
    );

    return NextResponse.json({ success: true, message: 'Vote recorded!' });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
