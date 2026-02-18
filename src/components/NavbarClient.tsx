"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function NavbarClient() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#1B3A5C] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/favicon.svg" alt="BestTexasDisplay" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">
              Best<span className="text-[#D4A843]">Texas</span>Display
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-[#D4A843] transition-colors font-medium">Home</Link>
            <Link href="/submit" className="hover:text-[#D4A843] transition-colors font-medium">Submit Display</Link>
            <Link href="/map" className="hover:text-[#D4A843] transition-colors font-medium">Map</Link>
            <Link href="/leaderboard" className="hover:text-[#D4A843] transition-colors font-medium">Leaderboard</Link>
            <Link href="/cities" className="hover:text-[#D4A843] transition-colors font-medium">Cities</Link>
          </div>

          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:inline text-sm text-gray-300">Hi, {user.display_name}</span>
                {user.role === "admin" && (
                  <Link href="/admin" className="text-xs px-2 py-1 bg-[#D4A843] text-[#1B3A5C] rounded font-bold">
                    Admin
                  </Link>
                )}
                <button onClick={logout}
                  className="px-4 py-2 text-sm font-medium hover:text-[#D4A843] transition-colors">
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login"
                  className="hidden sm:inline-block px-4 py-2 text-sm font-medium hover:text-[#D4A843] transition-colors">
                  Log In
                </Link>
                <Link href="/register"
                  className="px-4 py-2 bg-[#C0392B] hover:bg-[#A93226] text-white text-sm font-semibold rounded-lg transition-colors">
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block py-2 hover:text-[#D4A843]">Home</Link>
            <Link href="/submit" onClick={() => setMobileOpen(false)} className="block py-2 hover:text-[#D4A843]">Submit Display</Link>
            <Link href="/map" onClick={() => setMobileOpen(false)} className="block py-2 hover:text-[#D4A843]">Map</Link>
            <Link href="/leaderboard" onClick={() => setMobileOpen(false)} className="block py-2 hover:text-[#D4A843]">Leaderboard</Link>
            <Link href="/cities" onClick={() => setMobileOpen(false)} className="block py-2 hover:text-[#D4A843]">Cities</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
