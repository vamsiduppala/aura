// Karakas (significators) — Ch 8. Three schemes: chara (variable, by longitude),
// sthira (fixed, for relatives), naisargika (natural — encoded in bhava.karakas).
// Encoded as our own concise structured data.

import type { Graha } from '../types.js';

/** Chara (Jaimini) karakas — assigned by descending planetary longitude among the 8
 *  (7 planets + Rahu). Order here is highest→lowest advancement. */
export interface CharaKaraka { rank: number; code: string; name: string; signifies: string }

export const CHARA_KARAKAS: CharaKaraka[] = [
  { rank: 1, code: 'AK', name: 'Atmakaraka', signifies: 'the soul and the self — the single most important significator in the chart' },
  { rank: 2, code: 'AmK', name: 'Amatyakaraka', signifies: 'career, the mind, counsel and those who advise you' },
  { rank: 3, code: 'BK', name: 'Bhratrikaraka', signifies: 'siblings, gurus and guidance' },
  { rank: 4, code: 'MK', name: 'Matrikaraka', signifies: 'mother, home and learning' },
  { rank: 5, code: 'PiK', name: 'Pitrikaraka', signifies: 'father' },
  { rank: 6, code: 'PK', name: 'Putrakaraka', signifies: 'children and creative/intellectual output' },
  { rank: 7, code: 'GK', name: 'Gnatikaraka', signifies: 'relatives, rivals, obstacles and spiritual effort' },
  { rank: 8, code: 'DK', name: 'Darakaraka', signifies: 'the spouse and close partnerships' },
];

/** The 8 bodies ranked for chara karakas (Ketu excluded). */
const KARAKA_BODIES: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu'];

export interface CharaKarakaAssignment {
  graha: Graha; code: string; name: string;
  /** Advancement used for ranking (Rahu counted as 30° − its degree). */
  karakaDegree: number;
}

/**
 * Assign the chara (Jaimini) karakas from sidereal longitudes: rank the 7 planets + Rahu by
 * their degree-within-sign (descending), Rahu reversed (30° − deg). Highest = Atmakaraka,
 * then Amatya, Bhratri, Matri, Pitri, Putra, Gnati, Dara. Verified against the book's charts.
 */
export function charaKarakas(longitudes: Partial<Record<Graha, number>>): CharaKarakaAssignment[] {
  const scored = KARAKA_BODIES
    .filter((g) => longitudes[g] != null)
    .map((g) => {
      const dis = (((longitudes[g]! % 30) + 30) % 30);
      return { graha: g, karakaDegree: g === 'rahu' ? 30 - dis : dis };
    })
    .sort((a, b) => b.karakaDegree - a.karakaDegree);
  return scored.map((s, i) => ({ graha: s.graha, code: CHARA_KARAKAS[i]!.code, name: CHARA_KARAKAS[i]!.name, karakaDegree: s.karakaDegree }));
}

/** Sthira (fixed) karakas — represent relatives’ bodies (used for timing their events). */
export interface SthiraKaraka { relative: string; planet: Graha | Graha[]; note?: string }

export const STHIRA_KARAKAS: SthiraKaraka[] = [
  { relative: 'father', planet: ['sun', 'venus'], note: 'the stronger of the two (Sun by day, Venus by night)' },
  { relative: 'mother', planet: ['moon', 'mars'], note: 'the stronger of the two (Moon by night, Mars by day)' },
  { relative: 'younger siblings', planet: 'mars' },
  { relative: 'maternal relatives', planet: 'mercury' },
  { relative: 'husband / children / paternal relatives', planet: 'jupiter' },
  { relative: 'wife / maternal grandparents', planet: 'venus' },
  { relative: 'elder siblings', planet: 'saturn' },
];

/** Natural significator planet(s) per house (naisargika) — mirrors bhava.karakas. */
export const NAISARGIKA_HOUSE_KARAKA: Record<number, Graha[]> = {
  1: ['sun'], 2: ['jupiter'], 3: ['mars'], 4: ['moon', 'mercury'], 5: ['jupiter'],
  6: ['mars', 'saturn'], 7: ['venus'], 8: ['saturn'], 9: ['jupiter', 'sun'],
  10: ['sun', 'mercury', 'jupiter', 'saturn'], 11: ['jupiter'], 12: ['saturn', 'ketu'],
};
