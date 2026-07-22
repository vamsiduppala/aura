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

export const AVASTHA_NOTES: string[] = [
  'Baladi (age) scales a planet\'s results — youth (Yuva) gives full, adolescence half, childhood a quarter, old age little, and "dead" (Mrita) none — but a planet can still shine regardless of age.',
  'Jagradi (alertness): awake (own/exalted) → full, dreaming (friend/neutral) → medium, asleep (enemy/debilitated) → negligible.',
  'Deeptadi (mood) also has conjunction-based states not computed here: Mudita (in a great friend\'s sign), Vikala (with malefics), Khala (in a malefic\'s sign), Kopita (closely with the Sun), Lajjita (in the 5th with Sun/Mars/Saturn/nodes).',
];
