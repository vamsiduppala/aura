// ─────────────────────────────────────────────────────────────────────────────
// Arudha Padas — Ch 9. The arudha of a house is its "image" — how its matters are
// perceived in the material world (maya), as opposed to how they truly are. This
// module encodes the computation (verified against the book's worked examples) plus
// the classical names and use of each arudha.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { RASI_BY_INDEX } from './rasis.js';

const norm = (n: number): number => ((n % 12) + 12) % 12;

/** Co-lords of the two dual-ruled signs (used when picking the stronger lord). */
export const CO_LORD: Partial<Record<number, Graha>> = { 10: 'rahu', 7: 'ketu' }; // Aq / Sc

/**
 * The arudha pada sign (0..11) for a house, from the sign the house occupies and the
 * sign its lord occupies. Rules (Ch 9.2):
 *   count = signs from house-sign to lord-sign (zodiacal, inclusive);
 *   arudha = that many signs onward from the lord-sign (inclusive);
 *   if the arudha lands in the 1st or 7th from the house-sign, take the 10th from it.
 */
export function arudhaOf(houseSign: number, lordSign: number): number {
  const hs = norm(houseSign);
  const ls = norm(lordSign);
  const count = ((ls - hs + 12) % 12) + 1;      // inclusive zodiacal count
  let a = (ls + count - 1) % 12;                 // same count onward, inclusive
  const diff = (a - hs + 12) % 12;
  if (diff === 0 || diff === 6) a = (a + 9) % 12; // 1st or 7th → 10th from there
  return a;
}

/** The sign(s) each graha owns (0=Aries). Dual-lords list both; the stronger is used. */
export const OWN_SIGNS: Record<Graha, number[]> = {
  sun: [4], moon: [3], mars: [0, 7], mercury: [2, 5], jupiter: [8, 11],
  venus: [1, 6], saturn: [9, 10], rahu: [10], ketu: [7],
};

/**
 * Graha arudha pada (Ch 9.5): the "image" of a planet. Same rule as the bhava arudha but
 * counted from the sign the planet occupies to its (stronger) owned sign.
 */
export const grahaArudha = (planetSign: number, ownedSign: number): number => arudhaOf(planetSign, ownedSign);

/**
 * All nine graha arudhas keyed by graha. `signOf` gives each planet's sign; `pickOwned`
 * (optional) chooses the stronger of a dual-lord's two signs (defaults to the first/primary).
 */
export function grahaArudhas(
  signOf: (g: Graha) => number,
  pickOwned?: (g: Graha, owned: number[]) => number,
): Record<Graha, number> {
  const out = {} as Record<Graha, number>;
  for (const g of Object.keys(OWN_SIGNS) as Graha[]) {
    const owned = OWN_SIGNS[g];
    const ownedSign = owned.length === 1 ? owned[0]! : (pickOwned ? pickOwned(g, owned) : owned[0]!);
    out[g] = grahaArudha(signOf(g), ownedSign);
  }
  return out;
}

/**
 * All twelve arudha padas keyed by house number (1..12). `signOf` returns the sign a
 * planet occupies; `stronger` (optional) picks the stronger of two co-lords for the
 * dual-ruled signs Aquarius (Saturn/Rahu) and Scorpio (Mars/Ketu).
 */
export function allArudhas(
  lagnaSign: number,
  signOf: (g: Graha) => number,
  stronger?: (a: Graha, b: Graha) => Graha,
): Record<number, number> {
  const out: Record<number, number> = {};
  for (let h = 1; h <= 12; h++) {
    const houseSign = norm(lagnaSign + (h - 1));
    const primary = RASI_BY_INDEX(houseSign).lord;
    const co = CO_LORD[houseSign];
    const lord = co && stronger ? stronger(primary, co) : primary;
    out[h] = arudhaOf(houseSign, signOf(lord));
  }
  return out;
}

/** Classical names for each arudha pada (Table 18). A1 = Arudha Lagna, A12 = Upapada. */
export const ARUDHA_NAMES: Record<number, { code: string; names: string[] }> = {
  1: { code: 'AL', names: ['Arudha Lagna', 'Pada Lagna'] },
  2: { code: 'A2', names: ['Dhanarudha', 'Vittarudha'] },
  3: { code: 'A3', names: ['Bhatrarudha', 'Vikramarudha'] },
  4: { code: 'A4', names: ['Matri pada', 'Vahana pada', 'Sukha pada'] },
  5: { code: 'A5', names: ['Mantra pada', 'Putrarudha', 'Buddhi pada'] },
  6: { code: 'A6', names: ['Roga pada', 'Satru pada'] },
  7: { code: 'A7', names: ['Dara pada'] },
  8: { code: 'A8', names: ['Mrityu pada', 'Kashta pada'] },
  9: { code: 'A9', names: ['Bhagya pada', 'Pitri pada', 'Dharma pada'] },
  10: { code: 'A10', names: ['Karma pada', 'Swarga pada', 'Rajya pada'] },
  11: { code: 'A11', names: ['Labha pada'] },
  12: { code: 'UL', names: ['Upapada Lagna', 'Vyayarudha', 'Moksha pada'] },
};

/** What key arudhas signify + how they are used (Ch 9.3–9.4). */
export const ARUDHA_USE: Record<string, string> = {
  AL: 'How you are perceived in the world — your image, status and “maya”, as opposed to your true self (lagna). The 11th and 12th from AL show material gains and expenditures.',
  A2: 'The image of your wealth and resources — how prosperous you seem.',
  A9: 'The image of your fortune, dharma and father — perceived luck and values.',
  A10: 'The image of your career and standing in the world — your public reputation.',
  UL: 'The image of your partner and marriage — the spouse and the commitments you take on (12th-house arudha).',
};

export interface ArudhaResult { house: number; code: string; names: string[]; sign: number; use?: string }

/** Convenience: all arudhas as labelled results (name + code + sign + use note). */
export function arudhaTable(
  lagnaSign: number,
  signOf: (g: Graha) => number,
  stronger?: (a: Graha, b: Graha) => Graha,
): ArudhaResult[] {
  const signs = allArudhas(lagnaSign, signOf, stronger);
  return Object.entries(ARUDHA_NAMES).map(([h, meta]) => {
    const house = Number(h);
    const res: ArudhaResult = { house, code: meta.code, names: meta.names, sign: signs[house]! };
    if (ARUDHA_USE[meta.code]) res.use = ARUDHA_USE[meta.code];
    return res;
  });
}
