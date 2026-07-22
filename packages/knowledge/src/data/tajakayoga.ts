// ─────────────────────────────────────────────────────────────────────────────
// Tajaka Yogas — Ch 29. Combinations specific to annual/prasna charts: Ithasala (applying
// aspect → fulfilment), Eesarpha (separating → failure), Nakta (mediated), Ishkavala and
// Induvara (house-distribution). Verified against the book's Moon/Venus examples.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from '../types.js';

/** Planet speed, slowest → fastest (Ch 29 footnote). Higher index = faster. */
export const TAJAKA_SPEED_ORDER: Graha[] = ['saturn', 'rahu', 'ketu', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];
export const tajakaSpeedRank = (g: Graha): number => TAJAKA_SPEED_ORDER.indexOf(g);
/** The faster of two planets. */
export const fasterPlanet = (a: Graha, b: Graha): Graha => (tajakaSpeedRank(a) >= tajakaSpeedRank(b) ? a : b);

export type IthasalaKind = 'ithasala' | 'eesarpha' | 'exact';
export interface IthasalaResult { kind: IthasalaKind; poorna: boolean; faster: Graha }

/**
 * Classify the relationship between two aspecting planets by their advancement (degrees
 * within their rasis). Faster planet LESS advanced → ithasala (applying, good); MORE
 * advanced → eesarpha (separating, bad). Poorna when the advancements are within 1°.
 * (Retrograde nuances are left to the caller — pass effective advancement.)
 */
export function ithasala(pa: Graha, degA: number, pb: Graha, degB: number): IthasalaResult {
  const faster = fasterPlanet(pa, pb);
  const fasterDeg = faster === pa ? degA : degB;
  const slowerDeg = faster === pa ? degB : degA;
  const poorna = Math.abs(degA - degB) <= 1;
  if (fasterDeg < slowerDeg) return { kind: 'ithasala', poorna, faster };
  if (fasterDeg > slowerDeg) return { kind: 'eesarpha', poorna, faster };
  return { kind: 'exact', poorna: true, faster };
}

const APOKLIMA = [3, 6, 9, 12];

/** Ishkavala: planets only in kendras + panapharas (apoklimas 3/6/9/12 empty) → wealth/fortune. */
export function ishkavala(occupiedHouses: number[]): boolean {
  return occupiedHouses.length > 0 && occupiedHouses.every((h) => !APOKLIMA.includes(((h - 1) % 12) + 1));
}
/** Induvara: planets only in apoklimas (kendras + panapharas empty) → disappointments/illness. */
export function induvara(occupiedHouses: number[]): boolean {
  return occupiedHouses.length > 0 && occupiedHouses.every((h) => APOKLIMA.includes(((h - 1) % 12) + 1));
}

export const TAJAKA_YOGAS: Record<string, string> = {
  ishkavala: 'Planets only in kendras/panapharas — wealth, happiness, good fortune.',
  induvara: 'Planets only in apoklimas — disappointments, worries, illness.',
  ithasala: 'Two aspecting planets applying (faster behind) — fulfilment of what they signify.',
  eesarpha: 'Two aspecting planets separating (faster ahead) — failure and disappointment.',
  nakta: 'Two planets not aspecting, but a faster planet makes ithasala with both — mediated fulfilment.',
};
