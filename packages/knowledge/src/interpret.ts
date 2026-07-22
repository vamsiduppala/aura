// ─────────────────────────────────────────────────────────────────────────────
// Interpretation engine — composes readable natural-language meaning from the
// structured knowledge (planet + house + sign + dignity), the way a Jyotishi reads a
// placement. Deterministic; used by the Cosmic Mentor and the Blueprint kundali view.
// ─────────────────────────────────────────────────────────────────────────────

import type { Graha } from './types.js';
import { GRAHAS } from './data/grahas.js';
import { RASI_BY_INDEX } from './data/rasis.js';
import { BHAVA } from './data/bhavas.js';
import { dignityOf } from './data/dignities.js';
import { naturalRelation } from './data/relationships.js';

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function pick<T>(arr: T[], n: number): T[] { return arr.slice(0, n); }
function list(arr: string[]): string {
  if (arr.length <= 1) return arr[0] ?? '';
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

export type Dignity = 'exalted' | 'own' | 'moolatrikona' | 'friend' | 'neutral' | 'enemy' | 'debilitated';

/** Classify a planet's dignity in a sign (0..11) from the standard rules + relationships. */
export function classifyDignity(graha: Graha, sign: number): Dignity {
  const d = dignityOf(graha);
  const s = ((sign % 12) + 12) % 12;
  if (d.exalt === s) return 'exalted';
  if (d.debil === s) return 'debilitated';
  if (d.moolatrikona === s) return 'moolatrikona';
  if (d.own.includes(s)) return 'own';
  const lord = RASI_BY_INDEX(s).lord;
  if (lord === graha) return 'own';
  const rel = naturalRelation(graha, lord);
  return rel === 'friend' ? 'friend' : rel === 'enemy' ? 'enemy' : 'neutral';
}

export interface Placement {
  graha: Graha;
  house: number;     // 1..12
  sign: number;      // 0..11
  dignity?: Dignity;
  retrograde?: boolean;
  combust?: boolean;
}

export interface Interpretation { title: string; text: string; keywords: string[] }

/** Tone from planet nature × house category × dignity. */
function toneClause(graha: Graha, house: number, dignity?: Dignity): string {
  const g = GRAHAS[graha]!;
  const b = BHAVA(house);
  const strong = dignity === 'exalted' || dignity === 'own' || dignity === 'moolatrikona';
  const weak = dignity === 'debilitated' || dignity === 'enemy';
  const dusthana = b.categories.includes('dusthana');
  const auspicious = b.categories.includes('trikona') || b.categories.includes('kendra');

  if (g.naturalNature === 'benefic' && auspicious) {
    return strong
      ? 'This is one of the strongest, most blessing placements you carry — this area tends to flow and reward you.'
      : 'A supportive placement: this area of life is gently favoured, especially when you lean into it.';
  }
  if (g.naturalNature === 'malefic' && dusthana) {
    return strong
      ? 'A demanding placement that you’re actually equipped for — it brings challenge here, but also real depth and the strength to master it.'
      : 'This can bring friction or delay in this area — treat it as the place life asks you to grow, not a verdict.';
  }
  if (weak) return 'This part of you works harder for its results here — the growth comes through patience, not ease.';
  if (strong) return 'A well-placed, capable energy here — you have genuine command over this area.';
  return 'A workable placement — its colour depends on the rest of the chart, but this is where the energy focuses.';
}

/** Interpret a single planet placement into a readable paragraph. */
export function interpretPlacement(p: Placement): Interpretation {
  const g = GRAHAS[p.graha]!;
  const b = BHAVA(p.house);
  const r = RASI_BY_INDEX(p.sign);

  const title = `${g.english} in the ${ORD[p.house]} house (${b.english}), in ${r.english}`;
  const sigSample = list(pick(b.significations, 3));
  const traitSample = list(pick(r.indications, 2));

  let text = `Your ${g.english} — which governs ${g.governs} (${list(pick(g.significations, 3))}) — is focused in your ${b.english.toLowerCase()}: ${sigSample}. `;
  text += `In ${r.english} it takes on a ${traitSample} quality. `;
  if (p.retrograde) text += 'Retrograde, its themes turn inward and revisit — you work them out internally before the world sees them. ';
  if (p.combust) text += 'Close to the Sun, it can be a little overshadowed — its gifts are real but quieter until you claim them. ';
  text += toneClause(p.graha, p.house, p.dignity);

  const keywords = [...pick(g.significations, 2), ...pick(b.significations, 2), r.indications[0]!].filter(Boolean);
  return { title, text, keywords };
}

/** Interpret the ascendant lord (lagnesha) placement — the "you" of the chart. */
export function interpretLagnaLord(lord: Graha, lordHouse: number, lordSign: number): Interpretation {
  const g = GRAHAS[lord]!;
  const b = BHAVA(lordHouse);
  const r = RASI_BY_INDEX(lordSign);
  return {
    title: `Your chart ruler is ${g.english}, placed in the ${ORD[lordHouse]} house`,
    text: `Because ${g.english} rules your rising sign, it acts like the captain of your whole chart — the thread of "you". It sits in your ${b.english.toLowerCase()} (${list(pick(b.significations, 3))}) in ${r.english}, so a lot of your life energy naturally flows toward ${b.english.toLowerCase()} matters, coloured by a ${list(pick(r.indications, 2))} style.`,
    keywords: ['chart ruler', ...pick(b.significations, 2)],
  };
}
