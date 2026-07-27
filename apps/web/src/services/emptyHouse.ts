// An empty house is not an empty part of life. Classically, when no planet sits in a house, that
// area is read entirely from its RULER: where the ruler sits, how strong it is, and what condition
// it is in. Most of a person's houses are empty, so "nothing here" is the worst possible thing to
// tell them — this builds the real reading instead.

import type { Chart, Graha } from '@aura/engine';
import { SIGN_LORD } from '@aura/engine';
import { getBhava, getRasi, classifyDignity } from '@aura/knowledge';
import { grahaLabel } from '../ui';

/** What it means for one area of life to be carried from each other house. */
const RULER_LANDS_IN: Record<number, string> = {
  1: 'you carry it personally — it runs through your own identity and effort rather than through other people',
  2: 'it shows up through money, family and what you say — resources and speech are the channel',
  3: 'it comes through your own initiative, siblings and communication — you have to go and get it',
  4: 'it plays out at home, close to family, property and your private life',
  5: 'it comes through creativity, children, learning and a bit of luck — playful rather than forced',
  6: 'it arrives through work, routine, service and problem-solving — and usually after some struggle',
  7: 'it happens through other people — partners, clients, marriage. You rarely do this one alone',
  8: 'it moves through upheaval, shared resources and things you cannot fully control — sudden rather than steady',
  9: 'it comes through belief, teachers, travel and plain good fortune — doors tend to open',
  10: 'it becomes public — career, status and reputation are where this one lands',
  11: 'it arrives through networks, friends and gains — often later than you expect, but larger',
  12: 'it works behind the scenes — solitude, foreign places, rest and letting go. Quiet, not absent',
};

/** Plain-language reading of how strong the ruler is. */
function strengthNote(pct: number, dignity: string): string {
  const dignified = dignity === 'exalted' || dignity === 'own' || dignity === 'moolatrikona';
  const struggling = dignity === 'debilitated' || dignity === 'enemy';
  if (dignified && pct >= 55) return 'It is strong and well placed, so this area tends to look after itself.';
  if (dignified) return 'It sits in a friendly sign, so this area has real support even if it is not loud.';
  if (struggling && pct < 45) return 'It is working uphill, so this area asks for conscious effort — it improves a lot when you give it attention.';
  if (struggling) return 'It is in a difficult sign, so progress here is real but slower than you would like.';
  if (pct >= 55) return 'It is reasonably strong, so this area moves steadily when you engage with it.';
  return 'It is middling in strength — neither blocked nor effortless. What you put in is roughly what you get out.';
}

export interface EmptyHouseReading {
  /** "This area is carried by Venus, sitting in your 7th house." */
  headline: string;
  /** How it plays out in life, from where the ruler landed. */
  playsOut: string;
  /** What it depends on — the ruler's condition and the timing that activates it. */
  dependsOn: string;
}

/**
 * Build the reading for a house with no planets in it. `house` is 1..12.
 * Everything is derived: the sign on the house, its ruler, where that ruler sits and its condition.
 */
export function readEmptyHouse(chart: Chart, house: number): EmptyHouseReading {
  const sign = (chart.lagnaSign + house - 1) % 12;
  const ruler: Graha = SIGN_LORD[sign]!;
  const p = chart.planets[ruler];
  const rulerHouse = p.house;
  const pct = Math.round((p.strength ?? 0) * 100);
  const dignity = classifyDignity(ruler, p.sign);
  const bhava = getBhava(house);
  const rulerBhava = getBhava(rulerHouse);
  const name = grahaLabel(ruler);

  const sameHouse = rulerHouse === house;

  return {
    headline: sameHouse
      ? `No planet is sitting here, but its ruler ${name} is in its own house — so this area holds itself together.`
      : `No planet is sitting here, so this whole area is carried by its ruler, ${name}, which sits in your ${rulerHouse}${ord(rulerHouse)} house of ${rulerBhava.english.toLowerCase()}.`,
    playsOut: sameHouse
      ? `${bhava.english} matters run on their own terms for you — they are not borrowed from another part of life. ${strengthNote(pct, dignity)}`
      : `That means your ${bhava.english.toLowerCase()} — ${bhava.significations.slice(0, 3).join(', ')} — does not develop on its own. ${cap(RULER_LANDS_IN[rulerHouse] ?? 'it is carried elsewhere in your life')}. In practice, the two areas rise and fall together.`,
    dependsOn: `It depends on ${name}, which is at ${pct}% strength in ${getRasi(p.sign).english}. ${strengthNote(pct, dignity)} `
      + `It also depends on timing: this part of life gets loud during ${name}'s periods, and stays quiet in between — which is why it can feel like nothing happens here for years and then everything does at once.`,
  };
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const ord = (n: number): string => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
