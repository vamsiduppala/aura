// ─────────────────────────────────────────────────────────────────────────────
// Divisional charts (vargas) — Ch 6. `vargaSign(longitude, divisor)` maps a sidereal
// longitude to the sign it occupies in a divisional chart. All 20 divisions the book
// defines are implemented and verified against its worked examples (Mercury 11°Ge /
// Jupiter 19°Sc etc.). This is the core varga calculation any chart engine needs.
// Also holds Dwaadasa Vargeeya Bala (Ch 28.5) — a varga-count strength.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { dignityOf } from './dignities.js';
import { naturalRelation } from './relationships.js';
import { RASI_BY_INDEX } from './rasis.js';

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** 0 fiery · 1 earthy · 2 airy · 3 watery (Ar,Ta,Ge,Cn … repeat). */
const element = (sign: number): number => mod12(sign) % 4;
/** 0 movable · 1 fixed · 2 dual. */
const modality = (sign: number): number => mod12(sign) % 3;
/** Odd rasi = Aries, Gemini, Leo … (0-indexed even). */
const isOdd = (sign: number): boolean => mod12(sign) % 2 === 0;

export const VARGA_DIVISORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60] as const;
export type VargaDivisor = (typeof VARGA_DIVISORS)[number];

/** The sign (0..11) a body at `longitude` (sidereal, 0..360) occupies in the D-`divisor` chart. */
export function vargaSign(longitude: number, divisor: number): number {
  const L = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(L / 30) % 12;
  const pos = L - Math.floor(L / 30) * 30;          // 0..30 within the sign

  // part index (0-based) for the equal-division charts
  const equalPart = (n: number): number => Math.min(n - 1, Math.floor(pos / (30 / n)));

  switch (divisor) {
    case 1:
      return sign;

    case 2: { // Hora — Sun's hora = Leo(4), Moon's hora = Cancer(3)
      const p = Math.min(1, Math.floor(pos / 15));
      return isOdd(sign) ? (p === 0 ? 4 : 3) : (p === 0 ? 3 : 4);
    }

    case 3: { // Drekkana — 1st / 5th / 9th from the sign
      const p = Math.min(2, Math.floor(pos / 10));
      return mod12(sign + [0, 4, 8][p]!);
    }

    case 4: { // Chaturthamsa — 1st / 4th / 7th / 10th
      const p = Math.min(3, Math.floor(pos / 7.5));
      return mod12(sign + [0, 3, 6, 9][p]!);
    }

    case 5: { // Panchamsa
      const p = equalPart(5);
      const odd = [0, 10, 8, 2, 6];   // Ar, Aq, Sg, Ge, Li
      const even = [1, 5, 11, 9, 7];  // Ta, Vi, Pi, Cp, Sc
      return (isOdd(sign) ? odd : even)[p]!;
    }

    case 6:  return mod12((isOdd(sign) ? 0 : 6) + equalPart(6));                 // Shashthamsa
    case 7:  return mod12((isOdd(sign) ? sign : sign + 6) + equalPart(7));       // Saptamsa
    case 8:  return mod12([0, 8, 4][modality(sign)]! + equalPart(8));            // Ashtamsa
    case 9:  return mod12([0, 9, 6, 3][element(sign)]! + equalPart(9));          // Navamsa
    case 10: return mod12((isOdd(sign) ? sign : sign + 8) + equalPart(10));      // Dasamsa
    case 11: return mod12(mod12(-sign) + equalPart(11));                          // Rudramsa (anti-zodiacal start)
    case 12: return mod12(sign + equalPart(12));                                  // Dwadasamsa
    case 16: return mod12([0, 4, 8][modality(sign)]! + equalPart(16));           // Shodasamsa
    case 20: return mod12([0, 8, 4][modality(sign)]! + equalPart(20));           // Vimsamsa
    case 24: return mod12((isOdd(sign) ? 4 : 3) + equalPart(24));                // Chaturvimsamsa
    case 27: return mod12([0, 3, 6, 9][element(sign)]! + equalPart(27));         // Nakshatramsa

    case 30: { // Trimsamsa — unequal arcs
      if (isOdd(sign)) {
        if (pos < 5) return 0;   // Ar
        if (pos < 10) return 10; // Aq
        if (pos < 18) return 8;  // Sg
        if (pos < 25) return 2;  // Ge
        return 6;                // Li
      }
      if (pos < 5) return 1;    // Ta
      if (pos < 12) return 5;   // Vi
      if (pos < 20) return 11;  // Pi
      if (pos < 25) return 9;   // Cp
      return 7;                 // Sc
    }

    case 40: return mod12((isOdd(sign) ? 0 : 6) + equalPart(40));                // Khavedamsa
    case 45: return mod12([0, 4, 8][modality(sign)]! + equalPart(45));           // Akshavedamsa
    case 60: return mod12(sign + Math.min(59, Math.floor(pos * 2)));             // Shashtyamsa

    default:
      throw new RangeError(`Unsupported divisional chart D-${divisor}`);
  }
}

/** All standard vargas for a longitude, keyed by divisor (e.g. { 1: 2, 9: 9, … }). */
export function allVargas(longitude: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (const d of VARGA_DIVISORS) out[d] = vargaSign(longitude, d);
  return out;
}

// ── Dwaadasa Vargeeya Bala (Ch 28.5) ──────────────────────────────────────────

/**
 * A planet's standing in a sign: 'strong' in its exaltation/own/moolatrikona/friend's rasi,
 * 'weak' in its debilitation/enemy's rasi, else 'neutral' (Ch 28.5's strong/weak criterion).
 */
export function vargaStanding(graha: Graha, sign: number): 'strong' | 'weak' | 'neutral' {
  const d = dignityOf(graha);
  const s = mod12(sign);
  if (d.exalt === s || d.moolatrikona === s || d.own.includes(s)) return 'strong';
  if (d.debil === s) return 'weak';
  const lord = RASI_BY_INDEX(s).lord;
  if (lord === graha) return 'strong';
  const rel = naturalRelation(graha, lord);
  return rel === 'friend' ? 'strong' : rel === 'enemy' ? 'weak' : 'neutral';
}

/** The twelve divisional charts Dwaadasa Vargeeya Bala is counted over (D-1 … D-12). */
export const DWADASA_VARGAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export interface DwadasaBala {
  strong: number;   // charts (of 12) where the planet is strong
  weak: number;     // charts where it is weak
  bala: number;     // strong − weak (positive = strong overall)
  perVarga: Record<number, 1 | 0 | -1>; // +1 strong / 0 neutral / −1 weak, per divisor
}

/**
 * Dwaadasa Vargeeya Bala (28.5): across D-1..D-12, the count of charts where the planet is strong
 * (exaltation/own/friend's rasi) minus the count where it is weak (debilitation/enemy's rasi). A
 * positive value means it is strong overall. `longitude` is the planet's sidereal longitude (0..360).
 */
export function dwadasaVargeeyaBala(graha: Graha, longitude: number): DwadasaBala {
  let strong = 0, weak = 0;
  const perVarga: Record<number, 1 | 0 | -1> = {};
  for (const d of DWADASA_VARGAS) {
    const st = vargaStanding(graha, vargaSign(longitude, d));
    perVarga[d] = st === 'strong' ? 1 : st === 'weak' ? -1 : 0;
    if (st === 'strong') strong++; else if (st === 'weak') weak++;
  }
  return { strong, weak, bala: strong - weak, perVarga };
}
