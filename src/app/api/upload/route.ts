import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
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

    // Validate file type — accept any image (incl. HEIC from iPhones); we
    // normalize to JPEG below. Some browsers report an empty type for HEIC.
    if (file.type && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
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
    if (!displayResult.rows[0]) {
      return NextResponse.json({ error: 'Display not found' }, { status: 404 });
    }
    if (displayResult.rows[0].owner_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to upload to this display' }, { status: 403 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Normalize to JPEG and build a thumbnail. This handles HEIC/iPhone photos,
    // auto-rotates via EXIF orientation, and strips metadata.
    let mainBuffer: Buffer;
    let thumbBuffer: Buffer;
    try {
      mainBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      thumbBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (err) {
      console.error('Image processing failed:', err);
      return NextResponse.json({ error: 'Could not process image. Please try a different photo.' }, { status: 400 });
    }

    // Generate keys
    const base = `displays/${displayId}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const mainKey = `${base}.jpg`;
    const thumbKey = `${base}-thumb.jpg`;

    // Upload to R2 (or store a placeholder if R2 isn't configured, e.g. local dev)
    let url: string;
    let thumbnailUrl: string;
    if (process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) {
      [url, thumbnailUrl] = await Promise.all([
        uploadToR2(mainKey, mainBuffer, 'image/jpeg'),
        uploadToR2(thumbKey, thumbBuffer, 'image/jpeg'),
      ]);
    } else {
      url = `/api/placeholder-image?id=${displayId}&n=${sortOrder || 0}`;
      thumbnailUrl = url;
    }

    // Insert photo record
    const photoResult = await pool.query(
      'INSERT INTO photos (display_id, url, thumbnail_url, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [parseInt(displayId), url, thumbnailUrl, parseInt(sortOrder || '0')]
    );

    return NextResponse.json({ photo: photoResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
