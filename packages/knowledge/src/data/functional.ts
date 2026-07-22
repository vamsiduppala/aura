// Functional nature per lagna (Ch 13.2, Table 30) + baadhaka rule (Ch 13.3).
// Which planets are functionally benefic / neutral / malefic for each ascendant, and
// the yogakaraka (a planet owning both a kendra and a trikona). Encoded as a rule table.

import type { Graha } from '../types.js';

export interface FunctionalNature {
  lagna: number;            // 0..11 (0 = Aries)
  yogakaraka: Graha | null; // the excellent planet (kendra + trikona lord)
  benefics: Graha[];
  neutrals: Graha[];
  malefics: Graha[];
}

export const FUNCTIONAL_NATURE: FunctionalNature[] = [
  { lagna: 0, yogakaraka: null, benefics: ['sun', 'mars', 'jupiter'], neutrals: [], malefics: ['mercury', 'venus', 'saturn'] },
  { lagna: 1, yogakaraka: 'saturn', benefics: ['sun', 'mercury', 'saturn'], neutrals: ['mars'], malefics: ['moon', 'jupiter', 'venus'] },
  { lagna: 2, yogakaraka: null, benefics: ['venus'], neutrals: ['moon', 'mercury', 'saturn'], malefics: ['sun', 'mars', 'jupiter'] },
  { lagna: 3, yogakaraka: 'mars', benefics: ['moon', 'mars', 'jupiter'], neutrals: ['sun', 'saturn'], malefics: ['mercury', 'venus'] },
  { lagna: 4, yogakaraka: 'mars', benefics: ['sun', 'mars', 'jupiter'], neutrals: ['moon'], malefics: ['mercury', 'venus', 'saturn'] },
  { lagna: 5, yogakaraka: null, benefics: ['mercury', 'venus'], neutrals: ['sun', 'saturn'], malefics: ['moon', 'mars', 'jupiter'] },
  { lagna: 6, yogakaraka: 'saturn', benefics: ['mercury', 'venus', 'saturn'], neutrals: [], malefics: ['sun', 'mars', 'jupiter'] },
  { lagna: 7, yogakaraka: null, benefics: ['moon', 'jupiter'], neutrals: ['sun', 'mars'], malefics: ['mercury', 'venus', 'saturn'] },
  { lagna: 8, yogakaraka: null, benefics: ['sun', 'mars'], neutrals: ['moon', 'mercury', 'jupiter'], malefics: ['venus', 'saturn'] },
  { lagna: 9, yogakaraka: 'venus', benefics: ['venus', 'mercury', 'saturn'], neutrals: ['sun'], malefics: ['mars', 'jupiter'] },
  { lagna: 10, yogakaraka: 'venus', benefics: ['venus', 'saturn'], neutrals: ['sun', 'mercury'], malefics: ['moon', 'mars', 'jupiter'] },
  { lagna: 11, yogakaraka: null, benefics: ['moon', 'mars'], neutrals: ['jupiter'], malefics: ['sun', 'mercury', 'venus', 'saturn'] },
];

export const functionalNatureFor = (lagna: number): FunctionalNature => FUNCTIONAL_NATURE[((lagna % 12) + 12) % 12]!;

/** Baadhaka ("troublemaker") house: for a movable/fixed/dual lagna it is the 11th/9th/
 *  7th sign from it; its lord is the baadhaka. modality 0=movable,1=fixed,2=dual. */
export function baadhakaHouse(lagnaModality: 'movable' | 'fixed' | 'dual'): number {
  return lagnaModality === 'movable' ? 11 : lagnaModality === 'fixed' ? 9 : 7;
}
