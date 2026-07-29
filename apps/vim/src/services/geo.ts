// Birthplace lookup. The user types a place name; we resolve everything else — latitude,
// longitude, the IANA zone, and the UTC offset that applied *at their birth moment*.
// Nobody should have to know their own coordinates, and nobody should have to work out
// whether daylight saving was in force on the day they were born.
//
// Geocoder: Open-Meteo. Free, no key, CORS-enabled, and it returns the IANA timezone
// alongside the coordinates — which is exactly what a historically-correct offset needs.
//
// Real lookups only. There is no built-in city list and no fallback coordinates: an
// unreachable geocoder yields an empty result and a visible message, never a guess.

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
  country?: string; admin1?: string; population?: number;
}

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export class GeoUnavailable extends Error {
  constructor() {
    super("Couldn't reach the place lookup. Check your connection and try again.");
    this.name = 'GeoUnavailable';
  }
}

/**
 * Search places by name. Throws `GeoUnavailable` when the lookup itself fails, so the
 * caller can say so out loud rather than showing an empty list that looks like
 * "no such place". An abort is silent — that's a keystroke, not a failure.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  let res: Response;
  try {
    res = await fetch(
      `${ENDPOINT}?name=${encodeURIComponent(q)}&count=8&language=en&format=json`,
      signal ? { signal } : {},
    );
  } catch (e) {
    if ((e as Error).name === 'AbortError') return [];
    throw new GeoUnavailable();
  }
  if (!res.ok) throw new GeoUnavailable();
  const data = (await res.json()) as { results?: RawHit[] };
  return (data.results ?? []).map((r) => {
    const admin = r.admin1 ?? '';
    const label = [r.name, admin && admin !== r.name ? admin : '', r.country ?? '']
      .filter(Boolean).join(', ');
    return {
      id: r.id, label, name: r.name, country: r.country ?? '', admin,
      lat: r.latitude, lng: r.longitude,
      timezone: r.timezone ?? 'UTC',
      ...(r.population != null ? { population: r.population } : {}),
    };
  });
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
 * daylight saving included, historically correct. India has been +05:30 since 1955 but ran
 * wartime DST 1942–45; Britain in June 1976 was +01:00. Using today's offset instead of the
 * one in force on the birth date shifts the chart by up to an hour, which is up to ten
 * months of drift in every daśā boundary.
 *
 * We only know the *local* wall time, and an instant is required to ask what the offset was,
 * so we iterate: assume the wall time is UTC, read that offset, shift the instant by it, read
 * again. Two passes settle every real case, including times near a transition.
 *
 * Returns null if the zone is unknown, so the caller can ask rather than guess.
 */
export function offsetMinutesFor(
  timeZone: string, dateISO: string, timeHHMM?: string,
): number | null {
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

/** "+5:30" / "−8:00" — how an offset is shown to a human. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
}
