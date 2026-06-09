"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset password.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Choose a New Password</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!token ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              This link is missing its reset token. Please use the link from your email, or{" "}
              <Link href="/forgot-password" className="underline font-medium">request a new one</Link>.
            </div>
          ) : done ? (
            <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
              Your password has been reset. Redirecting you to log in…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#1B3A5C] mb-2">New Password</label>
                <input
                  type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  minLength={8} placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Confirm Password</label>
                <input
                  type="password" id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
