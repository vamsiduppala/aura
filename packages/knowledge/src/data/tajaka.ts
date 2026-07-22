// ─────────────────────────────────────────────────────────────────────────────
// Tajaka (annual chart) techniques — Ch 28. Muntha (progressed lagna, 1 rasi/year),
// the six Tajaka aspects + deeptamsa orbs, and Harsha Bala (the "cheerfulness strength").
// Verified against the book's Example 119.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** Muntha: the natal lagna progressed one rasi per year of life. `yearNumber` = the year
 *  being lived (e.g. 32 for the 32nd year). Returns the muntha sign (0..11). */
export function muntha(lagnaSign: number, yearNumber: number): number {
  return mod12(lagnaSign + (yearNumber - 1));
}

/** How muntha in each house colours the year (28.1). */
export const MUNTHA_IN_HOUSE: Record<number, string> = {
  1: 'health', 2: 'wealth', 3: 'success', 4: 'disputes and loss of position', 5: 'fame',
  6: 'illness', 7: 'troubles in marriage and hardships', 8: 'troubles', 9: 'prosperity',
  10: 'status', 11: 'gains', 12: 'expenditures',
};

// ── Tajaka aspects (28.2) ─────────────────────────────────────────────────────
export interface TajakaAspect { name: string; houses: number[]; nature: 'benefic' | 'malefic' | 'neutral'; strength: 'strong' | 'weak' | 'neutral' }

export const TAJAKA_ASPECTS: TajakaAspect[] = [
  { name: 'trine', houses: [5, 9], nature: 'benefic', strength: 'strong' },
  { name: 'sextile', houses: [3, 11], nature: 'benefic', strength: 'weak' },
  { name: 'square', houses: [4, 10], nature: 'malefic', strength: 'weak' },
  { name: 'conjunction', houses: [1], nature: 'malefic', strength: 'strong' },
  { name: 'opposition', houses: [7], nature: 'malefic', strength: 'strong' },
  { name: 'semi-sextile', houses: [2, 12], nature: 'neutral', strength: 'neutral' },
];

/** Deeptamsa — the orb (in degrees) of a planet's aspect. */
export const DEEPTAMSA: Record<Graha, number> = {
  sun: 15, moon: 12, mars: 8, mercury: 7, jupiter: 9, venus: 7, saturn: 9, rahu: 0, ketu: 0,
};

// ── Harsha Bala (28.3) ────────────────────────────────────────────────────────
/** The house each planet is "cheerful" (harsha) in — gives 5 units there. */
export const HARSHA_HOUSE: Record<Graha, number> = {
  sun: 9, moon: 3, mars: 6, mercury: 1, jupiter: 11, venus: 5, saturn: 12, rahu: 0, ketu: 0,
};
const FEMININE: Graha[] = ['moon', 'mercury', 'venus', 'saturn'];

/**
 * Harsha bala of a planet (0–20 units): +5 for being in its harsha house, +5 for
 * exaltation/own sign, +5 for a feminine planet in 1/2/3/7/8/9 or a masculine planet in
 * 4/5/6/10/11/12, and +5 for matching the year's day (masc) / night (fem) start.
 */
export function harshaBala(graha: Graha, house: number, exaltedOrOwn: boolean, dayBirth: boolean): number {
  let b = 0;
  const h = mod12(house - 1) + 1;
  const fem = FEMININE.includes(graha);
  if (HARSHA_HOUSE[graha] === h) b += 5;
  if (exaltedOrOwn) b += 5;
  const genderHouses = fem ? [1, 2, 3, 7, 8, 9] : [4, 5, 6, 10, 11, 12];
  if (genderHouses.includes(h)) b += 5;
  if (dayBirth !== fem) b += 5; // day → masculine, night → feminine
  return b;
}
