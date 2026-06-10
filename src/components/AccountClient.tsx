"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface MyDisplay {
  id: number;
  title: string;
  city: string;
  status: string;
  vote_count: number;
  created_at: string;
}

interface ProfileData {
  id: number;
  email: string;
  display_name: string;
  role: string;
  city: string | null;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function AccountClient() {
  const { user, token, loading, updateUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displays, setDisplays] = useState<MyDisplay[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect to login if not authenticated.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setDisplays(data.displays);
      }
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading || !user) {
    return <div className="min-h-[60vh]" />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold text-[#1B3A5C]">My Account</h1>

      {profile && !profile.email_verified && (
        <VerifyBanner token={token!} onVerified={() => { updateUser({ email_verified: true }); loadProfile(); }} />
      )}

      {loadingData || !profile ? (
        <Card title="Profile"><p className="text-gray-400">Loading…</p></Card>
      ) : (
        <ProfileSection key={profile.id} profile={profile} token={token!} onSaved={(u) => { updateUser(u); loadProfile(); }} />
      )}

      <ChangePasswordSection token={token!} />

      <MySubmissions displays={displays} loading={loadingData} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-[#1B3A5C] mb-4">{title}</h2>
      {children}
    </section>
  );
}

function VerifyBanner({ token, onVerified }: { token: string; onVerified: () => void }) {
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const [devLink, setDevLink] = useState("");

  const resend = async () => {
    setSending(true);
    setNote("");
    setDevLink("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNote(data.message || "Confirmation email sent.");
      if (data.devLink) setDevLink(data.devLink);
      if (data.message === "Your email is already confirmed.") onVerified();
    } catch {
      setNote("Could not send. Please try again.");
    }
    setSending(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <p className="font-semibold text-amber-900">Please confirm your email address.</p>
      <p className="text-sm text-amber-800 mt-1">
        We sent you a confirmation link. Didn&apos;t get it?{" "}
        <button onClick={resend} disabled={sending} className="underline font-medium disabled:opacity-60">
          {sending ? "Sending…" : "Resend it"}
        </button>
      </p>
      {note && <p className="text-sm text-amber-900 mt-2">{note}</p>}
      {devLink && (
        <p className="text-sm mt-2">
          <span className="font-semibold text-amber-900">Dev mode:</span>{" "}
          <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="text-[#C0392B] underline break-all">
            Click here to confirm
          </Link>
        </p>
      )}
    </div>
  );
}

function ProfileSection({
  profile,
  token,
  onSaved,
}: {
  profile: ProfileData;
  token: string;
  onSaved: (u: { display_name: string; city: string | null }) => void;
}) {
  // Mounted with key={profile.id}, so these initializers run once per profile load.
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [city, setCity] = useState(profile.city || "");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNote("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ display_name: displayName, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error || "Could not save.");
      } else {
        setNote("Saved.");
        onSaved({ display_name: data.user.display_name, city: data.user.city });
      }
    } catch {
      setNote("Something went wrong.");
    }
    setSaving(false);
  };

  return (
    <Card title="Profile">
      <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-[#1B3A5C] flex items-center gap-2">
                {profile.email}
                {profile.email_verified ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Unverified</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Member since</span>
              <p className="font-medium text-[#1B3A5C]">{formatDate(profile.created_at)}</p>
            </div>
            <div>
              <span className="text-gray-500">Last login</span>
              <p className="font-medium text-[#1B3A5C]">{formatDate(profile.last_login_at)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">Display Name</label>
            <input
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">City</label>
            <input
              value={city} onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {note && <span className="text-sm text-gray-600">{note}</span>}
          </div>
      </form>
    </Card>
  );
}

function ChangePasswordSection({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote("");
    setError("");
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not change password.");
      } else {
        setNote("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
      }
    } catch {
      setError("Something went wrong.");
    }
    setSaving(false);
  };

  return (
    <Card title="Change Password">
      <form onSubmit={submit} className="space-y-4 max-w-md">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8}
            placeholder="At least 8 characters"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">Confirm New Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none" required />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg disabled:opacity-60">
            {saving ? "Updating…" : "Update Password"}
          </button>
          {note && <span className="text-sm text-green-700">{note}</span>}
        </div>
      </form>
    </Card>
  );
}

function MySubmissions({ displays, loading }: { displays: MyDisplay[]; loading: boolean }) {
  return (
    <Card title="My Submissions">
      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : displays.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You haven&apos;t submitted any displays yet.{" "}
          <Link href="/submit" className="text-[#C0392B] font-medium hover:underline">Submit one</Link>.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {displays.map((d) => (
            <li key={d.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/displays/${d.id}`} className="font-medium text-[#1B3A5C] hover:underline">{d.title}</Link>
                <p className="text-sm text-gray-500">{d.city} · {d.vote_count} votes</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/displays/${d.id}/edit`} className="text-sm text-[#C0392B] font-medium hover:underline">
                  Edit
                </Link>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  d.status === "approved" ? "bg-green-100 text-green-700"
                  : d.status === "rejected" ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
                }`}>
                  {d.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
