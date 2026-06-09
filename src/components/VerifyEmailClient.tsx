"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { updateUser } = useAuth();

  // Derive the initial state from token presence so we never setState synchronously in the effect.
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState(token ? "" : "This link is missing its confirmation token.");
  const ran = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (ran.current) return; // guard against React 18 double-invoke in dev
    ran.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Could not confirm your email.");
        } else {
          setStatus("success");
          setMessage(data.message || "Your email has been confirmed.");
          updateUser({ email_verified: true });
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    })();
  }, [token, updateUser]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {status === "verifying" && <p className="text-gray-600">Confirming your email…</p>}
          {status === "success" && (
            <>
              <div className="text-4xl mb-3">✅</div>
              <h1 className="text-2xl font-bold text-[#1B3A5C] mb-2">Email Confirmed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link href="/account" className="inline-block px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl">
                Go to My Account
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <div className="text-4xl mb-3">⚠️</div>
              <h1 className="text-2xl font-bold text-[#1B3A5C] mb-2">Couldn&apos;t Confirm</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link href="/account" className="inline-block px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl">
                Go to My Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
