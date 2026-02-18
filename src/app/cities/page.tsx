import Link from "next/link";
import pool from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse by City",
  description: "Explore holiday decoration displays across Texas cities. Find the best Christmas lights, Halloween decorations, and more in your city.",
};

interface CityRow {
  id: number;
  name: string;
  slug: string;
  region: string;
  county: string;
  population: number | null;
  display_count: number;
}

export default async function CitiesPage() {
  const result = await pool.query(`
    SELECT c.*, COALESCE(d.display_count, 0)::int as display_count
    FROM cities c
    LEFT JOIN (
      SELECT city_id, COUNT(*) as display_count 
      FROM displays WHERE status = 'approved' 
      GROUP BY city_id
    ) d ON d.city_id = c.id
    ORDER BY c.region, c.population DESC NULLS LAST
  `);
  
  const cities: CityRow[] = result.rows;
  
  // Group by region
  const regions: Record<string, CityRow[]> = {};
  cities.forEach(city => {
    if (!regions[city.region]) regions[city.region] = [];
    regions[city.region].push(city);
  });

  const regionOrder = ["DFW", "Houston", "Austin", "San Antonio", "Central Texas", "East Texas", "South Texas", "El Paso", "Panhandle"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1B3A5C] mb-4">Browse by City</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore holiday decoration displays across every corner of Texas. 
          Select a city to see its top-rated displays and local leaderboard.
        </p>
      </div>
      
      {regionOrder.map(regionName => {
        const regionCities = regions[regionName];
        if (!regionCities) return null;
        return (
          <div key={regionName} className="mb-10">
            <h2 className="text-2xl font-bold text-[#1B3A5C] mb-4 border-b-2 border-[#D4A843] pb-2">
              {regionName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {regionCities.map(city => (
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
                      <span className="text-[#C0392B] font-medium">{city.display_count} display{city.display_count !== 1 ? 's' : ''}</span>
                    ) : (
                      <span className="text-gray-400">No displays yet — be the first!</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
