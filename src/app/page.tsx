import Link from "next/link";

const regions = [
  { name: "Dallas–Fort Worth", slug: "dfw", cities: "Dallas, Fort Worth, Plano, Frisco, Arlington", icon: "🏙️" },
  { name: "Houston", slug: "houston", cities: "Houston, Sugar Land, The Woodlands, Katy", icon: "🚀" },
  { name: "Austin", slug: "austin", cities: "Austin, Round Rock, Georgetown", icon: "🎸" },
  { name: "San Antonio", slug: "san-antonio", cities: "San Antonio, New Braunfels, Windcrest", icon: "🌵" },
  { name: "East Texas", slug: "east-texas", cities: "Longview, Tyler", icon: "🌲" },
  { name: "Central Texas", slug: "central-texas", cities: "Waco, College Station, Johnson City", icon: "🤠" },
  { name: "South Texas", slug: "south-texas", cities: "Corpus Christi, McAllen", icon: "🌴" },
  { name: "West Texas & Panhandle", slug: "west-texas", cities: "El Paso, Lubbock, Amarillo", icon: "🏜️" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Best Texas Display",
  "url": "https://besttexasdisplay.com",
  "description": "Discover, share, and vote for the most spectacular holiday decoration displays across Texas.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://besttexasdisplay.com/cities/{search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1B3A5C] via-[#1B3A5C] to-[#2C5F8A] text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">⭐</div>
          <div className="absolute top-20 right-20 text-4xl">✨</div>
          <div className="absolute bottom-10 left-1/3 text-5xl">🌟</div>
          <div className="absolute bottom-20 right-10 text-3xl">💫</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Texas&apos;s Best Holiday
              <span className="text-[#D4A843] block">Decoration Displays</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
              Share your spectacular holiday display, vote for your favorites across the Lone Star State, 
              and discover the most dazzling Christmas lights, Halloween haunts, and more — city by city.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/submit"
                className="px-8 py-4 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Submit Your Display
              </Link>
              <Link
                href="/leaderboard"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border-2 border-white/30 transition-all"
              >
                Vote Now
              </Link>
              <Link
                href="/map"
                className="px-8 py-4 bg-[#D4A843] hover:bg-[#C49B3A] text-[#1B3A5C] font-bold text-lg rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore the Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-[#1B3A5C] mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Submit", desc: "Upload photos of your holiday display and tell us about it. Include your city and address to appear on the map.", icon: "📸" },
              { step: "2", title: "Vote", desc: "Browse displays across Texas and vote for your favorites. One vote per display per season — vote in any city you like.", icon: "🗳️" },
              { step: "3", title: "Win", desc: "Top-voted displays earn Best Texas Display awards with a commemorative yard sign and statewide bragging rights.", icon: "🏆" },
            ].map((item) => (
              <div key={item.step} className="text-center p-8 rounded-2xl bg-[#F8F6F1] hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#C0392B] text-white text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#1B3A5C] mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Seasons */}
      <section className="py-16 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-[#1B3A5C] mb-4">Active Contests</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Submissions and voting are open for these holiday seasons. Get your display listed today!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-8 text-white shadow-lg">
              <div className="text-5xl mb-4">🎃</div>
              <h3 className="text-2xl font-bold mb-2">Halloween 2026</h3>
              <p className="text-orange-100 mb-4">October 1 — November 5, 2026</p>
              <p className="text-sm text-orange-100 mb-6">
                Haunted yards, spooky displays, and creative Halloween decorations across Texas.
              </p>
              <Link href="/leaderboard?season=1" className="inline-block px-6 py-2 bg-white text-orange-700 font-semibold rounded-lg hover:bg-orange-50 transition-colors">
                View Entries
              </Link>
            </div>
            <div className="bg-gradient-to-br from-red-700 to-green-800 rounded-2xl p-8 text-white shadow-lg">
              <div className="text-5xl mb-4">🎄</div>
              <h3 className="text-2xl font-bold mb-2">Christmas 2026</h3>
              <p className="text-green-100 mb-4">November 15, 2026 — January 15, 2027</p>
              <p className="text-sm text-green-100 mb-6">
                The main event. Christmas lights, yard displays, and full-house spectacles statewide.
              </p>
              <Link href="/leaderboard?season=2" className="inline-block px-6 py-2 bg-white text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors">
                View Entries
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Region */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-[#1B3A5C] mb-4">Browse by Region</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Explore holiday displays across every corner of the Lone Star State.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region) => (
              <Link
                key={region.slug}
                href={`/leaderboard?region=${region.slug}`}
                className="group bg-[#F8F6F1] rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
              >
                <div className="text-3xl mb-3">{region.icon}</div>
                <h3 className="text-lg font-bold text-[#1B3A5C] group-hover:text-[#C0392B] transition-colors">
                  {region.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{region.cities}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#C0392B] to-[#A93226] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Show Off Your Display?</h2>
          <p className="text-lg text-red-100 mb-8">
            Join hundreds of Texas decorators competing for the title of Best Texas Display. 
            It&apos;s free to enter, free to vote, and winners get a commemorative yard sign.
          </p>
          <Link
            href="/submit"
            className="inline-block px-10 py-4 bg-white text-[#C0392B] font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Submit Your Display Now
          </Link>
        </div>
      </section>

      {/* SEO Content Block */}
      <section className="py-12 bg-[#F8F6F1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#1B3A5C] mb-4">About Best Texas Display</h2>
          <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
            <p>
              BestTexasDisplay.com is the first statewide platform dedicated to celebrating Texas&apos;s holiday decoration community. 
              Whether you go all out with Christmas lights every December, transform your yard into a Halloween haunt in October, 
              or decorate for the Fourth of July, this is your stage.
            </p>
            <p>
              Our interactive map helps families plan driving tours of the best displays in their area, 
              from the legendary Windcrest Light-Up in San Antonio to the spectacular neighborhoods of Grapevine, 
              the Christmas Capital of Texas. Vote for your favorites at the city level and statewide, 
              and help crown each season&apos;s Best Texas Display winners.
            </p>
            <p>
              Proudly covering all major Texas metros — Dallas–Fort Worth, Houston, Austin, San Antonio, 
              El Paso — and everywhere in between. Submit your display today and join the community.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
