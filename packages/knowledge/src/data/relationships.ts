// Planetary relationships — Ch 3.4. Natural (permanent) friendships (Table 7),
// temporary (chart-specific) relationships, and the compound (five-fold) result.

import type { Graha } from '../types.js';

export type Relation = 'friend' | 'neutral' | 'enemy';
export type CompoundRelation = 'great-friend' | 'friend' | 'neutral' | 'enemy' | 'great-enemy';

/** Natural (naisargika) relationships — how each planet regards each other planet. */
export const NATURAL_RELATIONS: Record<string, Partial<Record<Graha, Relation>>> = {
  sun: { moon: 'friend', mars: 'friend', jupiter: 'friend', mercury: 'neutral', venus: 'enemy', saturn: 'enemy' },
  moon: { sun: 'friend', mercury: 'friend', mars: 'neutral', jupiter: 'neutral', venus: 'neutral', saturn: 'neutral' },
  mars: { sun: 'friend', moon: 'friend', jupiter: 'friend', venus: 'neutral', saturn: 'neutral', mercury: 'enemy' },
  mercury: { sun: 'friend', venus: 'friend', mars: 'neutral', jupiter: 'neutral', saturn: 'neutral', moon: 'enemy' },
  jupiter: { sun: 'friend', moon: 'friend', mars: 'friend', saturn: 'neutral', mercury: 'enemy', venus: 'enemy' },
  venus: { mercury: 'friend', saturn: 'friend', jupiter: 'neutral', sun: 'enemy', moon: 'enemy', mars: 'neutral' },
  saturn: { mercury: 'friend', venus: 'friend', jupiter: 'neutral', sun: 'enemy', moon: 'enemy', mars: 'enemy' },
};

export function naturalRelation(from: Graha, to: Graha): Relation {
  return NATURAL_RELATIONS[from]?.[to] ?? 'neutral';
}

/** Temporary (tatkaalika) friendship: a planet in the 2/3/4/10/11/12 sign from another
 *  is its temporary friend; otherwise a temporary enemy. `houseFrom` is 1..12. */
export function temporaryRelation(houseFrom: number): Relation {
  return [2, 3, 4, 10, 11, 12].includes(houseFrom) ? 'friend' : 'enemy';
}

/** Compound (five-fold) relationship = natural + temporary combined. */
export function compoundRelation(natural: Relation, temporary: Relation): CompoundRelation {
  const score = (r: Relation) => (r === 'friend' ? 1 : r === 'enemy' ? -1 : 0);
  const total = score(natural) + score(temporary);
  return total >= 2 ? 'great-friend'
    : total === 1 ? 'friend'
      : total === 0 ? 'neutral'
        : total === -1 ? 'enemy' : 'great-enemy';
}
