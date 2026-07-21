// ─────────────────────────────────────────────────────────────────────────────
// Planetary strength (Shadbala-inspired, SPEC §4.3 "v2"). A principled composite of
// the reliably-computable classical strength sources, normalized to [0,1]:
//   • Sthana  — positional dignity, judged in BOTH rasi (D1) and navamsa (D9), plus
//               a vargottama bonus. (The single biggest accuracy win over bare dignity.)
//   • Dig     — directional strength: each planet is strong in a particular angle.
//   • Cheshta — motional strength: retrograde/among-the-swift planets are potent.
//   • Naisargika — fixed natural strength ranking.
//   • Paksha  — lunar-phase strength: benefics wax with the Moon, malefics wane.
// This is an honest subset of full Shadbala (no exact Rupa/Virupa units), chosen so
// every component is deterministic and testable. Total drives the lattice's loudness.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { dignityScalar } from './strength.js';

/** Naisargika (natural) strength, Parashari ranking normalized to [0,1]. */
const NAISARGIKA: Record<Graha, number> = {
  sun: 1.0, moon: 0.857, venus: 0.714, jupiter: 0.571,
  mercury: 0.429, mars: 0.286, saturn: 0.143, rahu: 0.3, ketu: 0.3,
};

/** House where each planet gets full directional (dig) strength. */
const DIG_STRONG_HOUSE: Record<Graha, number> = {
  sun: 10, mars: 10, jupiter: 1, mercury: 1, moon: 4, venus: 4, saturn: 7,
  rahu: 1, ketu: 7,
};

export interface StrengthInput {
  graha: Graha;
  sign: number;
  degInSign: number;
  navamsaSign: number;
  house: number;          // 1..12 from Lagna
  retrograde: boolean;
  combust: boolean;
  isBenefic: boolean;     // functional/natural polarity sign (+ = benefic)
  moonIllumination: number; // 0 (new) .. 1 (full)
}

export interface StrengthResult {
  total: number;          // [0,1]
  sthana: number;
  dig: number;
  cheshta: number;
  naisargika: number;
  paksha: number;
  vargottama: boolean;
}

/** Map a dignity scalar [-1,1] to a positive magnitude [0.1,1]. */
function dignityMag(scalar: number): number {
  return 0.1 + 0.45 * (scalar + 1);
}

/** Directional strength in [0,1]: full at the strong house, 0 at its opposite. */
function digBala(graha: Graha, house: number): number {
  const strong = DIG_STRONG_HOUSE[graha];
  const weak = ((strong + 6 - 1) % 12) + 1; // opposite house
  // circular house distance from the weak point, 0..6
  let d = Math.abs(house - weak);
  if (d > 6) d = 12 - d;
  return d / 6; // 0 at weak house, 1 at strong (which is 6 away)
}

export function planetStrength(inp: StrengthInput): StrengthResult {
  const vargottama = inp.sign === inp.navamsaSign;

  // Sthana: dignity in D1 and D9 (D9 uses mid-sign degree as we lack a D9 degree).
  const d1 = dignityMag(dignityScalar(inp.graha, inp.sign, inp.degInSign, inp.retrograde, inp.combust));
  const d9 = dignityMag(dignityScalar(inp.graha, inp.navamsaSign, 15, false, false));
  let sthana = 0.5 * d1 + 0.5 * d9;
  if (vargottama) sthana = Math.min(1, sthana + 0.15);

  const dig = digBala(inp.graha, inp.house);
  // Cheshta: retrograde planets (and nodes) are potent; combustion dampens.
  let cheshta = inp.retrograde ? 1.0 : 0.5;
  if (inp.combust) cheshta *= 0.6;
  const naisargika = NAISARGIKA[inp.graha];
  const paksha = inp.isBenefic ? inp.moonIllumination : 1 - inp.moonIllumination;

  const total =
    0.35 * sthana + 0.20 * dig + 0.15 * cheshta + 0.15 * naisargika + 0.15 * paksha;

  return { total, sthana, dig, cheshta, naisargika, paksha, vargottama };
}

/** Moon illumination fraction 0..1 from Sun→Moon elongation (degrees). */
export function moonIllumination(elongationDeg: number): number {
  return (1 - Math.cos((elongationDeg * Math.PI) / 180)) / 2;
}
