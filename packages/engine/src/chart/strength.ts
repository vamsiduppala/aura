// Dignity & functional polarity (SPEC §4.3, App B). v1 is dignity-based; a fuller
// Shadbala can replace `dignityScalar` later without changing its signature.

import {
  DIGNITY, SIGN_LORD, NATURAL_FRIENDSHIP, NATURAL_POLARITY,
} from '../constants.js';
import { houseFrom } from '../astro/angles.js';
import type { Graha } from '../types.js';

function clamp(x: number, lo = -1, hi = 1): number { return Math.max(lo, Math.min(hi, x)); }

/** 0..1 closeness of a degree-in-sign to a target degree (1 at target). */
function closeness(degInSign: number, target: number | null): number {
  if (target == null) return 0.6;
  return 1 - Math.abs(degInSign - target) / 30;
}

/** Relationship of `graha` to the lord of the sign it sits in ('F'|'N'|'E'). */
function relToSignLord(graha: Graha, sign: number): 'F' | 'N' | 'E' {
  const lord = SIGN_LORD[sign]!;
  if (lord === graha) return 'F';
  return NATURAL_FRIENDSHIP[graha]?.[lord] ?? 'N';
}

/**
 * Dignity/strength scalar in ~[−1, +1] (SPEC §4.3): exaltation/own/friend positive,
 * debilitation/enemy negative, scaled by combustion & retrograde.
 */
export function dignityScalar(
  graha: Graha, sign: number, degInSign: number, retrograde: boolean, combust: boolean,
): number {
  const d = DIGNITY[graha];
  let base: number;
  if (d.exaltSign === sign) {
    base = 0.85 + 0.15 * closeness(degInSign, d.exaltDeg);
  } else if (d.debilSign === sign) {
    base = -(0.85 + 0.15 * closeness(degInSign, d.exaltDeg));
  } else if (d.moolatrikonaSign === sign) {
    base = 0.6;
  } else if (d.ownSigns.includes(sign)) {
    base = 0.5;
  } else {
    const rel = relToSignLord(graha, sign);
    base = rel === 'F' ? 0.25 : rel === 'E' ? -0.25 : 0;
  }
  if (combust) base *= 0.5;              // "burnt" by the Sun → weakened
  if (retrograde) base *= 1.1;           // retrograde → more intense/unsettled
  return clamp(base);
}

/**
 * Functional polarity for a Lagna in [−1, +1] (SPEC §4.3): natural nature blended
 * with house-lordship (trine lords lean benefic, dusthana lords lean malefic).
 * `moonWaxing` flips the Moon's natural nature.
 */
export function functionalPolarity(
  graha: Graha, lagnaSign: number, moonWaxing: boolean,
): number {
  let natural = NATURAL_POLARITY[graha];
  if (graha === 'moon') natural = moonWaxing ? 1 : -0.3;

  // Houses this graha rules, counted from the Lagna.
  let lean = 0;
  for (let s = 0; s < 12; s++) {
    if (SIGN_LORD[s] === graha) {
      const house = houseFrom(s, lagnaSign);
      if (house === 1 || house === 5 || house === 9) lean += 0.5;      // trikona
      else if (house === 6 || house === 8 || house === 12) lean -= 0.5; // dusthana
    }
  }
  return clamp(0.6 * natural + lean);
}
