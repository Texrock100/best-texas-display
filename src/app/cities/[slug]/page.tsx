import Link from "next/link";
import pool from "@/lib/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await pool.query("SELECT name, region FROM cities WHERE slug = $1", [slug]);
  if (result.rows.length === 0) return { title: "City Not Found" };
  const city = result.rows[0];
  return {
    title: `Best Holiday Displays in ${city.name}, Texas`,
    description: `Discover and vote for the best Christmas lights, Halloween decorations, and holiday displays in ${city.name}, Texas. Browse photos, plan your driving tour, and submit your own display.`,
    openGraph: {
      title: `Best Holiday Displays in ${city.name}, Texas`,
      description: `Vote for the best holiday decorations in ${city.name}, TX.`,
    },
  };
}

export async function generateStaticParams() {
  const result = await pool.query("SELECT slug FROM cities");
  return result.rows.map((row: { slug: string }) => ({ slug: row.slug }));
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  
  const cityResult = await pool.query(
    "SELECT * FROM cities WHERE slug = $1", [slug]
  );
  if (cityResult.rows.length === 0) notFound();
  const city = cityResult.rows[0];

  const displaysResult = await pool.query(`
    SELECT d.*, 
      json_agg(json_build_object('id', p.id, 'url', p.url, 'thumbnail_url', p.thumbnail_url)) 
      FILTER (WHERE p.id IS NOT NULL) as photos,
      u.display_name as owner_name
    FROM displays d
    LEFT JOIN photos p ON p.display_id = d.id
    LEFT JOIN users u ON u.id = d.owner_id
    WHERE d.city_id = $1 AND d.status = 'approved'
    GROUP BY d.id, u.display_name
    ORDER BY d.vote_count DESC
    LIMIT 20
  `, [city.id]);

  const displays = displaysResult.rows;
  const hasDisplays = displays.length > 0;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1B3A5C] to-[#2C5F8A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-300 mb-4">
            <Link href="/cities" className="hover:text-[#D4A843]">Cities</Link>
            <span className="mx-2">/</span>
            <Link href={`/leaderboard?region=${city.region}`} className="hover:text-[#D4A843]">{city.region}</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{city.name}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Holiday Displays in {city.name}
            <span className="text-[#D4A843]">, Texas</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl">
            {hasDisplays
              ? `Explore ${displays.length} holiday decoration display${displays.length !== 1 ? 's' : ''} in ${city.name}. Vote for your favorites and help crown the best in the city.`
              : `Be the first to put ${city.name} on the map! Submit your holiday display and start the local competition.`
            }
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/submit" className="px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg transition-colors">
              Submit a Display
            </Link>
            {hasDisplays && (
              <Link href={`/map?city=${slug}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/30 transition-colors">
                View on Map
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Displays Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {hasDisplays ? (
          <>
            <h2 className="text-2xl font-bold text-[#1B3A5C] mb-6">
              Top Displays in {city.name}
            </h2>
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
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        
                      </div>
                    )}
                    {index < 3 && (
                      <div className="absolute top-3 left-3 bg-[#D4A843] text-[#1B3A5C] text-xs font-bold px-2 py-1 rounded">
                        #{index + 1} in {city.name}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-[#1B3A5C] group-hover:text-[#C0392B] transition-colors text-lg">
                      {display.title}
                    </h3>
                    {display.neighborhood && (
                      <p className="text-sm text-gray-500 mt-1">{display.neighborhood}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-[#C0392B]">
                        <span className="text-lg">❤️</span>
                        <span className="font-semibold">{display.vote_count}</span>
                        <span className="text-xs text-gray-400">votes</span>
                      </div>
                      {display.owner_name && (
                        <span className="text-xs text-gray-400">by {display.owner_name}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-[#1B3A5C] mb-3">No displays in {city.name} yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Be the first to submit a holiday display in {city.name} and put your neighborhood on the map!
            </p>
            <Link href="/submit" className="inline-block px-8 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg transition-colors">
              Submit Your Display
            </Link>
          </div>
        )}
      </section>

      {/* SEO Content */}
      <section className="bg-[#F8F6F1] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-3">Holiday Decorations in {city.name}, Texas</h2>
          <p className="text-gray-600 leading-relaxed">
            {city.name} is part of the {city.region} region of Texas
            {city.population ? ` with a population of approximately ${city.population.toLocaleString()}` : ''}.
            Residents and visitors can browse the best holiday decoration displays in {city.name}, 
            vote for their favorites, and plan driving tours of the most spectacular homes. 
            Whether you&apos;re looking for the best Christmas lights or the spookiest Halloween yard in town, 
            BestTexasDisplay.com is your guide to {city.name}&apos;s holiday spirit.
          </p>
        </div>
      </section>
    </div>
  );
}
