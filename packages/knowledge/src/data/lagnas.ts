// ─────────────────────────────────────────────────────────────────────────────
// Special Lagnas — Ch 5. Bhava, Hora, Ghati and Sree lagnas. The first three advance
// from the Sun's sunrise longitude at fixed rates; Sree lagna comes from the Moon's
// fraction through its nakshatra. Verified against the book's worked examples.
// ─────────────────────────────────────────────────────────────────────────────

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

/**
 * Bhava lagna (BL). Advances 1° per minute from the Sun's sunrise longitude
 * (the book's method + example; its "one rasi per 2 hours" prose is inconsistent with
 * the worked example, which we follow). Defined for completeness.
 */
export function bhavaLagna(sunLongAtSunrise: number, minutesSinceSunrise: number): number {
  return mod360(sunLongAtSunrise + minutesSinceSunrise);
}

/** Hora lagna (HL) — self from the money/wealth point of view. 1 rasi per hour (0.5°/min). */
export function horaLagna(sunLongAtSunrise: number, minutesSinceSunrise: number): number {
  return mod360(sunLongAtSunrise + minutesSinceSunrise / 2);
}

/** Ghati lagna (GL) — self from the fame/power point of view. 1 rasi per ghati/24min (1.25°/min). */
export function ghatiLagna(sunLongAtSunrise: number, minutesSinceSunrise: number): number {
  return mod360(sunLongAtSunrise + (minutesSinceSunrise * 5) / 4);
}

/**
 * Sree lagna (SL) — important for prosperity. Add the Moon's fraction-through-its-nakshatra
 * (as a fraction of the whole 360°) to the lagna's longitude.
 */
export function sreeLagna(moonLong: number, lagnaLong: number): number {
  const span = 360 / 27; // one nakshatra = 13°20'
  const frac = (((moonLong % span) + span) % span) / span;
  return mod360(lagnaLong + frac * 360);
}

export const SPECIAL_LAGNA_USE: Record<string, string> = {
  BL: 'Bhava lagna — defined for completeness; not commonly used on its own.',
  HL: 'Hora lagna — you, seen through money, wealth and prosperity (key for business timing).',
  GL: 'Ghati lagna — you, seen through fame, power and authority (key for political/leadership timing).',
  SL: 'Sree lagna — prosperity and Lakshmi’s grace; used in the Sudasa timing system.',
};

export interface SpecialLagnas { BL: number; HL: number; GL: number; SL: number }

/** All four special lagnas at once from sunrise data + Moon/lagna longitudes. */
export function specialLagnas(
  sunLongAtSunrise: number,
  minutesSinceSunrise: number,
  moonLong: number,
  lagnaLong: number,
): SpecialLagnas {
  return {
    BL: bhavaLagna(sunLongAtSunrise, minutesSinceSunrise),
    HL: horaLagna(sunLongAtSunrise, minutesSinceSunrise),
    GL: ghatiLagna(sunLongAtSunrise, minutesSinceSunrise),
    SL: sreeLagna(moonLong, lagnaLong),
  };
}

// ── 7.3 Common references for houses ─────────────────────────────────────────
// Houses can be counted from several reference points; each shows the matter from a
// different angle of "self". Encoded from Ch 7.3 (our own concise phrasing).
export interface HouseReference { key: string; name: string; shows: string }

export const HOUSE_REFERENCES: HouseReference[] = [
  { key: 'lagna', name: 'Lagna', shows: 'the true self — intentions, knowledge, persistence; the default reference' },
  { key: 'chandra', name: 'Chandra lagna (Moon)', shows: 'the mind\u2019s view — happiness, ambition, how one experiences a matter' },
  { key: 'ravi', name: 'Ravi lagna (Sun)', shows: 'the soul\u2019s view and physical vitality' },
  { key: 'arudha', name: 'Arudha lagna', shows: 'the perceived self — status and how the world sees the native' },
  { key: 'paaka', name: 'Paaka lagna (sign of the lagna lord)', shows: 'the physically-existing self — e.g. memory from its 5th; Saturn transiting it saps vitality' },
  { key: 'karakamsa', name: 'Karakamsa (AK\u2019s navamsa sign)', shows: 'the inner self in D-9; the 12th from it shows the soul\u2019s liberation' },
  { key: 'ghati', name: 'Ghati lagna', shows: 'self as power — authority, rank and fame' },
  { key: 'hora', name: 'Hora lagna', shows: 'self as wealth — money matters' },
];

export const HOUSE_REFERENCE_EXAMPLE =
  'In D-24 (learning): success in competition = 5th from arudha lagna (perception), scholarship = 5th from lagna (true self), memory = 5th from paaka lagna (physical self).';
