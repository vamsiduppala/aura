// Planetary dignities — Ch 3.3 (Table 6). Exaltation, debilitation, own signs and
// moolatrikona per planet, as sign indices (0 = Aries). Used to classify a placement.

import type { Graha } from '../types.js';

export interface DignityDef {
  exalt: number | null;
  debil: number | null;
  own: number[];
  moolatrikona: number | null;
}

export const DIGNITIES: Record<string, DignityDef> = {
  sun: { exalt: 0, debil: 6, own: [4], moolatrikona: 4 },        // exalt Aries, debil Libra, own/MT Leo
  moon: { exalt: 1, debil: 7, own: [3], moolatrikona: 1 },       // exalt Taurus, debil Scorpio, own Cancer
  mars: { exalt: 9, debil: 3, own: [0, 7], moolatrikona: 0 },    // exalt Capricorn, debil Cancer, own Aries/Scorpio
  mercury: { exalt: 5, debil: 11, own: [2, 5], moolatrikona: 5 },// exalt Virgo, debil Pisces, own Gemini/Virgo
  jupiter: { exalt: 3, debil: 9, own: [8, 11], moolatrikona: 8 },// exalt Cancer, debil Capricorn, own Sag/Pisces
  venus: { exalt: 11, debil: 5, own: [1, 6], moolatrikona: 6 },  // exalt Pisces, debil Virgo, own Taurus/Libra
  saturn: { exalt: 6, debil: 0, own: [9, 10], moolatrikona: 10 },// exalt Libra, debil Aries, own Capricorn/Aquarius
  // Nodes: traditions vary; a common assignment (configurable).
  rahu: { exalt: 1, debil: 7, own: [], moolatrikona: null },
  ketu: { exalt: 7, debil: 1, own: [], moolatrikona: null },
};

export const dignityOf = (g: Graha): DignityDef => DIGNITIES[g]!;
