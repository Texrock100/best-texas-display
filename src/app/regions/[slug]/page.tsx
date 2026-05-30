import Link from "next/link";
import pool from "@/lib/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface RegionPageProps {
  params: Promise<{ slug: string }>;
}

// Maps the homepage region slugs to the actual `region` values stored in the
// cities table. Most are 1:1; "west-texas" spans two DB regions.
const REGIONS: Record<string, { label: string; dbRegions: string[]; icon: string }> = {
  "dfw": { label: "Dallas–Fort Worth", dbRegions: ["DFW"], icon: "🏙️" },
  "houston": { label: "Houston", dbRegions: ["Houston"], icon: "🚀" },
  "austin": { label: "Austin", dbRegions: ["Austin"], icon: "🎸" },
  "san-antonio": { label: "San Antonio", dbRegions: ["San Antonio"], icon: "🌵" },
  "east-texas": { label: "East Texas", dbRegions: ["East Texas"], icon: "🌲" },
  "central-texas": { label: "Central Texas", dbRegions: ["Central Texas"], icon: "🤠" },
  "south-texas": { label: "South Texas", dbRegions: ["South Texas"], icon: "🌴" },
  "west-texas": { label: "West Texas & Panhandle", dbRegions: ["El Paso", "Panhandle"], icon: "🏜️" },
};

export async function generateStaticParams() {
  return Object.keys(REGIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const region = REGIONS[slug];
  if (!region) return { title: "Region Not Found" };
  return {
    title: `Best Holiday Displays in ${region.label}, Texas`,
    description: `Discover and vote for the best Christmas lights, Halloween decorations, and holiday displays across ${region.label}, Texas. Browse displays city by city and plan your driving tour.`,
    alternates: {
      canonical: `/regions/${slug}`,
    },
    openGraph: {
      title: `Best Holiday Displays in ${region.label}, Texas`,
      description: `Vote for the best holiday decorations across ${region.label}, Texas.`,
      url: `/regions/${slug}`,
    },
  };
}

interface CityRow {
  id: number;
  name: string;
  slug: string;
  county: string;
  population: number | null;
  display_count: number;
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { slug } = await params;
  const region = REGIONS[slug];
  if (!region) notFound();

  const citiesResult = await pool.query(
    `
    SELECT c.id, c.name, c.slug, c.county, c.population,
      COALESCE(d.display_count, 0)::int as display_count
    FROM cities c
    LEFT JOIN (
      SELECT city_id, COUNT(*) as display_count
      FROM displays WHERE status = 'approved'
      GROUP BY city_id
    ) d ON d.city_id = c.id
    WHERE c.region = ANY($1::text[])
    ORDER BY c.population DESC NULLS LAST
    `,
    [region.dbRegions]
  );
  const cities: CityRow[] = citiesResult.rows;
  const totalDisplays = cities.reduce((sum, c) => sum + c.display_count, 0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1B3A5C] to-[#2C5F8A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-300 mb-4">
            <Link href="/cities" className="hover:text-[#D4A843]">Cities</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{region.label}</span>
          </nav>
          <div className="text-4xl mb-3">{region.icon}</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Holiday Displays in {region.label}
            <span className="text-[#D4A843]">, Texas</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl">
            {totalDisplays > 0
              ? `Explore ${totalDisplays} holiday decoration display${totalDisplays !== 1 ? "s" : ""} across ${cities.length} ${region.label} cities. Vote for your favorites and plan your driving tour.`
              : `Be the first to put ${region.label} on the map! Submit your holiday display and start the local competition.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/submit" className="px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg transition-colors">
              Submit a Display
            </Link>
            <Link href={`/leaderboard?region=${encodeURIComponent(region.dbRegions[0])}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/30 transition-colors">
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-[#1B3A5C] mb-6">
          Cities in {region.label}
        </h2>
        {cities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/cities/${city.slug}`}
                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-[#1B3A5C] group-hover:text-[#C0392B] transition-colors">
                  {city.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{city.county} County</p>
                {city.population && (
                  <p className="text-xs text-gray-400 mt-1">Pop. {city.population.toLocaleString()}</p>
                )}
                <div className="mt-3 flex items-center text-sm">
                  {city.display_count > 0 ? (
                    <span className="text-[#C0392B] font-medium">{city.display_count} display{city.display_count !== 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-gray-400">No displays yet — be the first!</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No cities are listed for this region yet.</p>
        )}
      </section>

      {/* SEO Content */}
      <section className="bg-[#F8F6F1] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-3">Holiday Decorations in {region.label}, Texas</h2>
          <p className="text-gray-600 leading-relaxed">
            {region.label} is home to some of Texas&apos;s most spectacular holiday decoration
            displays. Browse the best Christmas lights and Halloween yards across{" "}
            {cities.map((c) => c.name).join(", ")}, vote for your favorites, and plan a
            driving tour of the most dazzling homes in the region. Whether you live in{" "}
            {region.label} or are just visiting for the season, BestTexasDisplay.com is your
            guide to the area&apos;s holiday spirit.
          </p>
        </div>
      </section>
    </div>
  );
}
