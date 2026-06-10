"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface Photo {
  id: number;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
}

export default function EditDisplayForm({ id }: { id: string }) {
  const { user, token, loading } = useAuth();
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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const load = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/displays/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { setForbidden(true); return; }
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) { setError("Could not load this display."); return; }
      const data = await res.json();
      const d = data.display;
      setForm({
        title: d.title || "",
        description: d.description || "",
        city: d.city || "",
        region: d.region || "",
        address: d.address || "",
        neighborhood: d.neighborhood || "",
        season_id: d.season_id ? String(d.season_id) : "",
      });
      setPhotos(data.photos || []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoadingData(false);
    }
  }, [id, token]);

  // Redirect to login if not authenticated; otherwise load the display.
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    load();
  }, [loading, user, router, load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNote("");

    if (!form.title || !form.city || !form.region || !form.season_id) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/displays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          city: form.city,
          region: form.region,
          address: form.address || null,
          neighborhood: form.neighborhood || null,
          season_id: parseInt(form.season_id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save changes.");
      } else {
        setNote("Changes saved.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  };

  // Upload newly chosen photos to the existing display, appended after current ones.
  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;

    const valid = files.filter(
      (f) => (f.type === "" || f.type.startsWith("image/")) && f.size <= 10 * 1024 * 1024
    );
    if (valid.length < files.length) {
      setError("Some files were skipped (images only, under 10MB each)");
    }
    if (valid.length === 0) return;

    setUploading(true);
    setNote("");
    try {
      for (let i = 0; i < valid.length; i++) {
        const formData = new FormData();
        formData.append("file", valid[i]);
        formData.append("display_id", id);
        formData.append("sort_order", String(photos.length + i));
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "A photo failed to upload.");
        }
      }
      await load();
    } catch {
      setError("Network error while uploading photos.");
    }
    setUploading(false);
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Remove this photo? This cannot be undone.")) return;
    setError("");
    const prev = photos;
    setPhotos((p) => p.filter((ph) => ph.id !== photoId)); // optimistic
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setPhotos(prev); // revert
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not delete photo.");
      }
    } catch {
      setPhotos(prev);
      setError("Network error while deleting photo.");
    }
  };

  // Move a photo one slot left/right and persist the new order.
  const movePhoto = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPhotos(reordered); // optimistic
    setError("");
    try {
      const res = await fetch(`/api/displays/${id}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order: reordered.map((p) => p.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos);
      } else {
        await load(); // resync on failure
        setError("Could not save photo order.");
      }
    } catch {
      await load();
      setError("Network error while reordering photos.");
    }
  };

  if (loading || !user) {
    return <div className="min-h-[60vh]" />;
  }

  if (forbidden) {
    return (
      <Shell>
        <p className="text-gray-600">You don&apos;t have permission to edit this display.</p>
        <Link href="/account" className="text-[#C0392B] font-medium hover:underline">← Back to My Account</Link>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <p className="text-gray-600">This display could not be found.</p>
        <Link href="/account" className="text-[#C0392B] font-medium hover:underline">← Back to My Account</Link>
      </Shell>
    );
  }

  if (loadingData) {
    return <Shell><p className="text-gray-400">Loading…</p></Shell>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A5C]">Edit Display</h1>
        <Link href={`/displays/${id}`} className="text-sm text-[#C0392B] font-medium hover:underline">
          View display →
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {/* Display fields */}
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Display Title *</label>
            <input type="text" id="title" value={form.title} onChange={update("title")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C0392B] focus:border-transparent outline-none transition-all text-gray-700"
              required />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-[#1B3A5C] mb-2">Description</label>
            <textarea id="description" value={form.description} onChange={update("description")} rows={4}
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

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {note && <span className="text-sm text-green-700">{note}</span>}
          </div>
        </form>

        {/* Photo management */}
        <div className="border-t border-gray-100 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1B3A5C]">Photos</h2>
            <span className="text-sm text-gray-400">{photos.length} photo{photos.length === 1 ? "" : "s"}</span>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group">
                  <img src={photo.thumbnail_url || photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] font-semibold bg-[#1B3A5C] text-white px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                  <button type="button" onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Delete photo">
                    ✕
                  </button>
                  <div className="absolute bottom-1 inset-x-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0}
                      className="w-6 h-6 bg-white/90 text-[#1B3A5C] rounded text-xs shadow disabled:opacity-30"
                      aria-label="Move left">←</button>
                    <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === photos.length - 1}
                      className="w-6 h-6 bg-white/90 text-[#1B3A5C] rounded text-xs shadow disabled:opacity-30"
                      aria-label="Move right">→</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-6">No photos yet. Add some below.</p>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-300 text-[#1B3A5C] font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60">
            {uploading ? "Uploading…" : "📸 Add Photos"}
          </button>
          <p className="text-xs text-gray-400 mt-2">JPG, PNG, or HEIC up to 10MB each. The first photo is used as the cover.</p>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-[#1B3A5C] mb-6">Edit Display</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">{children}</div>
    </div>
  );
}
