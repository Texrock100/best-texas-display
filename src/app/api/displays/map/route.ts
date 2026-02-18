import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/displays/map - Get displays with coordinates for map
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const season = searchParams.get('season');

    let query = `
      SELECT d.id, d.title, d.city, d.region, d.neighborhood, d.address,
        d.latitude, d.longitude, d.vote_count, d.season_id,
        s.holiday_type, s.name as season_name,
        (SELECT url FROM photos p WHERE p.display_id = d.id ORDER BY sort_order LIMIT 1) as thumbnail
      FROM displays d
      LEFT JOIN seasons s ON s.id = d.season_id
      WHERE d.status = 'approved' AND d.latitude IS NOT NULL AND d.longitude IS NOT NULL
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

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

    query += ` ORDER BY d.vote_count DESC LIMIT 200`;

    const result = await pool.query(query, params);

    return NextResponse.json({ displays: result.rows });
  } catch (error) {
    console.error('Error fetching map displays:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
