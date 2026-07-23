// Transit (gochara) reference — Ch 25. The classical favourable houses for each planet
// counted from the natal Moon (janma rasi). A transit through a favourable house tends
// to support that planet's themes; through others it asks for more care. Encoded as
// structured data (our own concise phrasing); the specific result always depends on
// what the planet rules in the natal chart.

import type { Graha } from '../types.js';

export interface TransitRule {
  graha: Graha;
  /** Houses from the natal Moon (1..12) where this transit is traditionally favourable. */
  favourableHouses: number[];
  /** One-line sense of the planet's transit texture. */
  note: string;
}

export const TRANSIT_FROM_MOON: Record<string, TransitRule> = {
  sun: { graha: 'sun', favourableHouses: [3, 6, 10, 11], note: 'visibility, vitality and recognition ebb and flow with the Sun’s house from your Moon' },
  moon: { graha: 'moon', favourableHouses: [1, 3, 6, 7, 10, 11], note: 'the ~2.25-day mood texture — where the transiting Moon sits colours the day' },
  mars: { graha: 'mars', favourableHouses: [3, 6, 11], note: 'drive and friction; favourable in the effort/gain houses, testing elsewhere' },
  mercury: { graha: 'mercury', favourableHouses: [2, 4, 6, 8, 10, 11], note: 'thinking, talking and deals sharpen or scatter by house' },
  jupiter: { graha: 'jupiter', favourableHouses: [2, 5, 7, 9, 11], note: 'the year’s luck and growth — where Jupiter transits is where doors tend to open' },
  venus: { graha: 'venus', favourableHouses: [1, 2, 3, 4, 5, 8, 9, 11, 12], note: 'ease, warmth and pleasure; broadly gentle, most houses favourable' },
  saturn: { graha: 'saturn', favourableHouses: [3, 6, 11], note: 'the slow, structural pressure — Sade Sati is Saturn over the 12th/1st/2nd from the Moon' },
  rahu: { graha: 'rahu', favourableHouses: [3, 6, 10, 11], note: 'restless amplification and craving; favourable in the striving houses' },
  ketu: { graha: 'ketu', favourableHouses: [3, 6, 11], note: 'detachment and dissolution; favourable in the effort/gain houses' },
};

/** Is a planet's transit through `houseFromMoon` (1..12) traditionally favourable? */
export function isFavourableTransit(graha: Graha, houseFromMoon: number): boolean {
  return TRANSIT_FROM_MOON[graha]?.favourableHouses.includes(houseFromMoon) ?? false;
}

/** Sade Sati phase from Saturn's house relative to the natal Moon (12th/1st/2nd). */
export function sadeSatiPhase(saturnHouseFromMoon: number): 'rising' | 'peak' | 'setting' | null {
  return saturnHouseFromMoon === 12 ? 'rising'
    : saturnHouseFromMoon === 1 ? 'peak'
      : saturnHouseFromMoon === 2 ? 'setting' : null;
}

// ── Rasi Gochara Vedha (Ch 26.3, Table 63) ────────────────────────────────────
// Even in a favourable transit house (from natal Moon), a planet is "obstructed" (vedha)
// if another planet sits in its vedha sthaana — then it cannot give its good results.
// Map: per planet, favourable house → its vedha (obstruction) house.
export const VEDHA_STHAANA: Record<Graha, Record<number, number>> = {
  sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  moon: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  mars: { 3: 12, 6: 9, 11: 5 },
  mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  saturn: { 3: 12, 6: 9, 11: 5 },
  rahu: {}, ketu: {},
};

/** Father–son pairs that never cause vedha on each other. */
export const VEDHA_EXCEPTIONS: [Graha, Graha][] = [['sun', 'saturn'], ['moon', 'mercury']];
const isExceptionPair = (a: Graha, b: Graha): boolean =>
  VEDHA_EXCEPTIONS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** The vedha (obstruction) house for a planet's favourable transit house, or null if that house isn't favourable. */
export function vedhaHouse(graha: Graha, favourableHouse: number): number | null {
  return VEDHA_STHAANA[graha]?.[favourableHouse] ?? null;
}

/**
 * Which transiting planets obstruct `graha`'s favourable transit in `favourableHouse`.
 * `occupantsByHouse` maps a house-from-natal-Moon (1..12) to the planets transiting there.
 * Sun↔Saturn and Moon↔Mercury never obstruct each other.
 */
export function vedhaObstructors(
  graha: Graha, favourableHouse: number, occupantsByHouse: Partial<Record<number, Graha[]>>,
): Graha[] {
  const vh = vedhaHouse(graha, favourableHouse);
  if (vh == null) return [];
  return (occupantsByHouse[vh] ?? []).filter((o) => o !== graha && !isExceptionPair(graha, o));
}

// ── Timing with Sodhya Pinda (Ch 25.6, Table 61) ──────────────────────────────
// Fix the planet + house for a matter, take the rekhas that planet has in that house (its own
// BAV), multiply by the planet's sodhya pinda; the product mod 27 gives the nakshatra and mod 12
// the rasi where a Saturn transit hurts the matter and a Jupiter transit helps it.

type TimingPlanet = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn';

/** Table 61 — the matter Parasara ties to each planet + the house counted from it. */
export const SODHYA_PINDA_MATTERS: Record<TimingPlanet, { house: number; matter: string }> = {
  sun: { house: 9, matter: 'father' },
  moon: { house: 4, matter: 'mother' },
  mars: { house: 3, matter: 'siblings' },
  mercury: { house: 10, matter: 'profession' },
  jupiter: { house: 5, matter: 'children' },
  venus: { house: 7, matter: 'marriage' },
  saturn: { house: 8, matter: 'longevity' },
};

export interface SodhyaTiming {
  product: number;      // rekhas × sodhya pinda
  nakshatra: number;    // 1..27 (Aswini..Revathi); a 0 remainder wraps to 27 (Revathi)
  rasi: number;         // 1..12 (Aries..Pisces); a 0 remainder wraps to 12 (Pisces)
  /** The 10th and 19th nakshatras from it — same Vimsottari lord, so they act together. */
  companionNakshatras: [number, number];
}

/**
 * Time a matter from a planet's sodhya pinda (25.6). `rekhas` = the bindus that planet has in the
 * target house within its own BAV; `pinda` = its sodhya pinda. Saturn transiting the returned
 * nakshatra/rasi troubles the matter; Jupiter transiting it supports the matter.
 */
export function sodhyaPindaTiming(rekhas: number, pinda: number): SodhyaTiming {
  const product = rekhas * pinda;
  const nak = product % 27 === 0 ? 27 : product % 27;
  const rasi = product % 12 === 0 ? 12 : product % 12;
  const from = (n: number): number => ((nak - 1 + n) % 27) + 1;
  return { product, nakshatra: nak, rasi, companionNakshatras: [from(9), from(18)] };
}
