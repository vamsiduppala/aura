// ─────────────────────────────────────────────────────────────────────────────
// Avasthas (planetary states) — Ch 15. A planet's effectiveness depends on its "state".
// Baladi (age) comes from the degree within the sign (Table 35, verified against the
// book's examples); Jagradi (alertness) and the dignity-part of Deeptadi (mood) come from
// the planet's dignity. Conjunction-based mood states (Vikala/Khala/Kopita) need extra
// chart data and are noted, not computed here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Dignity } from '../interpret.js';

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

// ── 15.4.1 Baladi avastha (age) ───────────────────────────────────────────────
export interface Baladi { name: string; meaning: string; result: string; weight: number }

const BALADI: Baladi[] = [
  { name: 'Saisava', meaning: 'child', result: 'quarter', weight: 0.25 },
  { name: 'Kumaara', meaning: 'adolescent', result: 'half', weight: 0.5 },
  { name: 'Yuva', meaning: 'youth', result: 'full', weight: 1 },
  { name: 'Vriddha', meaning: 'old', result: 'some', weight: 0.25 }, // book says "some"; approximated
  { name: 'Mrita', meaning: 'dead', result: 'none', weight: 0 },
];

/** Age-state of a planet from its sidereal longitude (odd signs forward, even signs reversed). */
export function baladiAvastha(longitude: number): Baladi {
  const L = mod360(longitude);
  const sign = Math.floor(L / 30);
  const pos = L - sign * 30;
  const oddSign = sign % 2 === 0; // Aries (index 0) is the 1st, an odd rasi
  const band = Math.min(4, Math.floor(pos / 6)); // 0..4
  return BALADI[oddSign ? band : 4 - band]!;
}

// ── 15.4.2 Jagradi avastha (alertness), from dignity ──────────────────────────
export interface Jagradi { name: string; meaning: string; result: string }

/** Alertness state: exalt/own → awake (full); friend/neutral → dreaming (medium); enemy/debil → asleep. */
export function jagradiAvastha(dignity: Dignity): Jagradi {
  if (dignity === 'exalted' || dignity === 'own' || dignity === 'moolatrikona') {
    return { name: 'Jaagrita', meaning: 'awake', result: 'full' };
  }
  if (dignity === 'debilitated' || dignity === 'enemy') {
    return { name: 'Sushupta', meaning: 'asleep', result: 'negligible' };
  }
  return { name: 'Swapna', meaning: 'dreaming', result: 'medium' };
}

// ── 15.4.3 Deeptadi avastha (mood), dignity part ──────────────────────────────
export interface Deeptadi { name: string; meaning: string }

const DEEPTADI_BY_DIGNITY: Record<Dignity, Deeptadi> = {
  exalted: { name: 'Deepta', meaning: 'bright' },
  moolatrikona: { name: 'Swastha', meaning: 'contented' },
  own: { name: 'Swastha', meaning: 'contented' },
  friend: { name: 'Saanta', meaning: 'peaceful' },
  neutral: { name: 'Deena', meaning: 'sad, depressed' },
  enemy: { name: 'Dukhita', meaning: 'distressed' },
  debilitated: { name: 'Dukhita', meaning: 'distressed' },
};

/** Mood state from dignity (the conjunction-based states — Mudita/Vikala/Khala/Kopita — need more chart data). */
export function deeptadiAvastha(dignity: Dignity): Deeptadi {
  return DEEPTADI_BY_DIGNITY[dignity];
}

// ── 15.4.3 (cont.) conjunction-based mood states — Vikala / Khala / Kopita ────
export interface MoodFacts {
  joinedByMalefic?: boolean;   // conjoined by natural malefics
  inMaleficSign?: boolean;     // sits in a rasi owned by a natural malefic
  closelyJoinedBySun?: boolean; // tight conjunction with the Sun
}

/** The conjunction-based Deeptadi moods a planet is in (it can hold several at once). */
export function moodConjunctionAvasthas(f: MoodFacts): Deeptadi[] {
  const out: Deeptadi[] = [];
  if (f.joinedByMalefic) out.push({ name: 'Vikala', meaning: 'crippled, confused' });
  if (f.inMaleficSign) out.push({ name: 'Khala', meaning: 'mischievous, scheming' });
  if (f.closelyJoinedBySun) out.push({ name: 'Kopita', meaning: 'angry' });
  return out;
}

// ── 15.4.3 (cont.) the six Lajjitadi mood states ──────────────────────────────
export interface LajjitadiFacts {
  inFifthWithCruel?: boolean;      // in the 5th house joined by Sun/Mars/Saturn/Rahu/Ketu
  exaltedOrMoolatrikona?: boolean;
  inEnemySign?: boolean;
  joinedOrAspectedByEnemies?: boolean;
  joinedBySaturn?: boolean;
  inWaterySign?: boolean;
  aspectedByEnemies?: boolean;
  aspectedByBenefics?: boolean;
  inFriendSign?: boolean;
  joinedOrAspectedByFriends?: boolean;
  joinedByJupiter?: boolean;
  joinedBySun?: boolean;
  aspectedByMalefics?: boolean;
}

export interface Lajjitadi { name: string; meaning: string }

/** The Lajjitadi states a planet is in (15.4.3) — several can apply simultaneously. */
export function lajjitadiAvasthas(f: LajjitadiFacts): Lajjitadi[] {
  const out: Lajjitadi[] = [];
  if (f.inFifthWithCruel) out.push({ name: 'Lajjita', meaning: 'ashamed' });
  if (f.exaltedOrMoolatrikona) out.push({ name: 'Garvita', meaning: 'proud' });
  if (f.inEnemySign || f.joinedOrAspectedByEnemies || f.joinedBySaturn) out.push({ name: 'Kshudhita', meaning: 'hungry' });
  if (f.inWaterySign && f.aspectedByEnemies && !f.aspectedByBenefics) out.push({ name: 'Trishita', meaning: 'thirsty' });
  if (f.inFriendSign && f.joinedOrAspectedByFriends && f.joinedByJupiter) out.push({ name: 'Mudita', meaning: 'delighted' });
  if (f.joinedBySun && (f.aspectedByMalefics || f.joinedOrAspectedByEnemies)) out.push({ name: 'Kshobhita', meaning: 'shaken, agitated' });
  return out;
}

export const LAJJITADI_NOTES: string[] = [
  'Planets in Kshudhita or Kshobhita avastha weaken the significations of the house they occupy.',
  'A Lajjita planet in the 5th house can bring losses related to progeny; a Kshobhita planet in the 7th can strain the marriage.',
];

export const AVASTHA_NOTES: string[] = [
  'Baladi (age) scales a planet\'s results — youth (Yuva) gives full, adolescence half, childhood a quarter, old age little, and "dead" (Mrita) none — but a planet can still shine regardless of age.',
  'Jagradi (alertness): awake (own/exalted) → full, dreaming (friend/neutral) → medium, asleep (enemy/debilitated) → negligible.',
  'Deeptadi (mood) combines a dignity state (Deepta…Dukhita) with conjunction states (Vikala with malefics, Khala in a malefic\'s sign, Kopita closely with the Sun) — a planet can hold several at once.',
];
