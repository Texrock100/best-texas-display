"use client";

import { useState } from "react";

type RequestType = "remove_location" | "remove_home";

export default function HomeownerPreference({ displayId }: { displayId: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [choice, setChoice] = useState<RequestType | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!choice) {
      setError("Please choose what you'd like us to do.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/removal-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_id: displayId,
          requester_name: name,
          requester_email: email,
          requested_type: choice,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Could not submit your request.");
      else setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
        <p className="text-sm text-gray-600">
          Not all homes are added by their owners. If this is your home and you have preferences
          regarding being on the map or on the site at all,{" "}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[#C0392B] font-semibold hover:underline"
          >
            click here
          </button>
          .
        </p>

        {open && !done && (
          <form onSubmit={submit} className="mt-5 space-y-4 max-w-xl">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1B3A5C] mb-1">Your Name</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1B3A5C] mb-1">Your Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 -mt-2">
              We ask for your name and email so we can verify you&apos;re connected to this home before acting.
            </p>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-[#1B3A5C] mb-1">What would you like?</legend>
              <label className={`block border rounded-lg p-3 cursor-pointer ${choice === "remove_location" ? "border-[#C0392B] bg-red-50" : "border-gray-200"}`}>
                <div className="flex items-start gap-3">
                  <input type="radio" name="choice" className="mt-1" checked={choice === "remove_location"} onChange={() => setChoice("remove_location")} />
                  <span>
                    <span className="font-semibold text-[#1B3A5C]">Remove location</span>
                    <span className="block text-sm text-gray-600">Take this off the map so visitors aren&apos;t directed to the home. The photo stays on the site for voting.</span>
                  </span>
                </div>
              </label>
              <label className={`block border rounded-lg p-3 cursor-pointer ${choice === "remove_home" ? "border-[#C0392B] bg-red-50" : "border-gray-200"}`}>
                <div className="flex items-start gap-3">
                  <input type="radio" name="choice" className="mt-1" checked={choice === "remove_home"} onChange={() => setChoice("remove_home")} />
                  <span>
                    <span className="font-semibold text-[#1B3A5C]">Remove home</span>
                    <span className="block text-sm text-gray-600">Take this display off the site entirely — photo and listing.</span>
                  </span>
                </div>
              </label>
            </fieldset>

            <div>
              <label className="block text-sm font-semibold text-[#1B3A5C] mb-1">Anything else? <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none resize-none"
              />
            </div>

            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-lg disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        )}

        {done && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            Thanks — your request has been received and will be reviewed. We may email you to confirm.
          </div>
        )}
      </div>
    </section>
  );
}
