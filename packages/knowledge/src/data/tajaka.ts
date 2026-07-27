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

// ── Pancha Vargeeya Bala components (28.4) ────────────────────────────────────
// Only the two fully-specified, worked-example-backed pieces are computed here: Uchcha bala
// (closeness to deep exaltation) and the Hadda (Egyptian term) lord table. The dignity-tier
// balas (kshetra/drekkana/navamsa/hadda-bala) are own/friend/enemy point lookups whose neutral
// (sama) tier the book leaves unstated, so they're left to a caller with an explicit convention.

/** The seven planets that have a classical exaltation point. */
export type ClassicalGraha = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn';

/** Deep-exaltation longitudes (0..360) — where each planet earns the full 20 units of uchcha bala. */
export const DEEP_EXALTATION: Record<ClassicalGraha, number> = {
  sun: 10, moon: 33, mars: 298, mercury: 165, jupiter: 95, venus: 357, saturn: 200,
};

/**
 * Uchcha bala (28.4.2): how close a planet is to its deep-exaltation point, 0–20 units. Full 20 at
 * deep exaltation, 0 at deep debilitation (exactly 180° away). `longitude` = sidereal longitude 0..360.
 */
export function uchchaBala(graha: ClassicalGraha, longitude: number): number {
  const debil = (DEEP_EXALTATION[graha] + 180) % 360;
  let diff = Math.abs((((longitude % 360) + 360) % 360) - debil);
  if (diff > 180) diff = 360 - diff;
  return 20 * (diff / 180);
}

/** Hadda (Egyptian term) lords, per sign 0..11, as [upperBoundDegree, lord] ascending (Table 72). */
export const HADDA_LORDS: [number, Graha][][] = [
  [[6, 'jupiter'], [12, 'venus'], [20, 'mercury'], [25, 'mars'], [30, 'saturn']],   // Ar
  [[8, 'venus'], [14, 'mercury'], [22, 'jupiter'], [27, 'saturn'], [30, 'mars']],   // Ta
  [[6, 'mercury'], [12, 'venus'], [17, 'jupiter'], [24, 'mars'], [30, 'saturn']],   // Ge
  [[7, 'mars'], [13, 'venus'], [19, 'mercury'], [26, 'jupiter'], [30, 'saturn']],   // Cn
  [[6, 'jupiter'], [11, 'venus'], [18, 'saturn'], [24, 'mercury'], [30, 'mars']],   // Le
  [[7, 'mercury'], [17, 'venus'], [21, 'jupiter'], [28, 'mars'], [30, 'saturn']],   // Vi
  [[6, 'saturn'], [14, 'mercury'], [21, 'jupiter'], [28, 'venus'], [30, 'mars']],   // Li
  [[7, 'mars'], [11, 'venus'], [19, 'mercury'], [24, 'jupiter'], [30, 'saturn']],   // Sc
  [[12, 'jupiter'], [17, 'venus'], [21, 'mercury'], [26, 'mars'], [30, 'saturn']],  // Sg
  [[7, 'mercury'], [14, 'jupiter'], [22, 'venus'], [26, 'saturn'], [30, 'mars']],   // Cp
  [[7, 'mercury'], [13, 'venus'], [20, 'jupiter'], [25, 'mars'], [30, 'saturn']],   // Aq
  [[12, 'venus'], [16, 'jupiter'], [19, 'mercury'], [28, 'mars'], [30, 'saturn']],  // Pi
];

/** The hadda (Egyptian term) lord of a sign (0..11) at a degree-within-sign (0..30) (28.4.3). */
export function haddaLord(sign: number, degreeInSign: number): Graha {
  const bounds = HADDA_LORDS[mod12(sign)]!;
  for (const [upper, lord] of bounds) if (degreeInSign < upper) return lord;
  return bounds[bounds.length - 1]![1]!; // exactly 30° → the last term
}

// ── Pancha Vargeeya Bala — the full set (28.4) ────────────────────────────────
// Units exactly as the book states them, per standing tier. The book enumerates own/friend/enemy
// only (no neutral tier), so the tier classification is the caller's, per their school.
export type TajakaTier = 'own' | 'friend' | 'enemy';

export const KSHETRA_BALA: Record<TajakaTier, number> = { own: 30, friend: 15, enemy: 7.5 };   // rasi chart
export const HADDA_BALA: Record<TajakaTier, number> = { own: 15, friend: 7.5, enemy: 3.75 };   // hadda lord
export const DREKKANA_BALA: Record<TajakaTier, number> = { own: 10, friend: 5, enemy: 2.5 };   // D-3
export const NAVAMSA_BALA: Record<TajakaTier, number> = { own: 5, friend: 2.5, enemy: 1.25 };  // D-9

export type PanchaVerdict = 'weak' | 'ordinary' | 'strong' | 'very strong' | 'extraordinarily strong';

/** The verdict bands of 28.4.6: <5 weak, 5–10 ordinary, 10–15 strong, 15–20 very strong, >20 extraordinary. */
export function panchaVerdict(total: number): PanchaVerdict {
  if (total < 5) return 'weak';
  if (total <= 10) return 'ordinary';
  if (total <= 15) return 'strong';
  if (total <= 20) return 'very strong';
  return 'extraordinarily strong';
}

export interface PanchaVargeeyaInput { kshetra: number; uchcha: number; hadda: number; drekkana: number; navamsa: number }

/** Pancha Vargeeya Bala (28.4.6): (kshetra + uchcha + hadda + drekkana + navamsa) / 4, with verdict. */
export function panchaVargeeyaBala(u: PanchaVargeeyaInput): { total: number; verdict: PanchaVerdict } {
  const total = (u.kshetra + u.uchcha + u.hadda + u.drekkana + u.navamsa) / 4;
  return { total, verdict: panchaVerdict(total) };
}
