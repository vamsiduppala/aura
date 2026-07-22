// ─────────────────────────────────────────────────────────────────────────────
// Yogas — classical planetary combinations (accuracy + credibility). We detect the
// well-known, reliably-computable ones and translate each into a jargon-free "born
// gift" (name + blurb + energy) for the Blueprint. The Sanskrit names stay internal.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Energy, Graha } from '../types.js';
import { SIGN_LORD, DIGNITY, GRAHA_TO_ENERGY } from '../constants.js';
import { houseFrom } from '../astro/angles.js';

export interface YogaResult {
  /** Internal key (classical name). */
  key: string;
  /** Plain, jargon-free name shown to the user. */
  name: string;
  /** Plain description in the app's voice. */
  blurb: string;
  energy: Energy;
}

const KENDRAS = [1, 4, 7, 10];

function lordOf(chart: Chart, house: number): Graha {
  return SIGN_LORD[(chart.lagnaSign + house - 1) % 12]!;
}
function sameSign(chart: Chart, a: Graha, b: Graha): boolean {
  return chart.planets[a].sign === chart.planets[b].sign;
}
function inOwnOrExalt(chart: Chart, g: Graha): boolean {
  const s = chart.planets[g].sign;
  const d = DIGNITY[g];
  return d.ownSigns.includes(s) || d.exaltSign === s;
}

/** The 5 Pancha Mahapurusha yogas: a planet in own/exaltation AND in a kendra. */
const MAHAPURUSHA: Record<string, { graha: Graha; name: string; blurb: string }> = {
  ruchaka: { graha: 'mars', name: 'The Commander', blurb: 'Courage and drive are built into you — you lead by doing, and pressure tends to sharpen you rather than break you.' },
  bhadra: { graha: 'mercury', name: 'The Sharp Mind', blurb: 'Wit, analysis, and clear communication are your edge — you learn fast and make yourself understood.' },
  hamsa: { graha: 'jupiter', name: 'The Teacher', blurb: 'Wisdom and good judgment come naturally; people look to you for guidance, and generosity comes back to you.' },
  malavya: { graha: 'venus', name: 'The Magnetic One', blurb: 'Beauty, warmth, and comfort gather around you — you draw people and good things in without forcing it.' },
  sasa: { graha: 'saturn', name: 'The Builder', blurb: 'Discipline and endurance are your superpower. You outlast, and what you build is made to hold.' },
};

/** Detect the notable yogas present in a natal chart, as plain "born gifts". */
export function detectYogas(chart: Chart): YogaResult[] {
  const out: YogaResult[] = [];
  const p = chart.planets;

  // Pancha Mahapurusha
  for (const [key, m] of Object.entries(MAHAPURUSHA)) {
    if (KENDRAS.includes(p[m.graha].house) && inOwnOrExalt(chart, m.graha)) {
      out.push({ key, name: m.name, blurb: m.blurb, energy: GRAHA_TO_ENERGY[m.graha] });
    }
  }

  // Gajakesari — Jupiter in a kendra from the Moon.
  if (KENDRAS.includes(houseFrom(p.jupiter.sign, p.moon.sign))) {
    out.push({ key: 'gajakesari', name: 'The Respected Voice', blurb: 'People instinctively trust your judgment. Wisdom, calm, and standing tend to find you — especially when you stay generous.', energy: 'grow' });
  }

  // Budhaditya — Sun + Mercury together.
  if (sameSign(chart, 'sun', 'mercury')) {
    out.push({ key: 'budhaditya', name: 'The Bright Thinker', blurb: 'Your intelligence and your identity move together — you think quickly and you get heard. Great for anything built on ideas and voice.', energy: 'mind' });
  }

  // Chandra-Mangala — Moon + Mars together (drive from feeling; resourcefulness).
  if (sameSign(chart, 'moon', 'mars')) {
    out.push({ key: 'chandra-mangala', name: 'Fire in the Feeling', blurb: 'You turn emotion into action and effort into resources. When you care, you move — and that drive can build real security.', energy: 'fire' });
  }

  // Raja Yoga (simplified) — a kendra lord conjunct a trikona lord (different planets).
  const kendraLords = new Set([1, 4, 7, 10].map((h) => lordOf(chart, h)));
  const trikonaLords = new Set([1, 5, 9].map((h) => lordOf(chart, h)));
  let raja = false;
  for (const k of kendraLords) for (const t of trikonaLords) {
    if (k !== t && sameSign(chart, k, t)) raja = true;
  }
  if (raja) out.push({ key: 'raja', name: 'The Rise', blurb: 'You’re built to climb. When capability and opportunity line up — and for you they do — you can rise fast. Aim it at something that matters.', energy: 'main' });

  // Dhana Yoga (simplified) — wealth lords (2/11) conjunct a benefic-house lord (1/5/9).
  const dhanaLords = [lordOf(chart, 2), lordOf(chart, 11)];
  const wealthLinks = [lordOf(chart, 1), lordOf(chart, 5), lordOf(chart, 9)];
  let dhana = sameSign(chart, dhanaLords[0]!, dhanaLords[1]!);
  for (const d of dhanaLords) for (const w of wealthLinks) if (d !== w && sameSign(chart, d, w)) dhana = true;
  if (dhana) out.push({ key: 'dhana', name: 'The Provider', blurb: 'Resources tend to gather around your efforts. You have a real knack for turning what you do into what you have — steady, not flashy.', energy: 'grow' });

  return out;
}
