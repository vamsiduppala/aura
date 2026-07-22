// ─────────────────────────────────────────────────────────────────────────────
// Rasi dasas that share Narayana's length rule — Ch 19 Lagna Kendradi, Ch 20 Sudasa,
// Ch 21 Drigdasa. Kendradi/Sudasa use the quadrant-based (Lakshmi) movement; Drigdasa
// uses an aspect-based (drishti) movement. All dasa lengths come from `narayanaDasaLength`.
// Verified against the book's Examples 76/77/80.
// ─────────────────────────────────────────────────────────────────────────────

import { rasiDrishti } from './aspects.js';

const mod12 = (n: number): number => ((n % 12) + 12) % 12;
const oddFooted = (s: number): boolean => mod12(s) % 6 < 3;

// ── Ch 19/20: Kendradi (quadrant-based) progression ───────────────────────────
/** Kendras (1/4/7/10), then panapharas (2/5/8/11), then apoklimas (3/6/9/12) from the seed. */
export function kendradiProgression(seed: number, forward: boolean): number[] {
  const s = mod12(seed);
  const dir = forward ? 1 : -1;
  const groups = [[0, 3, 6, 9], [1, 4, 7, 10], [2, 5, 8, 11]];
  const out: number[] = [];
  for (const g of groups) for (const off of g) out.push(mod12(s + dir * off));
  return out;
}

/** Lagna Kendradi Rasi Dasa (Ch 19): forward if the lagna is an odd SIGN; Saturn→forward, Ketu→reversed. */
export function lagnaKendradiDasa(seed: number, lagnaSign: number, hasSaturn = false, hasKetu = false): number[] {
  let forward = mod12(lagnaSign) % 2 === 0; // odd sign (0-indexed even) → forward
  if (hasSaturn) forward = true;
  if (hasKetu) forward = !forward;
  return kendradiProgression(seed, forward);
}

export interface Sudasa { progression: number[]; firstDasaFraction: number }

/** Sudasa (Ch 20): Kendradi from Sree Lagna's sign; first dasa's balance from SL's degree. */
export function sudasa(slSign: number, slDegree: number): Sudasa {
  const forward = mod12(slSign) % 2 === 0;
  return {
    progression: kendradiProgression(slSign, forward),
    firstDasaFraction: (30 - (((slDegree % 30) + 30) % 30)) / 30,
  };
}

// ── Ch 21: Drigdasa (aspect-based) progression ────────────────────────────────
export interface RasiSpan { rasi: number; years: number }

/** Dasa years by modality for Niryaana Shoola / Sthira etc: movable 7, fixed 8, dual 9. */
export const MODALITY_YEARS = [7, 8, 9];

/**
 * Niryaana Shoola dasa (Ch 22): from the stronger of the 2nd/8th house (seed), forward if
 * the seed is an odd SIGN else backward; each rasi's dasa is 7/8/9 years by its modality.
 * Antardasas follow the Narayana rule (use `narayanaAntardashas(start, years)`).
 */
export function niryaanaShoolaDasa(seed: number): RasiSpan[] {
  const s = mod12(seed);
  const dir = s % 2 === 0 ? 1 : -1; // odd sign (0-indexed even) → forward
  return Array.from({ length: 12 }, (_, k) => {
    const rasi = mod12(s + dir * k);
    return { rasi, years: MODALITY_YEARS[rasi % 3]! };
  });
}

/**
 * Shoola dasa (Ch 23): from the dasa seed (stronger of lagna/7th), ALWAYS zodiacal; each
 * dasa is `yearsPerDasa` (default 9 = the human gestation in months). Used to time death /
 * suffering (with the strongest ethics caveat — never surfaced as a prediction).
 */
export function shoolaDasa(seed: number, yearsPerDasa = 9): RasiSpan[] {
  const s = mod12(seed);
  return Array.from({ length: 12 }, (_, k) => ({ rasi: mod12(s + k), years: yearsPerDasa }));
}

/** The 12 equal Shoola antardasas: zodiacal from the antardasa seed, each `yearsPerDasa` months. */
export function shoolaAntardashas(antarSeed: number, yearsPerDasa = 9): { rasi: number; months: number }[] {
  const s = mod12(antarSeed);
  return Array.from({ length: 12 }, (_, k) => ({ rasi: mod12(s + k), months: yearsPerDasa }));
}

/**
 * Drigdasa (Ch 21): from the 9th house, take it + the 3 signs it aspects (rasi drishti),
 * in the walk direction set by that house's foot; then the same for the 10th and 11th.
 */
export function drigdasa(lagnaSign: number): number[] {
  const out: number[] = [];
  for (const h of [9, 10, 11]) {
    const house = mod12(lagnaSign + (h - 1));
    const forward = oddFooted(house);
    const aspected = new Set(rasiDrishti(house));
    const group = [house];
    for (let k = 1; k < 12 && group.length < 4; k++) {
      const sign = mod12(house + (forward ? 1 : -1) * k);
      if (aspected.has(sign)) group.push(sign);
    }
    out.push(...group);
  }
  return out;
}
