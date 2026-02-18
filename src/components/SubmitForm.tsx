"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function SubmitForm() {
  const { user, token } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    region: "",
    address: "",
    neighborhood: "",
    season_id: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length);
    const validFiles = files.filter(
      (f) => (f.type === "image/jpeg" || f.type === "image/png") && f.size <= 10 * 1024 * 1024
    );

    if (validFiles.length < files.length) {
      setError("Some files were skipped (only JPG/PNG under 10MB accepted)");
    }

    setPhotos((prev) => [...prev, ...validFiles].slice(0, 5));

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !token) {
      router.push("/login");
      return;
    }

    if (!form.title || !form.city || !form.region || !form.season_id) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Create display entry
      const res = await fetch("/api/displays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          city: form.city,
          region: form.region,
          address: form.address || null,
          neighborhood: form.neighborhood || null,
          season_id: parseInt(form.season_id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit display");
        setSubmitting(false);
        return;
      }

      // Upload photos if any
      if (photos.length > 0 && data.display?.id) {
        for (let i = 0; i < photos.length; i++) {
          const formData = new FormData();
          formData.append("file", photos[i]);
          formData.append("display_id", data.display.id.toString());
          formData.append("sort_order", i.toString());

          await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
        }
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#1B3A5C] mb-4">Submit Your Display</h1>
          <p className="text-lg text-gray-600 mb-8">You need to be logged in to submit a display.</p>
          <div className="flex justify-center gap-4">
            <a href="/login" className="px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all">
              Log In
            </a>
            <a href="/register" className="px-6 py-3 bg-[#1B3A5C] hover:bg-[#15304d] text-white font-bold rounded-xl shadow transition-all">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-[#1B3A5C] mb-4">Display Submitted!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your display has been submitted for review. Most submissions are approved within 24 hours.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => { setSuccess(false); setForm({ title: "", description: "", city: "", region: "", address: "", neighborhood: "", season_id: "" }); setPhotos([]); setPreviews([]); }}
            className="px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all">
            Submit Another
          </button>
          <a href="/leaderboard" className="px-6 py-3 bg-[#1B3A5C] hover:bg-[#15304d] text-white font-bold rounded-xl shadow transition-all">
            View Leaderboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-[#1B3A5C] mb-4">Submit Your Display</h1>
        <p className="text-lg text-gray-600">
          Show Texas what you&apos;ve got! Upload photos of your holiday display,
          tell us where to find it, and get ready for votes from across the state.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Display Title *</label>
            <input type="text" id="title" value={form.title} onChange={update("title")}
              placeholder='e.g., The Griswold House of Fort Worth'
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700"
              required />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Description</label>
            <textarea id="description" value={form.description} onChange={update("description")} rows={4}
              placeholder="Tell us about your display — what inspired it, how many lights, any special features?"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700 resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-[#1B3A5C] mb-2">City *</label>
              <input type="text" id="city" value={form.city} onChange={update("city")} placeholder="e.g., Fort Worth"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700"
                required />
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Region *</label>
              <select id="region" value={form.region} onChange={update("region")}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700"
                required>
                <option value="">Select a region</option>
                <option value="DFW">Dallas–Fort Worth</option>
                <option value="Houston">Houston</option>
                <option value="Austin">Austin</option>
                <option value="San Antonio">San Antonio</option>
                <option value="Central Texas">Central Texas</option>
                <option value="East Texas">East Texas</option>
                <option value="South Texas">South Texas</option>
                <option value="El Paso">El Paso</option>
                <option value="Panhandle">Panhandle</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-[#1B3A5C] mb-2">
              Address <span className="text-gray-400 font-normal">(optional — needed for map placement)</span>
            </label>
            <input type="text" id="address" value={form.address} onChange={update("address")} placeholder="123 Main St"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700" />
            <p className="text-xs text-gray-400 mt-1">Your address is used only for map placement. You can enter just a neighborhood name instead if you prefer privacy.</p>
          </div>

          <div>
            <label htmlFor="neighborhood" className="block text-sm font-semibold text-[#1B3A5C] mb-2">
              Neighborhood <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input type="text" id="neighborhood" value={form.neighborhood} onChange={update("neighborhood")}
              placeholder="e.g., Tanglewood, Oak Lawn, Windcrest"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700" />
          </div>

          <div>
            <label htmlFor="season" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Season *</label>
            <select id="season" value={form.season_id} onChange={update("season_id")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700"
              required>
              <option value="">Select a season</option>
              <option value="1">🎃 Halloween 2026</option>
              <option value="2">🎄 Christmas 2026</option>
            </select>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">
              Photos <span className="text-gray-400 font-normal">(up to 5)</span>
            </label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple
              onChange={handleFileChange} className="hidden" />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 5 && (
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#C0392B] transition-colors cursor-pointer">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-gray-500 font-medium">Click or drag photos here</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB each • {5 - photos.length} remaining</p>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={submitting}
              className="w-full px-8 py-4 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Submitting..." : "Submit Display for Review"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Displays are reviewed before appearing on the site. Most submissions are approved within 24 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
