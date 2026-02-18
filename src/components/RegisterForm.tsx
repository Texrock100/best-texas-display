"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ display_name: "", email: "", city: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await register({
      email: form.email,
      password: form.password,
      display_name: form.display_name,
      city: form.city || undefined,
    });

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Registration failed");
    }
    setSubmitting(false);
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B3A5C]">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join the Texas decoration community</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="display_name" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Display Name</label>
              <input
                type="text" id="display_name" value={form.display_name} onChange={update("display_name")}
                placeholder="How others will see you"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Email</label>
              <input
                type="email" id="email" value={form.email} onChange={update("email")}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-[#1B3A5C] mb-2">
                Your City <span className="font-normal text-gray-400">(for local voting)</span>
              </label>
              <input
                type="text" id="city" value={form.city} onChange={update("city")}
                placeholder="e.g., Fort Worth"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Password</label>
              <input
                type="password" id="password" value={form.password} onChange={update("password")}
                minLength={8} placeholder="At least 8 characters"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit" disabled={submitting}
              className="w-full px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link href="/login" className="text-[#C0392B] font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
