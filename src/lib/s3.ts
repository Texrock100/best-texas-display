import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'best-texas-display';

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL || ''}/${key}`;
}

// Recovers the R2 object key from a stored public URL (the inverse of uploadToR2).
// Returns null for URLs we don't manage (e.g. local-dev placeholders) so callers
// can skip the R2 delete safely.
export function keyFromPublicUrl(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url) return null;
  const prefix = `${base.replace(/\/$/, '')}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

export { s3Client, BUCKET_NAME };
