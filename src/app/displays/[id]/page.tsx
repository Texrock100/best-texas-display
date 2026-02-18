import Link from "next/link";
import pool from "@/lib/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VoteButton from "@/components/VoteButton";

interface DisplayPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DisplayPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await pool.query("SELECT title, city, description FROM displays WHERE id = $1", [parseInt(id)]);
  if (result.rows.length === 0) return { title: "Display Not Found" };
  const d = result.rows[0];
  return {
    title: `${d.title} — ${d.city}, Texas`,
    description: d.description || `View and vote for this holiday display in ${d.city}, Texas on BestTexasDisplay.com`,
  };
}

export default async function DisplayPage({ params }: DisplayPageProps) {
  const { id } = await params;

  const result = await pool.query(`
    SELECT d.*,
      u.display_name as owner_name,
      s.name as season_name, s.holiday_type, s.voting_open
    FROM displays d
    LEFT JOIN users u ON u.id = d.owner_id
    LEFT JOIN seasons s ON s.id = d.season_id
    WHERE d.id = $1
  `, [parseInt(id)]);

  if (result.rows.length === 0) notFound();
  const display = result.rows[0];

  const photosResult = await pool.query(
    "SELECT * FROM photos WHERE display_id = $1 ORDER BY sort_order",
    [parseInt(id)]
  );
  const photos = photosResult.rows;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": display.title,
    "description": display.description || `Holiday decoration display in ${display.city}, Texas`,
    "url": `https://besttexasdisplay.com/displays/${display.id}`,
    "author": display.owner_name ? { "@type": "Person", "name": display.owner_name } : undefined,
    "locationCreated": {
      "@type": "Place",
      "name": `${display.city}, Texas`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": display.city,
        "addressRegion": "TX",
        "addressCountry": "US",
      },
    },
    ...(photos.length > 0 ? { "image": photos.map((p: any) => p.url) } : {}),
    "aggregateRating": display.vote_count > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": Math.min(5, Math.round((display.vote_count / Math.max(display.vote_count, 10)) * 5 * 10) / 10),
      "ratingCount": display.vote_count,
      "bestRating": 5,
    } : undefined,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <section className="bg-[#1B3A5C] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-300 mb-3">
            <Link href="/leaderboard" className="hover:text-[#D4A843]">Leaderboard</Link>
            <span className="mx-2">/</span>
            <Link href={`/cities/${display.city.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#D4A843]">{display.city}</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{display.title}</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">{display.title}</h1>
              <p className="text-gray-300 mt-2">
                {display.neighborhood ? `${display.neighborhood}, ` : ''}{display.city}, TX &bull; {display.region}
              </p>
              {display.owner_name && (
                <p className="text-sm text-gray-400 mt-1">Submitted by {display.owner_name}</p>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#D4A843]">{display.vote_count}</div>
                <div className="text-sm text-gray-300">total votes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-300">{display.local_vote_count}</div>
                <div className="text-sm text-gray-400">local votes</div>
              </div>
              <VoteButton displayId={display.id} seasonId={display.season_id} votingOpen={display.voting_open} />
            </div>
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo: any) => (
              <div key={photo.id} className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={photo.url}
                  alt={`${display.title} photo`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-video max-w-2xl mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-2">📸</div>
              <p>Photos coming soon</p>
            </div>
          </div>
        )}
      </section>

      {/* Description */}
      {display.description && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-3">About This Display</h2>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{display.description}</p>
          </div>
        </section>
      )}

      {/* Season Info */}
      <section className="bg-[#F8F6F1] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{display.holiday_type === 'halloween' ? '🎃' : '🎄'}</span>
            <div>
              <p className="font-semibold text-[#1B3A5C]">{display.season_name}</p>
              <p className="text-sm text-gray-500">
                {display.voting_open ? 'Voting is open — cast your vote above!' : 'Voting for this season has closed.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Address / Map placeholder */}
      {display.address && display.latitude && display.longitude && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-3">Location</h2>
          <p className="text-gray-600 mb-4">{display.address}, {display.city}, TX</p>
          <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🗺️</div>
              <p>Interactive map coming soon</p>
              <Link href={`/map?lat=${display.latitude}&lng=${display.longitude}`} className="text-[#C0392B] hover:underline text-sm mt-2 inline-block">
                View on full map →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
