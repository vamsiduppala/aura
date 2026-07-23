// ─────────────────────────────────────────────────────────────────────────────
// Raaja & Vipareeta Raaja yogas — Ch 11.7. A Raaja yoga forms when a lord of a quadrant
// (1/4/7/10 — Vishnu's houses) is "associated" with a lord of a trine (1/5/9 — Lakshmi's
// houses). The lagna counts as both. The book recognises three associations: conjunction,
// mutual graha-drishti aspect, and parivartana (exchange of signs). A Vipareeta Raaja yoga
// forms when the lords of the dusthanas (6/8/12) sit in dusthanas — obstacles running into
// obstacles, i.e. rise through adversity; its named special cases are Harsha (6th lord in
// 6th), Sarala (8th lord in 8th) and Vimala (12th lord in 12th).
//
// Detection uses only sign lords, so it works from a lagna + the seven planets' signs.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { RASI_BY_INDEX } from './rasis.js';
import { OWN_SIGNS } from './arudhas.js';
import { grahaAspectsFrom } from './aspects.js';

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

export const QUADRANTS = [1, 4, 7, 10] as const;
export const TRINES = [1, 5, 9] as const;
export const DUSTHANAS = [6, 8, 12] as const;

/** The sign lord of the sign occupying house `h` (1..12), counted from `lagnaSign`. */
export function houseLord(lagnaSign: number, h: number): Graha {
  return RASI_BY_INDEX(mod12(lagnaSign + h - 1)).lord;
}

/** The house (1..12) a `sign` falls in, counted from `lagnaSign`. */
export function houseOf(lagnaSign: number, sign: number): number {
  return mod12(sign - lagnaSign) + 1;
}

/** Signs of the seven classical planets (0..11). Rahu/Ketu don't lord signs, so they're not needed. */
export type PlanetSigns = Record<Graha, number>;

export type RajaAssociation = 'conjunction' | 'aspect' | 'exchange';

export interface RajaYogaLink {
  quadrantHouse: number;   // the kendra whose lord is involved (1/4/7/10)
  trineHouse: number;      // the trikona whose lord is involved (1/5/9)
  quadrantLord: Graha;
  trineLord: Graha;
  association: RajaAssociation;
  /** True when the two lords are the 9th (dharma) and 10th (karma) lords — Dharma-Karmadhipati yoga. */
  dharmaKarmadhipati: boolean;
}

/** Do two planets (given their signs, from a lagna) form the given kind of association? */
function associationOf(lagnaSign: number, a: Graha, b: Graha, s: PlanetSigns): RajaAssociation | null {
  const sa = mod12(s[a]), sb = mod12(s[b]);
  if (sa === sb) return 'conjunction';
  // Parivartana: each planet sits in a sign owned by the other.
  if (OWN_SIGNS[b].includes(sa) && OWN_SIGNS[a].includes(sb)) return 'exchange';
  // Mutual graha drishti: each aspects the other's house.
  const ha = houseOf(lagnaSign, sa), hb = houseOf(lagnaSign, sb);
  if (grahaAspectsFrom(a, ha).includes(hb) && grahaAspectsFrom(b, hb).includes(ha)) return 'aspect';
  return null;
}

/**
 * All Raaja yoga links in a chart (11.7.1): a quadrant lord associated with a distinct trine lord by
 * conjunction, mutual aspect, or exchange. Deduplicated by the unordered {quadrant lord, trine lord}
 * pair and the association kind, keeping the most "important" houses (9th/10th preferred) for display.
 */
export function rajaYogas(lagnaSign: number, signs: PlanetSigns): RajaYogaLink[] {
  const seen = new Map<string, RajaYogaLink>();
  for (const q of QUADRANTS) for (const t of TRINES) {
    const ql = houseLord(lagnaSign, q), tl = houseLord(lagnaSign, t);
    if (ql === tl) continue;                          // needs two distinct planets
    const assoc = associationOf(lagnaSign, ql, tl, signs);
    if (!assoc) continue;
    const pair = [ql, tl].sort().join('-');
    const key = `${pair}|${assoc}`;
    const link: RajaYogaLink = {
      quadrantHouse: q, trineHouse: t, quadrantLord: ql, trineLord: tl,
      association: assoc, dharmaKarmadhipati: (q === 10 && t === 9),
    };
    const prior = seen.get(key);
    // Prefer the 9th/10th framing when the same planet pair also links via other houses.
    if (!prior || (link.dharmaKarmadhipati && !prior.dharmaKarmadhipati)) seen.set(key, link);
  }
  return [...seen.values()];
}

export interface VipareetaYoga {
  present: boolean;            // any dusthana lord occupies a dusthana
  harsha: boolean;            // 6th lord in the 6th
  sarala: boolean;            // 8th lord in the 8th
  vimala: boolean;            // 12th lord in the 12th
  lordsInDusthana: { house: number; lord: Graha; occupies: number }[];
}

/**
 * Vipareeta Raaja yoga (11.7.1): the lords of the 6th/8th/12th placed in dusthanas. Returns the
 * general presence plus the three named special cases (Harsha/Sarala/Vimala). The "conjoining a
 * dusthana lord" variant needs conjunction data and is left to the caller; occupation is the core.
 */
export function vipareetaYoga(lagnaSign: number, signs: PlanetSigns): VipareetaYoga {
  const lordsInDusthana: { house: number; lord: Graha; occupies: number }[] = [];
  for (const d of DUSTHANAS) {
    const lord = houseLord(lagnaSign, d);
    const occupies = houseOf(lagnaSign, signs[lord]);
    if ((DUSTHANAS as readonly number[]).includes(occupies)) lordsInDusthana.push({ house: d, lord, occupies });
  }
  const inOwn = (h: number) => lordsInDusthana.some((x) => x.house === h && x.occupies === h);
  return {
    present: lordsInDusthana.length > 0,
    harsha: inOwn(6), sarala: inOwn(8), vimala: inOwn(12),
    lordsInDusthana,
  };
}
