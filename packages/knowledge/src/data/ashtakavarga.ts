// ─────────────────────────────────────────────────────────────────────────────
// Ashtakavarga — Ch 12. Each of the 7 planets earns "bindus" (benefic points) in each
// sign, contributed from 8 reference points (the 7 planets + the Ascendant).
// Bhinnashtakavarga (BAV) = one planet's 0–8 bindus per sign; Sarvashtakavarga (SAV) =
// the sum over all 7 (0–56 per sign, grand total 337 — an invariant). High bindus in a
// sign mean a transit through it is strong/favourable. Standalone from the engine so the
// mentor can compute it from any set of positions; the canonical tables total 337.
// ─────────────────────────────────────────────────────────────────────────────

export const AV_PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'] as const;
export type AVPlanet = (typeof AV_PLANETS)[number];
/** Reference points: the 7 planets + the Ascendant ('asc'). */
export type AVRef = AVPlanet | 'asc';

/** Benefic houses (1..12) each planet earns a bindu in, counted from each reference (BPHS). */
export const AV_TABLE: Record<AVPlanet, Record<AVRef, number[]>> = {
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

export type RefSigns = Record<AVRef, number>;
export interface AshtakavargaResult { bav: Record<AVPlanet, number[]>; sav: number[]; total: number }

/** One planet's Bhinnashtakavarga: 12 bindu counts (0..8 each) from the reference signs. */
export function bhinnashtakavarga(planet: AVPlanet, refs: RefSigns): number[] {
  const row = new Array(12).fill(0) as number[];
  const table = AV_TABLE[planet];
  for (const r of Object.keys(table) as AVRef[]) {
    const base = ((refs[r] % 12) + 12) % 12;
    for (const house of table[r]) row[(base + house - 1) % 12]! += 1;
  }
  return row;
}

/** Full ashtakavarga: BAV for all 7 planets, the Sarvashtakavarga sum, and the grand total (337). */
export function ashtakavarga(refs: RefSigns): AshtakavargaResult {
  const bav = {} as Record<AVPlanet, number[]>;
  const sav = new Array(12).fill(0) as number[];
  for (const p of AV_PLANETS) {
    const row = bhinnashtakavarga(p, refs);
    bav[p] = row;
    for (let s = 0; s < 12; s++) sav[s]! += row[s]!;
  }
  return { bav, sav, total: sav.reduce((a, b) => a + b, 0) };
}
