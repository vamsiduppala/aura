// ─────────────────────────────────────────────────────────────────────────────
// Ashtakavarga (SPEC §4 accuracy, BPHS). The classical transit-strength system: each
// of the 7 planets earns "bindus" (benefic points) in each sign, contributed from 8
// reference points (the 7 planets + the Ascendant). A transit through a high-bindu
// sign is potent/favorable. Bhinnashtakavarga (BAV) = per-planet (0–8/sign);
// Sarvashtakavarga (SAV) = the sum of all 7 (0–56/sign, 337 total — an invariant).
//
// The contribution tables below are the standard BPHS tables; their grand total is
// 337, which is checked in the tests as an integrity guard.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Graha } from '../types.js';

/** The seven ashtakavarga planets (Rahu/Ketu excluded, per the system). */
export const AV_PLANETS: Exclude<Graha, 'rahu' | 'ketu'>[] = [
  'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn',
];

type AVPlanet = (typeof AV_PLANETS)[number];
/** Reference points: the 7 planets + the Ascendant ('asc'). */
type Ref = AVPlanet | 'asc';

/** Benefic houses (1..12) each planet earns a bindu in, counted from each reference. */
const TABLE: Record<AVPlanet, Record<Ref, number[]>> = {
  sun: {
    sun: [1, 2, 4, 7, 8, 9, 10, 11], moon: [3, 6, 10, 11], mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [3, 5, 6, 9, 10, 11, 12], jupiter: [5, 6, 9, 11], venus: [6, 7, 12],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11], asc: [3, 4, 6, 10, 11, 12],
  },
  moon: {
    sun: [3, 6, 7, 8, 10, 11], moon: [1, 3, 6, 7, 10, 11], mars: [2, 3, 5, 6, 9, 10, 11],
    mercury: [1, 3, 4, 5, 7, 8, 10, 11], jupiter: [1, 4, 7, 8, 10, 11, 12], venus: [3, 4, 5, 7, 9, 10, 11],
    saturn: [3, 5, 6, 11], asc: [3, 6, 10, 11],
  },
  mars: {
    sun: [3, 5, 6, 10, 11], moon: [3, 6, 11], mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [3, 5, 6, 11], jupiter: [6, 10, 11, 12], venus: [6, 8, 11, 12],
    saturn: [1, 4, 7, 8, 9, 10, 11], asc: [1, 3, 6, 10, 11],
  },
  mercury: {
    sun: [5, 6, 9, 11, 12], moon: [2, 4, 6, 8, 10, 11], mars: [1, 2, 4, 7, 8, 9, 10, 11],
    mercury: [1, 3, 5, 6, 9, 10, 11, 12], jupiter: [6, 8, 11, 12], venus: [1, 2, 3, 4, 5, 8, 9, 11],
    saturn: [1, 2, 4, 7, 8, 9, 10, 11], asc: [1, 2, 4, 6, 8, 10, 11],
  },
  jupiter: {
    sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], moon: [2, 5, 7, 9, 11], mars: [1, 2, 4, 7, 8, 10, 11],
    mercury: [1, 2, 4, 5, 6, 9, 10, 11], jupiter: [1, 2, 3, 4, 7, 8, 10, 11], venus: [2, 5, 6, 9, 10, 11],
    saturn: [3, 5, 6, 12], asc: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  venus: {
    sun: [8, 11, 12], moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], mars: [3, 5, 6, 9, 11, 12],
    mercury: [3, 5, 6, 9, 11], jupiter: [5, 8, 9, 10, 11], venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    saturn: [3, 4, 5, 8, 9, 10, 11], asc: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  saturn: {
    sun: [1, 2, 4, 7, 8, 10, 11], moon: [3, 6, 11], mars: [3, 5, 6, 10, 11, 12],
    mercury: [6, 8, 9, 10, 11, 12], jupiter: [5, 6, 11, 12], venus: [6, 11, 12],
    saturn: [3, 5, 6, 11], asc: [1, 3, 4, 6, 10, 11],
  },
};

export interface Ashtakavarga {
  /** Per-planet bindus by sign 0..11 (Bhinnashtakavarga), each 0..8. */
  bav: Record<AVPlanet, number[]>;
  /** Summed bindus by sign 0..11 (Sarvashtakavarga), each 0..56; total = 337. */
  sav: number[];
}

/** Compute the Ashtakavarga (BAV per planet + SAV) for a natal chart. */
export function computeAshtakavarga(chart: Chart): Ashtakavarga {
  const refSign = (r: Ref): number => (r === 'asc' ? chart.lagnaSign : chart.planets[r].sign);

  const bav = {} as Record<AVPlanet, number[]>;
  const sav = new Array(12).fill(0) as number[];

  for (const p of AV_PLANETS) {
    const row = new Array(12).fill(0) as number[];
    const refs = Object.keys(TABLE[p]) as Ref[];
    for (const r of refs) {
      const base = refSign(r);
      for (const house of TABLE[p][r]) {
        const sign = (base + house - 1) % 12;
        row[sign] = row[sign]! + 1;
      }
    }
    bav[p] = row;
    for (let s = 0; s < 12; s++) sav[s] = sav[s]! + row[s]!;
  }
  return { bav, sav };
}

/** Grand total of all bindus — a fixed invariant (337) useful as an integrity check. */
export function ashtakavargaTotal(av: Ashtakavarga): number {
  return av.sav.reduce((a, b) => a + b, 0);
}
