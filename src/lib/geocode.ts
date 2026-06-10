// Server-side geocoding via the Google Geocoding API, with deliberate location
// blurring for privacy. We never store or expose an exact address point — the
// returned coordinates are offset by a randomized few-hundred-meter amount, so a
// map pin lands in the right area but never on the actual home.
//
// Returns null (and the display simply won't appear on the map) if the key is
// unset, the request fails, or nothing matched — geocoding never blocks a submit.

const KEY = process.env.GOOGLE_GEOCODING_KEY;

// How far (meters) we blur the geocoded point — roughly several blocks.
const FUZZ_MIN_M = 120;
const FUZZ_MAX_M = 350;

export interface GeoInput {
  address?: string | null;
  neighborhood?: string | null;
  city: string;
  state?: string;
}

// Prefer the coarsest meaningful locality so Google returns an area, not a rooftop.
function buildQuery({ address, neighborhood, city, state = "TX" }: GeoInput): string | null {
  if (neighborhood) return `${neighborhood}, ${city}, ${state}`;
  if (address) return `${address}, ${city}, ${state}`;
  if (city) return `${city}, ${state}`;
  return null;
}

// Offset a point by a random distance/direction so it no longer marks the exact spot.
function blur(lat: number, lng: number): { lat: number; lng: number } {
  const dist = FUZZ_MIN_M + Math.random() * (FUZZ_MAX_M - FUZZ_MIN_M);
  const angle = Math.random() * 2 * Math.PI;
  const dLat = (dist * Math.cos(angle)) / 111320;
  const dLng = (dist * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: Number((lat + dLat).toFixed(6)), lng: Number((lng + dLng).toFixed(6)) };
}

export async function geocodeApprox(
  input: GeoInput
): Promise<{ latitude: number; longitude: number } | null> {
  if (!KEY) return null;
  const query = buildQuery(input);
  if (!query) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&region=us&key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) {
      if (data.status && data.status !== "ZERO_RESULTS") {
        console.error("Geocoding non-OK status:", data.status, data.error_message || "");
      }
      return null;
    }

    const loc = data.results[0].geometry?.location;
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;

    const { lat, lng } = blur(loc.lat, loc.lng);
    return { latitude: lat, longitude: lng };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}
