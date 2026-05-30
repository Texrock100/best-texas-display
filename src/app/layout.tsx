import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";
import NavbarClient from "@/components/NavbarClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.besttexasdisplay.com"),
  title: {
    default: "Best Texas Display | Vote for Texas's Best Holiday Decorations",
    template: "%s | Best Texas Display",
  },
  description: "Discover, share, and vote for the most spectacular holiday decoration displays across Texas. From Christmas lights to Halloween haunts — find the best displays near you and plan your driving tour.",
  keywords: ["Texas holiday decorations", "Christmas lights Texas", "Halloween decorations Texas", "best Christmas displays", "holiday light contest", "Texas decoration contest", "Christmas light tour", "vote best decorations"],
  openGraph: {
    title: "Best Texas Display | Vote for Texas's Best Holiday Decorations",
    description: "Discover, share, and vote for the most spectacular holiday decoration displays across Texas.",
    url: "https://www.besttexasdisplay.com",
    siteName: "Best Texas Display",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Texas Display | Vote for Texas's Best Holiday Decorations",
    description: "Discover, share, and vote for the most spectacular holiday decoration displays across Texas.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

function Footer() {
  return (
    <footer className="bg-[#1B3A5C] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">⭐</span>
              <span className="text-xl font-bold text-white">
                Best<span className="text-[#D4A843]">Texas</span>Display
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              The home for Texas&apos;s most passionate holiday decorators. Share your display,
              vote for your favorites, and discover the best decorated homes across the Lone Star State.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/map" className="hover:text-[#D4A843] transition-colors">Interactive Map</Link></li>
              <li><Link href="/leaderboard" className="hover:text-[#D4A843] transition-colors">Leaderboard</Link></li>
              <li><Link href="/cities" className="hover:text-[#D4A843] transition-colors">Browse by City</Link></li>
              <li><Link href="/submit" className="hover:text-[#D4A843] transition-colors">Submit Your Display</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Seasons</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/leaderboard?season=christmas" className="hover:text-[#D4A843] transition-colors">Christmas 2026</Link></li>
              <li><Link href="/leaderboard?season=halloween" className="hover:text-[#D4A843] transition-colors">Halloween 2026</Link></li>
              <li><Link href="/blog" className="hover:text-[#D4A843] transition-colors">Blog & Tips</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} BestTexasDisplay.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F6F1]">
        <AuthProvider>
          <NavbarClient />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
