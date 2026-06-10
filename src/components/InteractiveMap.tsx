"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface MapDisplay {
  id: number;
  title: string;
  city: string;
  region: string;
  neighborhood: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  vote_count: number;
  season_id: number;
  holiday_type: string;
  season_name: string;
  thumbnail: string | null;
}

interface TourStop {
  display: MapDisplay;
  order: number;
}

const TEXAS_CENTER = { lat: 31.0, lng: -99.5 };
const MAX_TOUR_STOPS = 12;

const REGIONS = [
  "All Regions", "DFW", "Houston", "Austin", "San Antonio",
  "Central Texas", "East Texas", "South Texas", "El Paso", "Panhandle"
];

export default function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const [displays, setDisplays] = useState<MapDisplay[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<MapDisplay | null>(null);
  const [tour, setTour] = useState<TourStop[]>([]);
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API key
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    setHasApiKey(!!key && key.length > 5);
  }, []);

  // Fetch displays
  const fetchDisplays = useCallback(async () => {
    const params = new URLSearchParams();
    if (regionFilter !== "All Regions") params.set("region", regionFilter);
    const res = await fetch(`/api/displays/map?${params}`);
    if (res.ok) {
      const data = await res.json();
      setDisplays(data.displays);
    }
  }, [regionFilter]);

  useEffect(() => {
    fetchDisplays();
  }, [fetchDisplays]);

  // Load Google Maps
  useEffect(() => {
    if (!hasApiKey || mapLoaded) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, [hasApiKey, mapLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: TEXAS_CENTER,
      zoom: 6,
      // Cloud-based Map ID (BestTXDisplay project) — required for Advanced Markers.
      // Map styling (hiding POIs/transit, etc.) is configured on this Map ID in the
      // Google Cloud console, not via an inline `styles` array (which is ignored when
      // a mapId is present).
      mapId: "23e95ecd7045f2d84abbe190",
    });
  }, [mapLoaded]);

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.map = null);
    markersRef.current = [];

    displays.forEach((display) => {
      const isInTour = tour.some((s) => s.display.id === display.id);
      const tourIndex = tour.findIndex((s) => s.display.id === display.id);

      const pinEl = document.createElement("div");
      pinEl.className = "btd-marker";
      pinEl.innerHTML = isInTour
        ? `<div style="background:#D4A843;color:#1B3A5C;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid #1B3A5C;">${tourIndex + 1}</div>`
        : `<div style="background:${display.holiday_type === 'halloween' ? '#E67E22' : '#C0392B'};color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);">${display.holiday_type === 'halloween' ? '🎃' : '🎄'}</div>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: googleMapRef.current!,
        position: { lat: display.latitude, lng: display.longitude },
        content: pinEl,
        title: display.title,
      });

      marker.addListener("click", () => setSelectedDisplay(display));
      markersRef.current.push(marker);
    });
  }, [displays, tour, mapLoaded]);

  const addToTour = (display: MapDisplay) => {
    if (tour.length >= MAX_TOUR_STOPS) return;
    if (tour.some((s) => s.display.id === display.id)) return;
    setTour((prev) => [...prev, { display, order: prev.length + 1 }]);
  };

  const removeFromTour = (displayId: number) => {
    setTour((prev) =>
      prev.filter((s) => s.display.id !== displayId).map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  // Fallback map when no API key
  if (!hasApiKey) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1B3A5C] mb-4">Interactive Map</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find holiday displays near you and plan your driving tour.
            Select up to 12 stops for an optimized route.
          </p>
        </div>

        {/* Region filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                regionFilter === r
                  ? "bg-[#1B3A5C] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {r}
            </button>
          ))}
        </div>

        {/* List-based fallback */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tour Builder */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-3">
                Driving Tour ({tour.length}/{MAX_TOUR_STOPS})
              </h2>
              {tour.length === 0 ? (
                <p className="text-sm text-gray-400">Click &quot;Add to Tour&quot; on any display to start building your route.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {tour.map((stop) => (
                    <div key={stop.display.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#D4A843] text-[#1B3A5C] text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {stop.order}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1B3A5C] truncate">{stop.display.title}</p>
                          <p className="text-xs text-gray-400">{stop.display.city}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFromTour(stop.display.id)}
                        className="text-red-400 hover:text-red-600 text-sm ml-2 flex-shrink-0">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {tour.length >= 2 && (
                <a
                  href={`https://www.google.com/maps/dir/${tour.map((s) => `${s.display.latitude},${s.display.longitude}`).join("/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold rounded-xl shadow transition-all"
                >
                  Open Route in Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Display List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <p className="text-sm text-gray-500">
                  {displays.length} displays with addresses
                  {regionFilter !== "All Regions" ? ` in ${regionFilter}` : " across Texas"}
                </p>
              </div>
              {displays.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-3">📍</div>
                  <p className="text-gray-500">No mapped displays yet in this region.</p>
                  <p className="text-sm text-gray-400 mt-2">Displays need an address to appear on the map.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displays.map((d) => {
                    const isInTour = tour.some((s) => s.display.id === d.id);
                    return (
                      <div key={d.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <Link href={`/displays/${d.id}`} className="text-sm font-semibold text-[#1B3A5C] hover:underline">
                            {d.title}
                          </Link>
                          <p className="text-xs text-gray-400 mt-1">
                            {d.neighborhood ? `${d.neighborhood}, ` : ""}{d.city} &bull; {d.vote_count} votes
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-sm">{d.holiday_type === "halloween" ? "🎃" : "🎄"}</span>
                          {isInTour ? (
                            <button onClick={() => removeFromTour(d.id)}
                              className="text-xs px-3 py-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                              Remove
                            </button>
                          ) : tour.length < MAX_TOUR_STOPS ? (
                            <button onClick={() => addToTour(d)}
                              className="text-xs px-3 py-1 bg-[#1B3A5C] text-white rounded-lg hover:bg-[#15304d]">
                              + Tour
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Google Maps version
  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-[#1B3A5C]">Interactive Map</h1>
          <p className="text-xs text-gray-400 mt-1">{displays.length} displays with locations</p>
        </div>

        {/* Region filter */}
        <div className="p-3 border-b border-gray-100">
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C0392B] outline-none">
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Tour Builder */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1B3A5C] mb-2">
            Driving Tour ({tour.length}/{MAX_TOUR_STOPS})
          </h2>
          {tour.length === 0 ? (
            <p className="text-xs text-gray-400">Click a pin then &quot;Add to Tour&quot;</p>
          ) : (
            <>
              <div className="space-y-1 mb-3">
                {tour.map((stop) => (
                  <div key={stop.display.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#D4A843] text-[#1B3A5C] text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {stop.order}
                      </span>
                      <p className="text-xs font-medium text-[#1B3A5C] truncate">{stop.display.title}</p>
                    </div>
                    <button onClick={() => removeFromTour(stop.display.id)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                  </div>
                ))}
              </div>
              {tour.length >= 2 && (
                <a
                  href={`https://www.google.com/maps/dir/${tour.map((s) => `${s.display.latitude},${s.display.longitude}`).join("/")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center px-3 py-2 bg-[#C0392B] hover:bg-[#A93226] text-white font-bold text-sm rounded-lg">
                  Open Route in Google Maps
                </a>
              )}
            </>
          )}
        </div>

        {/* Display list */}
        <div className="divide-y divide-gray-50">
          {displays.map((d) => (
            <button key={d.id} onClick={() => {
              setSelectedDisplay(d);
              googleMapRef.current?.panTo({ lat: d.latitude, lng: d.longitude });
              googleMapRef.current?.setZoom(14);
            }}
              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                selectedDisplay?.id === d.id ? "bg-blue-50" : ""
              }`}>
              <p className="text-sm font-semibold text-[#1B3A5C] truncate">{d.title}</p>
              <p className="text-xs text-gray-400">{d.city} &bull; {d.vote_count} votes</p>
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Info card */}
        {selectedDisplay && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <button onClick={() => setSelectedDisplay(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">✕</button>
            <h3 className="font-bold text-[#1B3A5C] pr-6">{selectedDisplay.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {selectedDisplay.neighborhood ? `${selectedDisplay.neighborhood}, ` : ""}{selectedDisplay.city}
            </p>
            <p className="text-sm text-[#D4A843] font-semibold mt-1">{selectedDisplay.vote_count} votes</p>
            <div className="flex gap-2 mt-3">
              <Link href={`/displays/${selectedDisplay.id}`}
                className="flex-1 text-center text-sm px-3 py-2 bg-[#1B3A5C] text-white rounded-lg font-medium hover:bg-[#15304d]">
                View
              </Link>
              {!tour.some((s) => s.display.id === selectedDisplay.id) && tour.length < MAX_TOUR_STOPS && (
                <button onClick={() => addToTour(selectedDisplay)}
                  className="flex-1 text-sm px-3 py-2 bg-[#D4A843] text-[#1B3A5C] rounded-lg font-bold hover:bg-[#c49b3a]">
                  + Add to Tour
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
