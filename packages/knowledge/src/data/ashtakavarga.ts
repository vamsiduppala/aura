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

// ── Sodhana (reductions) → Sodhita Ashtakavarga (SoAV) → Sodhya Pinda (Ch 12.7) ──

const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** The four trine (trikona) groups of signs — the signs 4 apart (fiery, earthy, airy, watery). */
export const TRIKONA_GROUPS: number[][] = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];

/** Sign pairs owned by one planet: Mars Ar/Sc, Venus Ta/Li, Mercury Ge/Vi, Jupiter Sg/Pi, Saturn Cp/Aq. */
export const EKADHIPATYA_PAIRS: [number, number][] = [[0, 7], [1, 6], [2, 5], [8, 11], [9, 10]];

/** Table 28 — Rasimana multipliers, by sign 0..11. */
export const RASI_MULTIPLIER = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12];

/** Table 29 — Grahamana multipliers, per planet. */
export const GRAHA_MULTIPLIER: Record<AVPlanet, number> = {
  sun: 5, moon: 5, mars: 8, mercury: 5, jupiter: 10, venus: 7, saturn: 5,
};

/**
 * Trikona (trinal) reduction of one planet's BAV row (12.7.1). For each trine group: if any of the
 * three signs holds a zero, leave the group untouched (rule 1); otherwise subtract the smallest of
 * the three from all three (rules 2 & 3 — equal values all fall to zero). Returns a new row.
 */
export function trikonaSodhana(bav: number[]): number[] {
  const row = bav.slice();
  for (const grp of TRIKONA_GROUPS) {
    const vals = grp.map((s) => row[s]!);
    if (vals.some((v) => v === 0)) continue;            // (1) a zero present → no reduction
    const min = Math.min(...vals);                       // (2)/(3) subtract the lowest (equal → all 0)
    for (const s of grp) row[s]! -= min;
  }
  return row;
}

/**
 * Ekadhipatya (co-owned) reduction (12.7.2), applied AFTER trikona sodhana, on each pair of signs
 * owned by one planet. `occupied` = the signs (0..11) that hold at least one planet. Rules:
 * (1) either has zero → skip; (2) both occupied → skip; (3) one occupied, one empty → the EMPTY one,
 * if lower, becomes 0, if higher, takes the other's value; (4) both empty → equal → both 0, else both
 * take the lower value. Returns a new row.
 */
export function ekadhipatyaSodhana(bav: number[], occupied: Iterable<number>): number[] {
  const row = bav.slice();
  const occ = new Set([...occupied].map(mod12));
  for (const [a, b] of EKADHIPATYA_PAIRS) {
    const x = row[a]!, y = row[b]!;
    if (x === 0 || y === 0) continue;                    // (1)
    const aOcc = occ.has(a), bOcc = occ.has(b);
    if (aOcc && bOcc) continue;                          // (2)
    if (aOcc !== bOcc) {                                 // (3) one occupied, one empty
      if (!aOcc) row[a] = x < y ? 0 : y;                 //   empty = a: (3a) lower→0, (3b) higher→other
      else row[b] = y < x ? 0 : x;                       //   empty = b
    } else {                                             // (4) both empty
      const lo = Math.min(x, y);
      row[a] = x === y ? 0 : lo;                         //   (4a) equal→0, (4b) higher→lower
      row[b] = x === y ? 0 : lo;
    }
  }
  return row;
}

/** Sodhita Ashtakavarga (SoAV) of one planet: trikona then ekadhipatya reduction (12.7). */
export function sodhitaAshtakavarga(bav: number[], occupied: Iterable<number>): number[] {
  return ekadhipatyaSodhana(trikonaSodhana(bav), occupied);
}

export interface SodhyaPinda { rasiPinda: number; grahaPinda: number; sodhyaPinda: number }

/**
 * Sodhya Pinda of a planet from its SoAV (12.7.3). Rasi pinda = Σ SoAV[s]·Rasimana[s] over the 12
 * signs; graha pinda = Σ SoAV[sign of planet p]·Grahamana[p] over the 7 planets; the sodhya pinda is
 * their sum. `planetSigns` gives each of the 7 planets' sign (0..11).
 */
export function sodhyaPinda(soav: number[], planetSigns: Record<AVPlanet, number>): SodhyaPinda {
  const rasiPinda = soav.reduce((sum, v, s) => sum + v * RASI_MULTIPLIER[s]!, 0);
  let grahaPinda = 0;
  for (const p of AV_PLANETS) grahaPinda += soav[mod12(planetSigns[p])]! * GRAHA_MULTIPLIER[p];
  return { rasiPinda, grahaPinda, sodhyaPinda: rasiPinda + grahaPinda };
}
