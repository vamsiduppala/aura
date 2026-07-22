// ─────────────────────────────────────────────────────────────────────────────
// Muhurta / Electional astrology — Ch 36. Choosing an auspicious time uses the five
// panchanga limbs + a good tara from the janma nakshatra. This encodes the per-task
// guidelines (Table 79 subset) and a computable quality check. Weekday 0 = Sunday.
// ─────────────────────────────────────────────────────────────────────────────

import { taraOf } from './taras.js';

export interface MuhurtaGuideline {
  tithis: number[];      // auspicious tithi day-numbers (1..15, applied to both pakshas)
  weekdays: number[];    // 0=Sun … 6=Sat
  nakshatras: number[];  // 0..26
}

/** Table 79 (subset): auspicious tithis / weekdays / nakshatras per task. */
export const MUHURTA_GUIDELINES: Record<string, MuhurtaGuideline> = {
  'house-construction': {
    tithis: [2, 3, 5, 7, 11, 13, 15], weekdays: [1, 3, 4, 5],
    nakshatras: [0, 3, 4, 6, 11, 12, 13, 14, 16, 20, 21, 22, 23, 25, 26],
  },
  'house-entering': {
    tithis: [2, 3, 5, 7, 10, 11, 13, 15], weekdays: [1, 3, 4, 5],
    nakshatras: [3, 4, 11, 13, 16, 20, 22, 23, 25, 26],
  },
  'naming-child': {
    tithis: [2, 3, 5, 7, 10, 11, 13], weekdays: [0, 1, 3, 4, 6],
    nakshatras: [0, 3, 4, 6, 7, 11, 12, 13, 14, 16, 20, 21, 22, 23, 25, 26],
  },
  'first-feeding': {
    tithis: [2, 3, 5, 7, 10, 13, 15], weekdays: [0, 1, 3, 4, 5],
    nakshatras: [0, 3, 4, 6, 7, 11, 12, 13, 14, 16, 20, 21, 22, 23, 25, 26],
  },
  'teaching-alphabet': {
    tithis: [2, 3, 5, 7, 10, 11, 12], weekdays: [1, 3, 4, 5],
    nakshatras: [0, 6, 12, 13, 14, 16, 21, 26],
  },
};

/** Rikta tithis (4, 9, 14) are generally inauspicious for new undertakings. */
export const RIKTA_TITHIS = [4, 9, 14];

export interface MuhurtaCheck {
  tithiOk: boolean;
  weekdayOk: boolean;
  nakshatraOk: boolean;
  taraOk: boolean;
  rikta: boolean;
  auspicious: boolean; // all core checks pass and not a rikta tithi
}

/**
 * Assess a candidate muhurta for a task. `tithiDay` = 1..15 (day within the paksha),
 * `weekday` 0..6, `nakshatra` 0..26, `janmaNak` = the person's natal Moon nakshatra.
 */
export function muhurtaCheck(
  task: keyof typeof MUHURTA_GUIDELINES | string,
  tithiDay: number, weekday: number, nakshatra: number, janmaNak: number,
): MuhurtaCheck {
  const g = MUHURTA_GUIDELINES[task];
  if (!g) throw new RangeError(`No muhurta guideline for task: ${task}`);
  const tithiOk = g.tithis.includes(tithiDay);
  const weekdayOk = g.weekdays.includes(((weekday % 7) + 7) % 7);
  const nakshatraOk = g.nakshatras.includes(((nakshatra % 27) + 27) % 27);
  const taraOk = taraOf(janmaNak, nakshatra).good;
  const rikta = RIKTA_TITHIS.includes(tithiDay);
  return {
    tithiOk, weekdayOk, nakshatraOk, taraOk, rikta,
    auspicious: tithiOk && weekdayOk && nakshatraOk && taraOk && !rikta,
  };
}
