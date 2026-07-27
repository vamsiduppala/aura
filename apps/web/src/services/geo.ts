// Birthplace lookup. The user types a place name; we resolve everything else — latitude,
// longitude and the UTC offset that applied *at their birth moment* — so nobody has to know
// their coordinates or work out whether daylight saving was in effect that day.
//
// Geocoder: Open-Meteo's geocoding API. Free, no key, no attribution requirement, CORS-enabled,
// and it returns the IANA timezone alongside the coordinates — which is exactly what we need to
// get a historically-correct offset.

export interface PlaceHit {
  id: number;
  /** What we show and store, e.g. "Hyderabad, Telangana, India". */
  label: string;
  name: string;
  country: string;
  admin: string;
  lat: number;
  lng: number;
  /** IANA zone, e.g. "Asia/Kolkata" — the key to a correct historical offset. */
  timezone: string;
  population?: number;
}

interface RawHit {
  id: number; name: string; latitude: number; longitude: number; timezone?: string;
  country?: string; admin1?: string; admin2?: string; population?: number;
}

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

/** Search places by name. Returns [] on any failure — the caller stays usable offline. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url = `${ENDPOINT}?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RawHit[] };
    return (data.results ?? []).map((r) => {
      const admin = r.admin1 ?? '';
      const label = [r.name, admin && admin !== r.name ? admin : '', r.country ?? '']
        .filter(Boolean).join(', ');
      return {
        id: r.id, label, name: r.name, country: r.country ?? '', admin,
        lat: r.latitude, lng: r.longitude,
        timezone: r.timezone ?? 'UTC', population: r.population,
      };
    });
  } catch {
    return []; // offline, blocked, or aborted — the form still works via a manual entry
  }
}

/** Parse "GMT+05:30" / "GMT-8" / "GMT" into minutes east of UTC. */
function parseGmtOffset(s: string): number | null {
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(s);
  if (!m) return /GMT$/.test(s.trim()) ? 0 : null;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** The offset (minutes east of UTC) that `timeZone` was on at a given UTC instant. */
function offsetAtInstant(timeZone: string, instant: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(instant);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value;
    return name ? parseGmtOffset(name) : null;
  } catch {
    return null; // unknown zone
  }
}

/**
 * The UTC offset, in minutes, that applied at a wall-clock birth moment in `timeZone` —
 * daylight saving included, historically correct (India was +5:30, but Britain in June 1976
 * was +1:00, etc.).
 *
 * We only know the *local* time, and an instant is needed to ask what the offset was, so we
 * iterate: assume the wall time is UTC, read that offset, shift the instant by it, and read
 * again. Two passes settle every real case, including times near a DST transition.
 * Returns null if the zone is unknown, so the caller can fall back rather than guess.
 */
export function offsetMinutesFor(timeZone: string, dateISO: string, timeHHMM?: string): number | null {
  const wall = Date.parse(`${dateISO}T${(timeHHMM && timeHHMM.trim()) || '12:00'}:00Z`);
  if (!Number.isFinite(wall)) return null;
  let offset = offsetAtInstant(timeZone, new Date(wall));
  if (offset == null) return null;
  for (let i = 0; i < 2; i++) {
    const next = offsetAtInstant(timeZone, new Date(wall - offset * 60_000));
    if (next == null || next === offset) break;
    offset = next;
  }
  return offset;
}

/** "+5:30" / "−8:00" — how we show an offset to a human. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
}
