"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface Stats {
  totalUsers: number;
  totalDisplays: number;
  totalVotes: number;
  pendingReview: number;
  totalPhotos: number;
}

interface DisplayRow {
  id: number;
  title: string;
  city: string;
  region: string;
  status: string;
  featured: boolean;
  vote_count: number;
  created_at: string;
  owner_name: string;
  owner_email: string;
  season_name: string;
  photo_count: string;
}

type Tab = "overview" | "pending" | "approved" | "all";

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDisplays, setRecentDisplays] = useState<DisplayRow[]>([]);
  const [topCities, setTopCities] = useState<any[]>([]);
  const [displays, setDisplays] = useState<DisplayRow[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setRecentDisplays(data.recentDisplays);
      setTopCities(data.topCities);
    }
  }, [token]);

  const fetchDisplays = useCallback(async (status: string) => {
    if (!token) return;
    const param = status === "all" ? "" : `?status=${status}`;
    const res = await fetch(`/api/admin/displays${param}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setDisplays(data.displays);
    }
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchStats();
  }, [user, loading, router, fetchStats]);

  useEffect(() => {
    if (tab !== "overview") {
      fetchDisplays(tab);
    }
  }, [tab, fetchDisplays]);

  const updateDisplay = async (id: number, updates: { status?: string; featured?: boolean }) => {
    setActionLoading(id);
    await fetch("/api/admin/displays", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, ...updates }),
    });
    // Refresh
    if (tab === "overview") fetchStats();
    else fetchDisplays(tab);
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A5C]">Admin Dashboard</h1>
        {stats && stats.pendingReview > 0 && (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
            {stats.pendingReview} pending review
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8 max-w-lg">
        {([
          ["overview", "Overview"],
          ["pending", "Pending"],
          ["approved", "Approved"],
          ["all", "All Displays"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white text-[#1B3A5C] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Users", value: stats.totalUsers, color: "text-[#1B3A5C]" },
              { label: "Displays", value: stats.totalDisplays, color: "text-[#1B3A5C]" },
              { label: "Votes", value: stats.totalVotes, color: "text-[#D4A843]" },
              { label: "Pending", value: stats.pendingReview, color: stats.pendingReview > 0 ? "text-amber-600" : "text-green-600" },
              { label: "Photos", value: stats.totalPhotos, color: "text-[#1B3A5C]" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Displays */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-4">Recent Submissions</h2>
              {recentDisplays.length === 0 ? (
                <p className="text-gray-400 text-sm">No submissions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentDisplays.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1B3A5C] truncate">{d.title}</p>
                        <p className="text-xs text-gray-400">{d.city} &bull; {d.owner_name || "Unknown"}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${
                        d.status === "approved" ? "bg-green-100 text-green-700" :
                        d.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-4">Top Cities</h2>
              {topCities.length === 0 ? (
                <p className="text-gray-400 text-sm">No approved displays yet</p>
              ) : (
                <div className="space-y-3">
                  {topCities.map((c, i) => (
                    <div key={c.city} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                        <p className="text-sm font-semibold text-[#1B3A5C]">{c.city}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#1B3A5C]">{c.display_count} displays</p>
                        <p className="text-xs text-gray-400">{c.total_votes || 0} votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab !== "overview" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Display</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Season</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Photos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Votes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displays.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No displays found</td>
                  </tr>
                ) : (
                  displays.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <a href={`/displays/${d.id}`} className="text-sm font-semibold text-[#1B3A5C] hover:underline">
                          {d.title}
                        </a>
                        <p className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.season_name || '-'}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{d.owner_name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{d.owner_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.photo_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#D4A843]">{d.vote_count}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          d.status === "approved" ? "bg-green-100 text-green-700" :
                          d.status === "pending" ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {d.status !== "approved" && (
                            <button
                              onClick={() => updateDisplay(d.id, { status: "approved" })}
                              disabled={actionLoading === d.id}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {d.status !== "rejected" && (
                            <button
                              onClick={() => updateDisplay(d.id, { status: "rejected" })}
                              disabled={actionLoading === d.id}
                              className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => updateDisplay(d.id, { featured: !d.featured })}
                            disabled={actionLoading === d.id}
                            className={`text-xs px-3 py-1 rounded-lg disabled:opacity-50 ${
                              d.featured
                                ? "bg-[#D4A843] text-white hover:bg-[#b8913a]"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          >
                            {d.featured ? "★ Featured" : "Feature"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
