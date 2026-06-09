"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setDevLink("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || "If an account exists for that email, a reset link has been sent.");
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Reset Your Password</h1>
          <p className="text-gray-600 mt-2">Enter your email and we&apos;ll send you a reset link</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {message ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                {message}
              </div>
              {devLink && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Dev mode — email not actually sent.</p>
                  <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="text-[#C0392B] underline break-all">
                    Click here to reset your password
                  </Link>
                </div>
              )}
              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-[#C0392B] font-medium hover:underline">Back to login</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Email</label>
                <input
                  type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-[#C0392B] font-medium hover:underline">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
