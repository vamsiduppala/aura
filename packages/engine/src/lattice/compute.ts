// ─────────────────────────────────────────────────────────────────────────────
// The 108-Layer Signal Lattice (Tier 3) + aggregation (Tier 4). SPEC §5.
//
// L[energy][house] = 9 × 12 = 108 scored signals. Each cell = "what this energy is
// doing in this area of life, right now." They collapse into 9 energy scores + 12
// life-area scores + the current two-energy blend that drives everything the user sees.
//
// Design note (D-07): we score cell MAGNITUDE (intensity, always ≥ 0) using |dignity|
// as loudness, and carry `polarity`/`dignity` separately for the synthesis layer to
// colour gift-vs-trap. This avoids a neutral-dignity planet (dignity ≈ 0) zeroing its
// cells, which the raw "× strength" product in §5.1 would do.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Chart, Checkin, DashaStack, Energy, Graha, House, LifeArea, ReadingInput,
  SignalCell, TransitState,
} from '../types.js';
import {
  GRAHAS, GRAHA_TO_ENERGY, ENERGY_TO_GRAHA, SIGN_LORD, HOUSE_NATURE_WEIGHT,
  HOUSE_TO_AREA, AREA_TO_HOUSE, ENERGIES,
} from '../constants.js';
import { DEFAULT_CONFIG, type EngineConfig } from '../types.js';
import type { Ashtakavarga } from '../chart/ashtakavarga.js';
import { AV_PLANETS } from '../chart/ashtakavarga.js';

/** Sign occupying whole-sign house H for a given Lagna. */
function signOfHouse(lagnaSign: number, house: number): number {
  return (lagnaSign + house - 1) % 12;
}

/** influence(P,H): occupancy + lordship + aspect (SPEC §5.1). */
function influence(chart: Chart, p: Graha, h: House, cfg: EngineConfig): number {
  const planet = chart.planets[p];
  let inf = 0;
  if (planet.house === h) inf += cfg.wOccupy;
  if (SIGN_LORD[signOfHouse(chart.lagnaSign, h)] === p) inf += cfg.wLordship;
  if (planet.aspects.includes(h)) inf += cfg.wAspect;
  return inf;
}

/** Expression magnitude of a planet: driven by the composite Shadbala-inspired
 *  strength (dignity in D1+D9, dig/cheshta/naisargika/paksha bala). Floor keeps
 *  every planet audible; strong (esp. vargottama/exalted) planets speak loudest. */
function expression(chart: Chart, p: Graha): number {
  return 0.25 + 0.9 * chart.planets[p].strength;
}

/** Static cell magnitude (natal only), always ≥ 0. */
export function cellStatic(chart: Chart, p: Graha, h: House, cfg: EngineConfig): number {
  return influence(chart, p, h, cfg) * expression(chart, p) * (HOUSE_NATURE_WEIGHT[h] ?? 1);
}

/** dasha_weight(P): m1 maha + m2 antar + … (SPEC §5.2). A lord may appear at levels. */
function dashaWeight(p: Graha, stack: DashaStack, cfg: EngineConfig): number {
  const [m1, m2, m3, m4, m5] = cfg.dashaMultipliers;
  let w = 0;
  if (stack.maha === p) w += m1;
  if (stack.antar === p) w += m2;
  if (stack.pratyantar === p) w += m3;
  if (stack.sookshma === p) w += m4;
  if (stack.prana === p) w += m5;
  return w;
}

/** Ashtakavarga potency of a planet's current transit sign (0..2, 1 ≈ average). */
function avFactor(p: Graha, transitSign: number, av: Ashtakavarga | undefined): number {
  if (!av || !(AV_PLANETS as readonly Graha[]).includes(p)) return 1;
  const bindus = av.bav[p as (typeof AV_PLANETS)[number]]?.[transitSign] ?? 4;
  return bindus / 4; // 8 bindus → 2×, 4 (average) → 1×, 0 → 0×
}

/** transit_weight(P,H): transiting P sitting in H (from natal Moon), weighted by its
 *  Ashtakavarga bindus in the transited sign, + Sade Sati. */
function transitWeight(
  p: Graha, h: House, transit: TransitState, cfg: EngineConfig, av: Ashtakavarga | undefined,
): number {
  let w = 0;
  if (transit.houseFromMoon[p] === h) {
    w += cfg.transitWeight * avFactor(p, transit.signs[p]!, av);
  }
  if (p === 'saturn' && transit.sadeSati) w += cfg.sadeSatiWeight;
  return w;
}

/** Mood → small energy nudges (SPEC §5.2 check-in). */
const MOOD_LIFT: Record<string, Partial<Record<Energy, number>>> = {
  focused:  { mind: 1 },
  foggy:    { crave: 1, let: 0.5 },
  anxious:  { crave: 1, feel: 0.7 },
  wired:    { fire: 1, crave: 0.6 },
  drained:  { build: 0.8, let: 0.8 },
  restless: { crave: 1, fire: 0.6 },
};

function checkinWeight(p: Graha, checkin: Checkin | undefined): number {
  if (!checkin?.mood) return 0;
  const lift = MOOD_LIFT[checkin.mood.toLowerCase()];
  return lift?.[GRAHA_TO_ENERGY[p]] ?? 0;
}

export interface LatticeResult {
  cells: SignalCell[];
  energyScore: Record<Energy, number>;
  houseScore: number[]; // index 0 = house 1
}

/** Compute the full 108-cell live lattice + aggregates (SPEC §5.2–§5.3). */
export function computeLattice(
  chart: Chart,
  stack: DashaStack,
  transit: TransitState,
  checkin?: Checkin,
  cfg: EngineConfig = DEFAULT_CONFIG,
  av?: Ashtakavarga,
): LatticeResult {
  const cells: SignalCell[] = [];
  const energyScore = Object.fromEntries(ENERGIES.map((e) => [e, 0])) as Record<Energy, number>;
  const houseScore = new Array(12).fill(0) as number[];

  for (const p of GRAHAS) {
    const energy = GRAHA_TO_ENERGY[p];
    const dw = dashaWeight(p, stack, cfg);
    const cw = checkinWeight(p, checkin);
    for (let h = 1 as House; h <= 12; h = (h + 1) as House) {
      const stat = cellStatic(chart, p, h, cfg);
      const tw = transitWeight(p, h, transit, cfg, av);
      const live = stat
        * (1 + cfg.alpha * dw + cfg.beta * tw)
        * (1 + cfg.gamma * cw);
      cells.push({ energy, house: h, static: stat, live });
      energyScore[energy] += live;
      houseScore[h - 1] = houseScore[h - 1]! + live;
    }
  }

  // Check-in focus lifts the matching life-area house (SPEC §5.2).
  if (checkin?.focus) {
    const h = AREA_TO_HOUSE[checkin.focus];
    houseScore[h - 1] = houseScore[h - 1]! * (1 + cfg.gamma);
  }

  return { cells, energyScore, houseScore };
}

/** Rank the hottest life areas (SPEC §5.3). */
export function dominantAreas(houseScore: number[], top = 3): LifeArea[] {
  return houseScore
    .map((score, i) => ({ area: HOUSE_TO_AREA[i + 1]!, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
    .map((x) => x.area);
}

/** The passing energy = the stronger of {antar, pratyantar} that isn't the maha. */
export function pickPassingEnergy(
  stack: DashaStack, energyScore: Record<Energy, number>,
): Energy {
  const major = GRAHA_TO_ENERGY[stack.maha];
  const candidates: Energy[] = [stack.antar, stack.pratyantar]
    .map((g) => GRAHA_TO_ENERGY[g])
    .filter((e) => e !== major);
  if (candidates.length === 0) return GRAHA_TO_ENERGY[stack.antar];
  return candidates.sort((a, b) => (energyScore[b] ?? 0) - (energyScore[a] ?? 0))[0]!;
}
