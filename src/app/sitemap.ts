import pool from '@/lib/db';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.besttexasdisplay.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/cities`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/map`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Region landing pages
  const regionSlugs = ['dfw', 'houston', 'austin', 'san-antonio', 'east-texas', 'central-texas', 'south-texas', 'west-texas'];
  const regionPages: MetadataRoute.Sitemap = regionSlugs.map((slug) => ({
    url: `${baseUrl}/regions/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // City pages
  const citiesResult = await pool.query('SELECT slug FROM cities');
  const cityPages: MetadataRoute.Sitemap = citiesResult.rows.map((city: { slug: string }) => ({
    url: `${baseUrl}/cities/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Approved display pages
  const displaysResult = await pool.query(
    "SELECT id, updated_at FROM displays WHERE status = 'approved' ORDER BY vote_count DESC LIMIT 500"
  );
  const displayPages: MetadataRoute.Sitemap = displaysResult.rows.map((d: { id: number; updated_at: string }) => ({
    url: `${baseUrl}/displays/${d.id}`,
    lastModified: new Date(d.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...regionPages, ...cityPages, ...displayPages];
}
