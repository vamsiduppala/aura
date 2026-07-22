// ─────────────────────────────────────────────────────────────────────────────
// Kalachakra Dasa — Ch 24. A nakshatra-pada based rasi dasa. Each pada maps to a run of
// 9 rasis drawn from a 24-rasi "wheel" (main + mirrored signs), savya (zodiacal) or
// apasavya (anti-zodiacal) by the nakshatra's group. Each rasi has a fixed dasa length;
// a pada's 9 lengths sum to its paramayush (pada 1 of Aswini = 100y). Verified against
// the book's Aswini pada-1/pada-2 sequences (Table 43/44).
// ─────────────────────────────────────────────────────────────────────────────

const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** Kalachakra dasa length (years) of each rasi, Ar..Pi. Pada-1 savya (Ar..Sg) sums to 100. */
export const KALACHAKRA_RASI_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10];

/** Mirror of a sign = the other sign owned by the same lord (Cn/Le mirror themselves). */
export const MIRROR_SIGN = [7, 6, 5, 3, 4, 2, 1, 0, 11, 10, 9, 8]; // Ar↔Sc, Ta↔Li, Ge↔Vi, Cn, Le, Sg↔Pi, Cp↔Aq

// The 24-rasi wheels (main row then mirrored row for savya; reversed for apasavya) — Table 43.
export const SAVYA_24 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 7, 6, 5, 3, 4, 2, 1, 0, 11, 10, 9, 8];
export const APASAVYA_24 = [8, 9, 10, 11, 0, 1, 2, 4, 3, 5, 6, 7, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

/** A nakshatra (0..26) is savya if its triple index (floor(nak/3)) is even, else apasavya. */
export const isSavya = (nak: number): boolean => Math.floor(mod(nak, 27) / 3) % 2 === 0;

/** Ordinal of a nakshatra within its own (savya/apasavya) group, 0-based. */
function groupOrdinal(nak: number): number {
  const n = mod(nak, 27);
  const triple = Math.floor(n / 3);
  const tripleOrd = isSavya(n) ? triple / 2 : (triple - 1) / 2;
  return tripleOrd * 3 + (n % 3);
}

export interface KalachakraPada {
  group: 'savya' | 'apasavya';
  sequence: number[];   // the 9 rasis run during this pada, in dasa order
  years: number[];      // each rasi's dasa length (years), aligned with sequence
  deha: number;         // body sign
  jeeva: number;        // spirit sign
  paramayush: number;   // total = sum of the 9 dasa years
}

/**
 * The Kalachakra dasa run for a nakshatra pada. `nak` 0..26, `pada` 1..4. Each pada steps
 * 9 rasis further along the group's 24-wheel. Savya: first rasi = Deha, last = Jeeva;
 * apasavya reverses (first = Jeeva, last = Deha).
 */
export function kalachakraPada(nak: number, pada: number): KalachakraPada {
  const savya = isSavya(nak);
  const wheel = savya ? SAVYA_24 : APASAVYA_24;
  const padaOrdinal = groupOrdinal(nak) * 4 + (mod(pada - 1, 4));
  const start = mod(padaOrdinal * 9, 24);
  const sequence = Array.from({ length: 9 }, (_, k) => wheel[mod(start + k, 24)]!);
  const years = sequence.map((r) => KALACHAKRA_RASI_YEARS[r]!);
  return {
    group: savya ? 'savya' : 'apasavya',
    sequence,
    years,
    deha: savya ? sequence[0]! : sequence[8]!,
    jeeva: savya ? sequence[8]! : sequence[0]!,
    paramayush: years.reduce((a, b) => a + b, 0),
  };
}
