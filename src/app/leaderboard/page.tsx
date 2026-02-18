import Link from "next/link";
import pool from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top-voted holiday decoration displays across Texas. Filter by city, region, and season to find the best Christmas lights and Halloween decorations.",
};

interface LeaderboardProps {
  searchParams: Promise<{ region?: string; season?: string; city?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardProps) {
  const sp = await searchParams;
  const regionFilter = sp.region;
  const seasonFilter = sp.season;
  const cityFilter = sp.city;

  // Get seasons for filter
  const seasonsResult = await pool.query("SELECT * FROM seasons ORDER BY start_date DESC");
  const seasons = seasonsResult.rows;

  // Get regions for filter
  const regionsResult = await pool.query("SELECT DISTINCT region FROM cities ORDER BY region");
  const regionsList = regionsResult.rows.map((r: { region: string }) => r.region);

  // Build display query
  let query = `
    SELECT d.*, 
      json_agg(json_build_object('id', p.id, 'url', p.url, 'thumbnail_url', p.thumbnail_url)) 
      FILTER (WHERE p.id IS NOT NULL) as photos,
      u.display_name as owner_name,
      s.name as season_name, s.holiday_type
    FROM displays d
    LEFT JOIN photos p ON p.display_id = d.id
    LEFT JOIN users u ON u.id = d.owner_id
    LEFT JOIN seasons s ON s.id = d.season_id
    WHERE d.status = 'approved'
  `;
  const params: (string | number)[] = [];
  let paramIdx = 1;

  if (regionFilter) {
    query += ` AND d.region = $${paramIdx}`;
    params.push(regionFilter);
    paramIdx++;
  }
  if (seasonFilter) {
    query += ` AND d.season_id = $${paramIdx}`;
    params.push(parseInt(seasonFilter));
    paramIdx++;
  }
  if (cityFilter) {
    query += ` AND LOWER(d.city) = LOWER($${paramIdx})`;
    params.push(cityFilter);
    paramIdx++;
  }

  query += ` GROUP BY d.id, u.display_name, s.name, s.holiday_type ORDER BY d.vote_count DESC LIMIT 50`;

  const displaysResult = await pool.query(query, params);
  const displays = displaysResult.rows;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#1B3A5C] mb-4">Leaderboard</h1>
        <p className="text-lg text-gray-600">
          The top-voted holiday displays across Texas
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        <Link
          href="/leaderboard"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !regionFilter && !seasonFilter ? 'bg-[#1B3A5C] text-white' : 'bg-white text-[#1B3A5C] border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Texas
        </Link>
        {regionsList.map((region: string) => (
          <Link
            key={region}
            href={`/leaderboard?region=${region}${seasonFilter ? `&season=${seasonFilter}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              regionFilter === region ? 'bg-[#1B3A5C] text-white' : 'bg-white text-[#1B3A5C] border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {region}
          </Link>
        ))}
      </div>

      {/* Season Filters */}
      <div className="flex flex-wrap gap-3 mb-10 justify-center">
        <span className="text-sm text-gray-500 self-center mr-2">Season:</span>
        <Link
          href={`/leaderboard${regionFilter ? `?region=${regionFilter}` : ''}`}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !seasonFilter ? 'bg-[#C0392B] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Seasons
        </Link>
        {seasons.map((season: any) => (
          <Link
            key={season.id}
            href={`/leaderboard?season=${season.id}${regionFilter ? `&region=${regionFilter}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              seasonFilter === String(season.id) ? 'bg-[#C0392B] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {season.holiday_type === 'halloween' ? '🎃' : '🎄'} {season.name}
          </Link>
        ))}
      </div>

      {/* Results */}
      {displays.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displays.map((display: any, index: number) => (
            <Link
              key={display.id}
              href={`/displays/${display.id}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100"
            >
              <div className="aspect-video bg-gray-200 relative">
                {display.photos && display.photos[0] ? (
                  <img 
                    src={display.photos[0].thumbnail_url || display.photos[0].url} 
                    alt={display.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🏠</div>
                )}
                <div className="absolute top-3 left-3 bg-[#D4A843] text-[#1B3A5C] text-xs font-bold px-2 py-1 rounded">
                  #{index + 1}
                </div>
                {display.holiday_type && (
                  <div className="absolute top-3 right-3 text-2xl">
                    {display.holiday_type === 'halloween' ? '🎃' : '🎄'}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#1B3A5C] group-hover:text-[#C0392B] transition-colors text-lg">
                  {display.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{display.city}, TX • {display.region}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-[#C0392B]">
                    <span>❤️</span>
                    <span className="font-semibold">{display.vote_count}</span>
                    <span className="text-xs text-gray-400">total votes</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {display.local_vote_count} local
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-[#1B3A5C] mb-3">No displays yet</h2>
          <p className="text-gray-600 mb-6">Be the first to submit a display and top the leaderboard!</p>
          <Link href="/submit" className="inline-block px-8 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg transition-colors">
            Submit Your Display
          </Link>
        </div>
      )}
    </div>
  );
}
