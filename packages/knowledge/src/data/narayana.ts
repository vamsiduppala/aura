// ─────────────────────────────────────────────────────────────────────────────
// Narayana Dasa — Ch 18. The flagship rasi (sign) dasa. Progression from the "dasa seed"
// (stronger of lagna/7th) uses Brahma (movable→regular), Shiva (fixed→every 6th) or
// Vishnu (dual→trinal) motion, forward/backward by the 9th-from-seed's foot, with Saturn
// & Ketu exceptions. Dasa length comes from the lord's distance. Verified against the
// book's Examples 63–67. The caller supplies the strength-based seeds + dual-lord picks.
// ─────────────────────────────────────────────────────────────────────────────

const mod12 = (n: number): number => ((n % 12) + 12) % 12;
/** Odd-footed rasis: Ar,Ta,Ge,Li,Sc,Sg (index % 6 < 3). */
const oddFooted = (s: number): boolean => mod12(s) % 6 < 3;

export type RasiMotion = 'brahma' | 'shiva' | 'vishnu';

/**
 * The full 12-rasi dasa order from a dasa seed. `hasSaturn`/`hasKetu` = whether that
 * planet occupies the seed (Saturn → regular+forward; Ketu → reverse direction).
 */
export function narayanaProgression(seed: number, hasSaturn = false, hasKetu = false): number[] {
  const s = mod12(seed);
  let motion: RasiMotion = s % 3 === 0 ? 'brahma' : s % 3 === 1 ? 'shiva' : 'vishnu';
  let forward = oddFooted(mod12(s + 8)); // direction from the 9th house from the seed
  if (hasSaturn) { motion = 'brahma'; forward = true; }
  if (hasKetu) forward = !forward;
  const dir = forward ? 1 : -1;

  const out: number[] = [];
  if (motion === 'brahma') {
    for (let k = 0; k < 12; k++) out.push(mod12(s + dir * k));       // regular
  } else if (motion === 'shiva') {
    for (let k = 0; k < 12; k++) out.push(mod12(s + dir * 5 * k));   // every 6th
  } else {
    for (const quad of [0, 9, 6, 3]) for (const tri of [0, 4, 8]) out.push(mod12(s + dir * (quad + tri))); // trinal
  }
  return out;
}

export interface DasaLengthOpts { exalted?: boolean; debilitated?: boolean }

/**
 * Length (years) of a rasi's dasa: houses from the rasi to its lord (forward if the rasi
 * is odd-footed, else backward), minus 1. count==1 → 12y; lord exalted +1, debilitated −1.
 */
export function narayanaDasaLength(dasaRasi: number, lordSign: number, opts: DasaLengthOpts = {}): number {
  const d = mod12(dasaRasi);
  const l = mod12(lordSign);
  const count = (oddFooted(d) ? mod12(l - d) : mod12(d - l)) + 1;
  let len = count === 1 ? 12 : count - 1;
  if (opts.exalted) len += 1;
  if (opts.debilitated) len -= 1;
  return len;
}

/** The rasi's dasa length in the second cycle = 12 − its first-cycle length. */
export const narayanaSecondCycle = (firstCycleYears: number): number => 12 - firstCycleYears;

export interface Antardasa { rasi: number; months: number }

/**
 * The 12 equal antardasas of a Narayana dasa, from the antardasa-start rasi (the rasi
 * holding the lord of the stronger of the dasa rasi / its 7th — supplied by the caller).
 * Direction: forward if that start rasi is an odd SIGN, else backward. Each = dasaYears months.
 */
export function narayanaAntardashas(startRasi: number, dasaYears: number): Antardasa[] {
  const s = mod12(startRasi);
  const dir = s % 2 === 0 ? 1 : -1; // odd sign (0-indexed even) → forward
  return Array.from({ length: 12 }, (_, k) => ({ rasi: mod12(s + dir * k), months: dasaYears }));
}

/**
 * Narayana dasa of a divisional chart (18.5): the seed of D-n is the ((n−1) mod 12)+1-th house —
 * D-9 → 9th, D-16 → 4th, D-27 → 3rd, D-30 → 6th, D-40 → 4th. Procedure: take that house in the
 * RASI chart, take its lord (stronger co-lord for Sc/Aq), and the rasi that lord occupies in D-n
 * becomes the lagna from which the ordinary Narayana dasa of that varga runs. The dasa rasi is
 * never re-interpreted as a progressed lagna — that applies to the rasi chart only.
 */
export function vargaSeedHouse(n: number): number {
  return ((Math.round(n) - 1) % 12 + 12) % 12 + 1;
}
