// ─────────────────────────────────────────────────────────────────────────────
// Aspects & Argalas — Ch 10. Graha drishti (planetary aspect), rasi drishti (sign
// aspect), argala (intervention) and virodhargala (obstruction), encoded as rules +
// compute helpers. The engine computes graha drishti per-chart; this module is the
// standalone rule reference the mentor uses to *explain* aspects and argalas.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';
import { RASIS } from './rasis.js';

/** House offsets a planet aspects with graha drishti, counting its own sign as 1.
 *  Every planet aspects the 7th; Mars/Jupiter/Saturn have extra special aspects. */
export const GRAHA_DRISHTI: Record<Graha, number[]> = {
  sun: [7], moon: [7], mercury: [7], venus: [7],
  mars: [4, 7, 8],       // + 4th and 8th
  jupiter: [5, 7, 9],    // + 5th and 9th
  saturn: [3, 7, 10],    // + 3rd and 10th
  // Nodes: PVR gives them the 7th; some traditions add the special set. We keep the 7th.
  rahu: [7], ketu: [7],
};

/** Advance `offset` houses (1-based, offset 1 = same house) from house `from` (1..12). */
export const advanceHouse = (from: number, offset: number): number =>
  (((from - 1 + (offset - 1)) % 12 + 12) % 12) + 1;

/** Absolute houses (1..12) a planet aspects with graha drishti, sitting in `house`. */
export function grahaAspectsFrom(graha: Graha, house: number): number[] {
  return GRAHA_DRISHTI[graha].map((off) => advanceHouse(house, off));
}

/** Sign indices (0..11) a sign aspects with rasi drishti, per the modality rules:
 *  movable ↔ fixed (except the adjacent one); dual ↔ all other dual signs. */
export function rasiDrishti(sign: number): number[] {
  const s = ((sign % 12) + 12) % 12;
  const mod = RASIS[s]!.modality;
  const out: number[] = [];
  for (let t = 0; t < 12; t++) {
    if (t === s) continue;
    const tm = RASIS[t]!.modality;
    if (mod === 'dual') { if (tm === 'dual') out.push(t); continue; }
    const opposite = mod === 'movable' ? 'fixed' : 'movable';
    if (tm === opposite) {
      const adjacent = t === (s + 1) % 12 || t === (s + 11) % 12;
      if (!adjacent) out.push(t);
    }
  }
  return out;
}

// ── Argala (intervention) ────────────────────────────────────────────────────
// A house/planet in the 2nd, 4th or 11th from a target causes PRIMARY argala on it;
// the 5th causes a SECONDARY argala. Argala by a benefic = subha (helpful); by a
// malefic = paapa (obstructive). Each argala is obstructed (virodhargala) by a
// specific counter-house.
export const ARGALA_PRIMARY = [2, 4, 11] as const;
export const ARGALA_SECONDARY = [5] as const;

/** The house whose occupants obstruct the argala coming from a given argala-house. */
export const VIRODHARGALA: Record<number, number> = { 2: 12, 4: 10, 11: 3, 5: 9 };

/** What each argala contributes to the matter (Ch 10.7). */
export const ARGALA_MEANING: Record<number, string> = {
  2: 'the basic ingredient that sustains the matter',
  4: 'the factor that drives its mood, state and progress',
  11: 'the catalyst that can turn it into gains',
  5: 'an additional contributing factor (secondary)',
};

export interface ArgalaSource {
  /** The house (1..12) that casts this argala on the target. */
  house: number;
  kind: 'primary' | 'secondary';
  /** The house whose occupants would obstruct it (virodhargala). */
  obstructedBy: number;
  meaning: string;
}

/** All houses that cast argala on `target` (1..12), with their obstructing houses. */
export function argalaOn(target: number): ArgalaSource[] {
  const build = (off: number, kind: 'primary' | 'secondary'): ArgalaSource => ({
    house: advanceHouse(target, off),
    kind,
    obstructedBy: advanceHouse(target, VIRODHARGALA[off]!),
    meaning: ARGALA_MEANING[off]!,
  });
  return [
    ...ARGALA_PRIMARY.map((o) => build(o, 'primary')),
    ...ARGALA_SECONDARY.map((o) => build(o, 'secondary')),
  ];
}

/** Reference notes that qualify the mechanical rules (special cases from Ch 10). */
export const ASPECT_NOTES: string[] = [
  'All planets aspect the 7th house/sign from them; only Mars (4th, 8th), Jupiter (5th, 9th) and Saturn (3rd, 10th) have extra special aspects.',
  'Rasi drishti is weaker (an “influence on neighbours”); graha drishti is more concrete; argala is decisive — it bolts part of the matter shut.',
  'If several malefics sit in the 3rd from a house/planet, they cast argala on it instead of the usual obstruction.',
  'For a sign containing Ketu, its argalas and virodhargalas are counted anti-zodiacally (reversed).',
];
