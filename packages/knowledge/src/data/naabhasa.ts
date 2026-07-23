// ─────────────────────────────────────────────────────────────────────────────
// Naabhasa yogas — Ch 11.5. Combinations from how the planets are distributed. The
// Sankhya (numerical) yogas depend only on the NUMBER of distinct signs the seven planets
// (Rahu/Ketu excluded) occupy — the least important Naabhasa yogas, applying when no
// shape-based (Aakriti) yoga does. Verified against the book's Sri Rama example (6 → Daama).
// ─────────────────────────────────────────────────────────────────────────────

export interface SankhyaYoga { name: string; alt?: string; means: string; effect: string }

/** Sankhya Naabhasa yogas keyed by the count of distinct signs the 7 planets occupy (1..7). */
export const SANKHYA_YOGAS: Record<number, SankhyaYoga> = {
  1: { name: 'Gola', means: 'a sphere', effect: 'strong in body but poor and unlettered; carries a persistent heaviness.' },
  2: { name: 'Yuga', means: 'a pair', effect: 'unconventional and unmoored; struggles with means and with family warmth.' },
  3: { name: 'Soola', means: "Shiva's spear", effect: 'sharp and valiant — wins hard contests — but restless and easily harsh.' },
  4: { name: 'Kedaara', means: 'a field', effect: 'grounded, productive and generous; does well working the land or building steadily.' },
  5: { name: 'Paasa', means: 'a noose', effect: 'capable and talkative with many helpers, but must guard character and freedom.' },
  6: { name: 'Daama', alt: 'Daamini', means: 'a wreath', effect: 'rich, famous and giving; blessed with children and fine things.' },
  7: { name: 'Veenaa', alt: 'Vallaki', means: 'a lute', effect: 'artistic and magnetic — drawn to music and dance — skilful, prosperous, a leader of people.' },
};

/**
 * The Sankhya Naabhasa yoga for a chart, from the seven planets' signs (Rahu/Ketu excluded).
 * Pass the signs of Sun..Saturn (0..11). Returns the yoga for the count of distinct signs.
 */
export function sankhyaYoga(planetSigns: number[]): { count: number } & SankhyaYoga {
  const distinct = new Set(planetSigns.map((s) => ((s % 12) + 12) % 12)).size;
  const count = Math.min(7, Math.max(1, distinct));
  return { count, ...SANKHYA_YOGAS[count]! };
}
