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

// ── Aakriti (shape) Naabhasa yogas (Ch 11.5.3) ────────────────────────────────
// Based on which HOUSES (from lagna) the seven planets occupy. Each yoga allows one or
// more house-sets; it applies when every occupied house falls within a set. (Precedence
// between overlapping shapes is author-dependent, so we surface all that apply.)
const consec = (start: number, len: number): number[] => Array.from({ length: len }, (_, i) => ((start - 1 + i) % 12) + 1);

export interface AakritiYoga { name: string; means: string; effect: string; houseSets: number[][] }

export const AAKRITI_YOGAS: AakritiYoga[] = [
  { name: 'Sakata', means: 'a cart', effect: 'struggle, ill health and isolation; life feels like pulling a heavy load.', houseSets: [[1, 7]] },
  { name: 'Vihanga', means: 'a bird', effect: 'a restless wanderer and messenger; quarrelsome and unabashed.', houseSets: [[4, 10]] },
  { name: 'Gadaa', means: 'a mace', effect: 'wealth, gold and gems; performs rites and knows the sciences and songs.', houseSets: [[1, 4], [4, 7], [7, 10], [10, 1]] },
  { name: 'Sringaataka', means: 'a crossroads', effect: 'happy, wealthy and liked by rulers; a noble marriage.', houseSets: [[1, 5, 9]] },
  { name: 'Hala', means: 'a plough', effect: 'a farmer’s lot — hard-working but poor, deserted and worried.', houseSets: [[2, 6, 10], [3, 7, 11], [4, 8, 12]] },
  { name: 'Kamala', means: 'a lotus', effect: 'kingly — strong character, fame, long life, pure and good deeds.', houseSets: [[1, 4, 7, 10]] },
  { name: 'Vaapi', means: 'a reservoir', effect: 'a mind that amasses wealth; comforts and command.', houseSets: [[2, 5, 8, 11], [3, 6, 9, 12]] },
  { name: 'Yoopa', means: 'a sacrificial post', effect: 'spiritual knowledge, sattva and steady married life.', houseSets: [consec(1, 4)] },
  { name: 'Sara', means: 'an arrow', effect: 'a sharp, harsh vocation (hunter/warden); hard on others.', houseSets: [consec(4, 4)] },
  { name: 'Sakti', means: 'a weapon', effect: 'unhappy and unlucky but firm, long-lived and sharp in conflict.', houseSets: [consec(7, 4)] },
  { name: 'Danda', means: 'a staff', effect: 'loss of family and support; hardship and mean company.', houseSets: [consec(10, 4)] },
  { name: 'Naukaa', means: 'a ship', effect: 'earns through water/trade; well-known and desirous, but rough and miserly.', houseSets: [consec(1, 7)] },
  { name: 'Koota', means: 'a fort', effect: 'a jailer’s life in hills and forts; poor and hard.', houseSets: [consec(4, 7)] },
  { name: 'Chatra', means: 'an umbrella', effect: 'kind, helpful and intelligent; liked by rulers, long-lived.', houseSets: [consec(7, 7)] },
  { name: 'Chaapa', means: 'a bow', effect: 'a keeper of secrets who wanders; unfortunate but happy mid-life.', houseSets: [consec(10, 7)] },
  { name: 'ArdhaChandra', means: 'a half-moon', effect: 'an army chief — strong, handsome, favoured by rulers, adorned.', houseSets: [2, 3, 5, 6, 8, 9, 11, 12].map((s) => consec(s, 7)) },
  { name: 'Chakra', means: 'a wheel', effect: 'an emperor — many rulers bow to them.', houseSets: [[1, 3, 5, 7, 9, 11]] },
  { name: 'Samudra', means: 'an ocean', effect: 'stable wealth, gems and luxuries; soft-natured and well-liked.', houseSets: [[2, 4, 6, 8, 10, 12]] },
];

const normHouse = (h: number): number => ((h - 1) % 12 + 12) % 12 + 1;

/** All Aakriti (shape) yogas that apply, given the houses (1..12 from lagna) the 7 planets occupy. */
export function matchAakritiYogas(occupiedHouses: number[]): AakritiYoga[] {
  const occ = [...new Set(occupiedHouses.map(normHouse))];
  return AAKRITI_YOGAS.filter((y) => y.houseSets.some((set) => occ.every((h) => set.includes(h))));
}

// ── Vajra / Yava (Aakriti yogas needing benefic/malefic placement) ────────────
export interface BeneficMaleficYoga { name: string; means: string; effect: string }
export const VAJRA_YOGA: BeneficMaleficYoga = { name: 'Vajra', means: 'a diamond', effect: 'valiant and happy in early and late life; not especially lucky, but free of craving — a fighter.' };
export const YAVA_YOGA: BeneficMaleficYoga = { name: 'Yava', means: 'a grain', effect: 'religiously observant, strong-minded and charitable; happiest in mid-life, with wealth and good children.' };

/**
 * Vajra (benefics in 1st & 7th, malefics in 4th & 10th) or Yava (the reverse). Pass the
 * houses (1..12 from lagna) occupied by natural benefics and by natural malefics.
 */
export function vajraYavaYoga(beneficHouses: number[], maleficHouses: number[]): BeneficMaleficYoga | null {
  const b = new Set(beneficHouses.map(normHouse));
  const m = new Set(maleficHouses.map(normHouse));
  if (b.has(1) && b.has(7) && m.has(4) && m.has(10)) return VAJRA_YOGA;
  if (m.has(1) && m.has(7) && b.has(4) && b.has(10)) return YAVA_YOGA;
  return null;
}
