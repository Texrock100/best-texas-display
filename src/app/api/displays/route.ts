import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/displays - List displays with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const season = searchParams.get('season');
    const status = searchParams.get('status') || 'approved';
    const sort = searchParams.get('sort') || 'votes';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, 
        json_agg(json_build_object('id', p.id, 'url', p.url, 'thumbnail_url', p.thumbnail_url, 'sort_order', p.sort_order)) 
        FILTER (WHERE p.id IS NOT NULL) as photos,
        u.display_name as owner_name
      FROM displays d
      LEFT JOIN photos p ON p.display_id = d.id
      LEFT JOIN users u ON u.id = d.owner_id
      WHERE d.status = $1
    `;
    const params: (string | number)[] = [status];
    let paramIndex = 2;

    if (city) {
      query += ` AND LOWER(d.city) = LOWER($${paramIndex})`;
      params.push(city);
      paramIndex++;
    }

    if (region) {
      query += ` AND d.region = $${paramIndex}`;
      params.push(region);
      paramIndex++;
    }

    if (season) {
      query += ` AND d.season_id = $${paramIndex}`;
      params.push(parseInt(season));
      paramIndex++;
    }

    query += ` GROUP BY d.id, u.display_name`;

    if (sort === 'votes') {
      query += ` ORDER BY d.vote_count DESC`;
    } else if (sort === 'newest') {
      query += ` ORDER BY d.created_at DESC`;
    } else if (sort === 'local_votes') {
      query += ` ORDER BY d.local_vote_count DESC`;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM displays WHERE status = $1`;
    const countParams: (string | number)[] = [status];
    let countParamIndex = 2;
    if (city) {
      countQuery += ` AND LOWER(city) = LOWER($${countParamIndex})`;
      countParams.push(city);
      countParamIndex++;
    }
    if (region) {
      countQuery += ` AND region = $${countParamIndex}`;
      countParams.push(region);
      countParamIndex++;
    }
    if (season) {
      countQuery += ` AND season_id = $${countParamIndex}`;
      countParams.push(parseInt(season as string));
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return NextResponse.json({
      displays: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching displays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/displays - Submit a new display
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, address, neighborhood, city, region, season_id, latitude, longitude, owner_consent } = body;

    if (!title || !city || !region || !season_id) {
      return NextResponse.json({ error: 'Missing required fields: title, city, region, season_id' }, { status: 400 });
    }

    if (!owner_consent) {
      return NextResponse.json({ error: 'Ownership confirmation is required to submit a display.' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO displays (owner_id, title, description, address, neighborhood, city, region, season_id, latitude, longitude, owner_consent, consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW())
       RETURNING *`,
      [user.userId, title, description, address, neighborhood, city, region, season_id, latitude, longitude]
    );

    return NextResponse.json({ display: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating display:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
