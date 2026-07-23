// ─────────────────────────────────────────────────────────────────────────────
// Longevity — Ch 14. Marakas (killer houses/planets), the special 8th house used for
// Rudra (Table 32), and the "three pairs" longevity-range estimate (Table 33/34). The
// strength-dependent Rudra/Maheswara selection needs chart strengths + chara karakas, so
// this module gives the tables + the fully computable pieces. Ethics: never predict death
// — used only to flag careful periods gently (Ch 37 / product safety).
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { RASI_BY_INDEX } from './rasis.js';

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** The 2nd and 7th are the houses of death (maraka sthanas). */
export const MARAKA_HOUSES = [2, 7] as const;

/** The maraka planets: lords of the 2nd and 7th signs from the lagna. */
export function marakaLords(lagnaSign: number): Graha[] {
  return MARAKA_HOUSES.map((h) => RASI_BY_INDEX(mod12(lagnaSign + (h - 1))).lord);
}

/**
 * The special "8th house" sign for Rudra (Table 32) — NOT the ordinary 8th (odd rasis
 * count zodiacally, even rasis anti-zodiacally, per Shiva's motion). Indexed by rasi 0..11.
 */
export const RUDRA_8TH_SIGN = [7, 2, 9, 8, 3, 10, 1, 8, 3, 2, 9, 4];
export const rudra8thSign = (sign: number): number => RUDRA_8TH_SIGN[mod12(sign)]!;

export type LifeSpan = 'short' | 'middle' | 'long';
export type Modality = 'movable' | 'fixed' | 'dual';

/** Modality of a sign: 0 movable, 1 fixed, 2 dual. */
export function signModality(sign: number): Modality {
  return (['movable', 'fixed', 'dual'] as const)[mod12(sign) % 3]!;
}

/** Longevity category for one pair of points, by their modalities (Table 33, order-free). */
export function pairLongevity(a: Modality, b: Modality): LifeSpan {
  const key = [a, b].sort().join('+');
  const map: Record<string, LifeSpan> = {
    'movable+movable': 'long', 'dual+fixed': 'long',
    'fixed+movable': 'middle', 'dual+dual': 'middle',
    'dual+movable': 'short', 'fixed+fixed': 'short',
  };
  return map[key]!;
}

/** Approximate year ranges for each category. */
export const LONGEVITY_RANGES: Record<LifeSpan, [number, number]> = {
  short: [0, 36], middle: [36, 72], long: [72, 108],
};

/**
 * Combine the three pairs' categories (lagna-lord/8th-lord, Moon/Saturn, lagna/HL):
 * unanimous wins; otherwise the majority of two wins.
 */
export function combineThreePairs(cats: [LifeSpan, LifeSpan, LifeSpan]): LifeSpan {
  const count = { short: 0, middle: 0, long: 0 } as Record<LifeSpan, number>;
  for (const c of cats) count[c]++;
  return (Object.entries(count).sort((x, y) => y[1] - x[1])[0]![0]) as LifeSpan;
}

/**
 * Maheswara (Ch 14.3) — the lord of the 8th house from the Atmakaraka's sign; it shows the
 * channels through which the soul strives for liberation. `akSign` = the sign the AK
 * occupies (0..11). Core rule only: the exceptions (8th lord in own/exaltation → stronger of
 * its 8th/12th lords; Rahu/Ketu with AK or its 8th → use the 6th lord instead) need chart
 * strength/occupancy and are applied by the caller. Rahu/Ketu never lord a sign here, so the
 * Rahu→Mercury / Ketu→Jupiter substitution does not arise from the plain rule.
 */
export function maheswara(akSign: number): Graha {
  return RASI_BY_INDEX(mod12(akSign + 7)).lord;
}

export const LONGEVITY_NOTES: string[] = [
  'For good longevity the 3rd and 8th houses (houses of life) and their lords should be strong, and the 2nd and 7th (houses of death / marakas) and their lords weak.',
  'A malefic strongly conjoining or aspecting the 2nd/7th houses or their lords also acts as a maraka.',
  'The three-pairs method estimates only a broad range (short 0–36, middle 36–72, long 72–108 years); it is never used to predict a date of death.',
];
