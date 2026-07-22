// ─────────────────────────────────────────────────────────────────────────────
// Ashtottari Dasa — Ch 17. A 108-year conditional dasa over 8 lords (no Ketu). Each
// lord rules an unequal arc of the zodiac (alternating 53°20'/40°). Verified against the
// book's Example 59 (Moon 24° Leo → Moon dasa, 0.4 of the arc left) + the Rahu wrap.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

export const ASHTOTTARI_ORDER: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'saturn', 'jupiter', 'rahu', 'venus'];
export const ASHTOTTARI_YEARS: Record<Graha, number> = {
  sun: 6, moon: 15, mars: 8, mercury: 17, saturn: 10, jupiter: 19, rahu: 12, venus: 21,
  ketu: 0, // Ketu has no Ashtottari dasa
};
export const ASHTOTTARI_TOTAL = 108;

/** Each lord's arc: start longitude + length (Rahu's wraps past 360°). */
const ARCS: { lord: Graha; start: number; len: number }[] = [
  { lord: 'venus', start: 26 + 40 / 60, len: 40 },
  { lord: 'sun', start: 66 + 40 / 60, len: 53 + 20 / 60 },
  { lord: 'moon', start: 120, len: 40 },
  { lord: 'mars', start: 160, len: 53 + 20 / 60 },
  { lord: 'mercury', start: 213 + 20 / 60, len: 40 },
  { lord: 'saturn', start: 253 + 20 / 60, len: 40 },
  { lord: 'jupiter', start: 293 + 20 / 60, len: 40 },
  { lord: 'rahu', start: 333 + 20 / 60, len: 53 + 20 / 60 }, // 333°20'–386°40' (wraps to 26°40')
];

export interface AshtottariBalance { lord: Graha; fractionLeft: number; yearsLeft: number }

/** The birth Ashtottari dasa (lord of the Moon's arc) + how much of it remains. */
export function ashtottariBalanceAtBirth(moonLong: number): AshtottariBalance {
  const L = mod360(moonLong);
  for (const arc of ARCS) {
    const end = arc.start + arc.len;
    const Ladj = end > 360 && L < arc.start ? L + 360 : L; // handle Rahu's wrap
    if (Ladj >= arc.start && Ladj < end) {
      const fractionLeft = (end - Ladj) / arc.len;
      return { lord: arc.lord, fractionLeft, yearsLeft: ASHTOTTARI_YEARS[arc.lord] * fractionLeft };
    }
  }
  // Fallback (shouldn't happen): treat as start of Venus.
  return { lord: 'venus', fractionLeft: 1, yearsLeft: ASHTOTTARI_YEARS.venus };
}

export interface DashaSpan { lord: Graha; years: number }

/**
 * Antardasas of an Ashtottari mahadasa. The FIRST antar is the lord AFTER the maha lord
 * (not the maha lord itself); the last antar is the maha lord. Lengths share the maha in
 * proportion to the 108-year weights.
 */
export function ashtottariAntardashas(mahaLord: Graha): DashaSpan[] {
  const i = ASHTOTTARI_ORDER.indexOf(mahaLord);
  const mahaYears = ASHTOTTARI_YEARS[mahaLord];
  return Array.from({ length: 8 }, (_, k) => {
    const lord = ASHTOTTARI_ORDER[(i + 1 + k) % 8]!;
    return { lord, years: (mahaYears * ASHTOTTARI_YEARS[lord]) / ASHTOTTARI_TOTAL };
  });
}
