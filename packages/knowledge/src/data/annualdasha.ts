// ─────────────────────────────────────────────────────────────────────────────
// Annual (Tajaka) dasas — Ch 30. Mudda dasa (Varsha Vimsottari): Vimsottari compressed to
// a 360-solar-day year (dasa years × 3 = days). The first dasa is set by the Mudda number
// of the natal Moon-nakshatra lord + completed years. Verified vs the book's Example 122.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { nakshatraLord, dashaSequence, VIMSHOTTARI_YEARS } from './vimshottari.js';

/** Mudda numbering order (1=Sun … 9=Venus) used to pick the first Varsha Vimsottari dasa. */
export const MUDDA_ORDER: Graha[] = ['sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', 'ketu', 'venus'];

/** Days of a planet's Mudda (Varsha Vimsottari) dasa = its Vimsottari years × 3 (120y → 360 days). */
export const muddaDays = (g: Graha): number => VIMSHOTTARI_YEARS[g] * 3;

export interface MuddaSpan { lord: Graha; days: number }
export interface MuddaResult {
  firstDasa: Graha;
  balanceDays: number;              // days of the first dasa remaining at the year's start
  sequence: MuddaSpan[];            // the 9 dasas in order, each with its day-length
}

/**
 * Mudda dasa for a solar-return year. `moonLong` = natal Moon's sidereal longitude,
 * `completedYears` = years of life completed at the year's start.
 */
export function muddaDasa(moonLong: number, completedYears: number): MuddaResult {
  const span = 360 / 27;
  const L = ((moonLong % 360) + 360) % 360;
  const nak = Math.floor(L / span);
  const num = MUDDA_ORDER.indexOf(nakshatraLord(nak)) + 1; // 1..9
  const n = ((num + completedYears - 1) % 9 + 9) % 9 + 1;   // 1..9 (0 → 9)
  const firstDasa = MUDDA_ORDER[n - 1]!;
  const fractionLeft = 1 - (L - nak * span) / span;
  return {
    firstDasa,
    balanceDays: fractionLeft * muddaDays(firstDasa),
    sequence: dashaSequence(firstDasa).map((lord) => ({ lord, days: muddaDays(lord) })),
  };
}
