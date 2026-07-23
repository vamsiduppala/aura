// ─────────────────────────────────────────────────────────────────────────────
// Vimsottari Dasa — Ch 16. The 120-year nakshatra dasa, the most-used timing system.
// Standalone reference + computation (the engine has its own date-accurate version; this
// one is for the knowledge API/mentor). Verified against the book's Example 50
// (Dhanishtha → Mars, balance 0.32125).
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

/** Dasa order (the nakshatra-lord cycle, starting from Ketu) and each lord's length in years. */
export const VIMSHOTTARI_ORDER: Graha[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
export const VIMSHOTTARI_YEARS: Record<Graha, number> = {
  ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17,
};
export const VIMSHOTTARI_TOTAL = 120;

const NAK_SPAN = 360 / 27; // 13°20'

/** The Vimsottari lord of a nakshatra (0..26) — the order repeats every 9. */
export const nakshatraLord = (nak: number): Graha => VIMSHOTTARI_ORDER[(((nak % 27) + 27) % 27) % 9]!;

export interface DashaBalance {
  nakshatra: number;   // 0..26 the Moon occupies
  lord: Graha;         // ruler of that nakshatra → the birth mahadasa
  fractionLeft: number; // fraction of the nakshatra yet to be traversed (= fraction of the first dasa left)
  yearsLeft: number;   // years of the first mahadasa remaining at birth
}

/** The balance of the first (birth) mahadasa from the Moon's sidereal longitude. */
export function dashaBalanceAtBirth(moonLong: number): DashaBalance {
  const L = ((moonLong % 360) + 360) % 360;
  const nak = Math.floor(L / NAK_SPAN);
  const lord = nakshatraLord(nak);
  const fractionLeft = 1 - (L - nak * NAK_SPAN) / NAK_SPAN;
  return { nakshatra: nak, lord, fractionLeft, yearsLeft: VIMSHOTTARI_YEARS[lord] * fractionLeft };
}

/** The 9 lords in dasa order starting from `start` (works for mahadasa or any sub-level). */
export function dashaSequence(start: Graha): Graha[] {
  const i = VIMSHOTTARI_ORDER.indexOf(start);
  return Array.from({ length: 9 }, (_, k) => VIMSHOTTARI_ORDER[(i + k) % 9]!);
}

/** Length (in years) of a sub-period: parent's years × child's share of 120. Composes to any depth. */
export function subPeriodYears(parentYears: number, childLord: Graha): number {
  return (parentYears * VIMSHOTTARI_YEARS[childLord]) / VIMSHOTTARI_TOTAL;
}

export interface DashaSpan { lord: Graha; years: number }

/** The antardasas of a mahadasa: each sub-lord in order, with its length in years. */
export function antardashas(mahaLord: Graha): DashaSpan[] {
  const mahaYears = VIMSHOTTARI_YEARS[mahaLord];
  return dashaSequence(mahaLord).map((lord) => ({ lord, years: subPeriodYears(mahaYears, lord) }));
}

/** The names of the Vimsottari sub-period levels, by depth (0 = the mahadasa itself). */
export const DASHA_LEVELS = ['mahadasa', 'antardasa', 'pratyantardasa', 'sookshma', 'prana', 'deha'] as const;

export interface DashaNode { lord: Graha; years: number; children?: DashaNode[] }

/**
 * Recursively subdivide a Vimsottari period into `depth` further levels — each period splits into 9
 * sub-periods (in dasa order from its own lord, each proportional to its share of 120). depth 0 is a
 * leaf; 1 gives antardasas, 2 pratyantardasas, 3 sookshma, 4 prana, 5 deha. The same fractal split
 * at every level (16.x), so it composes to any depth. `years` is the period's own length.
 */
export function subdivideDasha(lord: Graha, years: number, depth: number): DashaNode {
  if (depth <= 0) return { lord, years };
  const children = dashaSequence(lord).map((sub) => subdivideDasha(sub, subPeriodYears(years, sub), depth - 1));
  return { lord, years, children };
}

/** kshema / utpanna / adhana variation stars — start the dasa from the 4th/5th/8th nakshatra. */
export const DASHA_VARIATION_OFFSET = { kshema: 3, utpanna: 4, adhana: 7 } as const;
