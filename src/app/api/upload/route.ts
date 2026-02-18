import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { uploadToR2 } from '@/lib/s3';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const displayId = formData.get('display_id') as string;
    const sortOrder = formData.get('sort_order') as string;

    if (!file || !displayId) {
      return NextResponse.json({ error: 'File and display_id are required' }, { status: 400 });
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG and PNG files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
    }

    // Verify display ownership
    const displayResult = await pool.query(
      'SELECT owner_id FROM displays WHERE id = $1',
      [parseInt(displayId)]
    );
    if (!displayResult.rows[0] || displayResult.rows[0].owner_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized to upload to this display' }, { status: 403 });
    }

    // Generate key
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const key = `displays/${displayId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 (or store locally if R2 not configured)
    let url: string;
    if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
      url = await uploadToR2(key, buffer, file.type);
    } else {
      // Fallback: store photo URL as placeholder
      url = `/api/placeholder-image?id=${displayId}&n=${sortOrder || 0}`;
    }

    // Insert photo record
    const photoResult = await pool.query(
      'INSERT INTO photos (display_id, url, thumbnail_url, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [parseInt(displayId), url, url, parseInt(sortOrder || '0')]
    );

    return NextResponse.json({ photo: photoResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
