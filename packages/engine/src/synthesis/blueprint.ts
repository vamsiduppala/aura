// ─────────────────────────────────────────────────────────────────────────────
// Blueprint (SPEC §8 screen 7). The energies you were born carrying, as a clean,
// shareable set of rows. Derived from the strongest natal placements — Lagna lord,
// most-prominent planet, strongest grace, inner guide — rendered as energies.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Energy, Graha, House } from '../types.js';
import { DEFAULT_CONFIG } from '../types.js';
import { GRAHAS, GRAHA_TO_ENERGY, SIGN_LORD, ENERGY_META } from '../constants.js';
import { cellStatic } from '../lattice/compute.js';
import { detectYogas } from '../chart/yogas.js';

/** One-line identity descriptions per energy (mockup lines where given). */
const BLUEPRINT_DESC: Record<Energy, string> = {
  main:  'You’re here to be seen — and to lead when it counts.',
  feel:  'You feel a room before you read it.',
  fire:  'You move first. Courage is your default setting.',
  mind:  'Your mind is quick, curious, and hard to fool.',
  grow:  'You grow what you touch; luck follows your generosity.',
  love:  'You pull people in without trying.',
  build: 'You build things that are meant to last.',
  crave: 'Your hunger is the engine. Aim it well.',
  let:   'You travel light and see what others cling to.',
};

export interface BlueprintRow {
  role: string;
  energy: Energy;
  desc: string;
}

/** Natal prominence per planet = summed static cell magnitude across the 12 houses. */
export function natalProminence(chart: Chart): Record<Graha, number> {
  const out = {} as Record<Graha, number>;
  for (const g of GRAHAS) {
    let s = 0;
    for (let h = 1 as House; h <= 12; h = (h + 1) as House) {
      s += cellStatic(chart, g, h, DEFAULT_CONFIG);
    }
    out[g] = s;
  }
  return out;
}

export function buildBlueprint(chart: Chart): BlueprintRow[] {
  const prom = natalProminence(chart);
  const byProm = [...GRAHAS].sort((a, b) => prom[b] - prom[a]);
  const used = new Set<Energy>();

  const take = (g: Graha, role: string): BlueprintRow => {
    let energy = GRAHA_TO_ENERGY[g];
    if (used.has(energy)) {
      // pick the next most-prominent planet whose energy is unused
      const alt = byProm.find((x) => !used.has(GRAHA_TO_ENERGY[x]));
      energy = alt ? GRAHA_TO_ENERGY[alt] : energy;
    }
    used.add(energy);
    return { role, energy, desc: BLUEPRINT_DESC[energy] };
  };

  const lagnaLord = SIGN_LORD[chart.lagnaSign]!;
  const moonLord = SIGN_LORD[chart.moonSign]!;
  const benefics: Graha[] = ['venus', 'jupiter', 'moon', 'mercury'];

  const rows: BlueprintRow[] = [];
  rows.push(take(lagnaLord, 'Anchored by'));
  // Driven by: most prominent planet overall.
  rows.push(take(byProm.find((g) => !used.has(GRAHA_TO_ENERGY[g]))!, 'Driven by'));
  // Softened by: most prominent grace.
  const grace = benefics
    .filter((g) => !used.has(GRAHA_TO_ENERGY[g]))
    .sort((a, b) => prom[b] - prom[a])[0]
    ?? byProm.find((g) => !used.has(GRAHA_TO_ENERGY[g]))!;
  rows.push(take(grace, 'Softened by'));
  // Guided by: the inner compass — the Moon-sign lord.
  const guide = used.has(GRAHA_TO_ENERGY[moonLord])
    ? byProm.find((g) => !used.has(GRAHA_TO_ENERGY[g]))!
    : moonLord;
  rows.push(take(guide, 'Guided by'));

  return rows;
}

/** The user's best standing strength to offer as the way out — their top born gift,
 *  else their driving blueprint energy. Shared by the reading, the mentor, and the app. */
export function standingStrength(chart: Chart): { name: string; note: string } {
  const yogas = detectYogas(chart);
  if (yogas.length > 0) return { name: yogas[0]!.name, note: yogas[0]!.blurb };
  const rows = buildBlueprint(chart);
  const driver = rows.find((r) => r.role === 'Driven by') ?? rows[0]!;
  return { name: ENERGY_META[driver.energy].label, note: driver.desc };
}

export { BLUEPRINT_DESC };
