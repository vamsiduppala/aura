// ─────────────────────────────────────────────────────────────────────────────
// Retrospective ("Prove It", SPEC pivot §1). Run the SAME engine backwards over the
// last ~18 months, surface the 2–3 most significant past energy shifts, and state —
// in past tense — what the user most likely lived through. This builds trust before
// we ever predict the future ("how did it know that?"). Fully deterministic; no LLM.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Energy, LifeArea } from '../types.js';
import { AREA_META, AREA_TO_HOUSE } from '../constants.js';
import { computeReadingInput } from '../engine.js';
import { dateFromJd } from '../astro/julian.js';
import { getPeriodsAt } from '../dasha/vimshottari.js';
import type { Ephemeris } from '../astro/ephemeris.js';

/** Past-tense "what likely happened" per energy (multiple variants → feels tailored).
 *  `{area}` is filled at build time; a variant is chosen deterministically per period. */
const RETRO: Record<Energy, string[]> = {
  main: [
    'your visibility spiked around {area} — a real moment to be seen, or a bruising fight to be recognized for what you were actually doing.',
    'it was all about being seen around {area} — you either stepped into a spotlight, or burned energy proving you mattered to someone who wasn’t looking.',
  ],
  feel: [
    'your feelings ran the show around {area} — a tender, turbulent stretch where a single mood could tip a whole decision.',
    'everything around {area} hit you in the chest first — you were reading rooms, taking things personally, needing comfort more than usual.',
  ],
  fire: [
    'friction flared around {area} — you pushed hard, maybe clashed with someone, or forced a result that really needed another beat of patience.',
    'you were running hot around {area} — a lot of drive, a shorter fuse, and at least one fight you half-wish you’d handled slower.',
  ],
  mind: [
    'your mind wouldn’t settle around {area} — overthinking, second-guessing, a decision you kept re-opening long after it was made.',
    'you were stuck in your head about {area} — too many tabs, too many drafts, talking yourself in and out of the same call.',
  ],
  grow: [
    'a door opened around {area} — an opportunity or lucky break arrived, and part of you almost didn’t trust it enough to walk through.',
    'things loosened up around {area} — momentum came back, maybe an offer or an opening, and the hard part was just saying a clean yes.',
  ],
  love: [
    'connection and comfort pulled focus around {area} — something warmed up, or you smoothed a thing over instead of actually solving it.',
    'the soft stuff took over around {area} — you leaned into closeness, or kept the peace by swallowing the thing you actually needed to say.',
  ],
  build: [
    'the weight sat squarely on {area} — you were grinding without recognition, likely passed over for something you’d earned, or feeling invisible despite doing the work.',
    'it got heavy and slow around {area} — a long stretch of carrying it alone, doing the unglamorous work while it felt like no one noticed.',
  ],
  crave: [
    'a restless hunger gripped {area} — you chased more, faster, and somehow felt behind no matter how much you got done.',
    'you couldn’t sit still about {area} — comparing, reaching, chasing the next thing, running on too little sleep and too much wanting.',
  ],
  let: [
    'something loosened around {area} — an ending, a stepping-back, or a quiet loss you had to make your peace with.',
    'you were letting go of something around {area} — pulling back, closing a chapter, or quietly detaching from what used to matter more.',
  ],
};

/** Small deterministic hash for variant selection. */
function pickHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export interface RetroItem {
  energy: Energy;
  area: LifeArea;
  start: string; // ISO
  end: string;   // ISO
  /** Past-tense statement of what likely happened. */
  statement: string;
}

export interface RetrospectiveOptions {
  /** The user's stated focus; biases which shifts are surfaced + the area named. */
  focusArea?: LifeArea;
  /** How many months back to audit (default 18). */
  months?: number;
  /** How many shifts to surface (default 3). */
  count?: number;
}

/**
 * Build the retrospective audit — the most significant recent shifts, past tense.
 * Uses the real engine at each period's midpoint (dasha stack + transit + 108-lattice).
 */
export function buildRetrospective(
  chart: Chart, now: Date, ephem: Ephemeris, opts: RetrospectiveOptions = {},
): RetroItem[] {
  const months = opts.months ?? 18;
  const count = opts.count ?? 3;
  const focus = opts.focusArea;
  const birth = dateFromJd(chart.julianDayUT);
  const moonLong = chart.planets.moon.siderealLong;
  const from = new Date(now.getTime() - months * 30 * 86400_000);

  // Month-scale shifts (pratyantar) across the window.
  const periods = getPeriodsAt(moonLong, birth, 'pratyantar', from, now).slice(0, 16);

  const scored = periods.map((p) => {
    const mid = new Date((p.start.getTime() + p.end.getTime()) / 2);
    const input = computeReadingInput(chart, mid, ephem, focus ? { goalArea: focus } : {});
    const energy = input.passingEnergy;
    const area: LifeArea = focus ?? input.dominantAreas[0] ?? 'self';
    // Significance: how loud that shift's energy was, boosted if it hit the focus area.
    let sig = input.energyScore[energy] ?? 0;
    if (focus) sig += (input.houseScore[AREA_TO_HOUSE[focus] - 1] ?? 0) * 0.5;
    return { p, energy, area, sig };
  });

  // Pick the strongest DISTINCT energies (variety makes the audit land harder), then
  // fall back to remaining shifts if we can't reach `count` with distinct energies.
  const byStrength = [...scored].sort((a, b) => b.sig - a.sig);
  const chosen: typeof scored = [];
  const usedEnergies = new Set<Energy>();
  for (const s of byStrength) {
    if (chosen.length >= count) break;
    if (usedEnergies.has(s.energy)) continue;
    chosen.push(s); usedEnergies.add(s.energy);
  }
  for (const s of byStrength) {
    if (chosen.length >= count) break;
    if (!chosen.includes(s)) chosen.push(s);
  }
  const top = chosen.sort((a, b) => a.p.start.getTime() - b.p.start.getTime());

  const seed = Math.round(chart.lagnaLong * 1000);
  return top.map(({ p, energy, area }) => {
    const variants = RETRO[energy];
    const v = variants[pickHash(`${seed}|${p.start.toISOString()}|${energy}`) % variants.length]!;
    return {
      energy,
      area,
      start: p.start.toISOString(),
      end: p.end.toISOString(),
      statement: v.replace('{area}', AREA_META[area].label.toLowerCase()),
    };
  });
}

export { RETRO };
