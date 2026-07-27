// A plain-language portrait of the person, derived from the parts of the chart that classical
// texts actually tie to temperament — not vague adjectives. Everything here is computed:
//
//   mind          Moon's sign + its dignity + what aspects it (Ch 3/7: Moon = manas, the mind)
//   decisions     the lagna lord's sign modality + Mercury's condition (how choices get made)
//   lifestyle     the 4th house (home/comfort) + Venus (ease) + the chart's Naabhasa shape
//   environment   rising sign element + the 4th-house sign + strongest/weakest planets
//   comfort       Moon + 4th lord + the strongest benefic
//   drive         Mars + the 10th house (what actually gets someone moving)
//   friction      the weakest planet + any dusthana lords (where life asks the most)
//
// Each returns a short paragraph a non-astrologer can act on, with planet names kept for
// reference. Deterministic and pure, so it is unit-testable without a browser.

import type { Chart, Graha } from '@aura/engine';
import { SIGN_LORD } from '@aura/engine';
import {
  getRasi, classifyDignity, baladiAvastha, jagradiAvastha, deeptadiAvastha,
  dwadasaVargeeyaBala, vargaSign, taraOf, tithiOf, nityaYoga,
} from '@aura/knowledge';
import { grahaLabel } from '../ui';

export interface PortraitSection { title: string; body: string }

const ELEMENT_MIND: Record<string, string> = {
  fire: 'quick and instinctive — you tend to know what you think before you can explain why',
  earth: 'concrete and evidence-led — you trust what you can test, weigh or touch',
  air: 'associative and verbal — you think by talking it through and connecting ideas',
  water: 'impressionistic and feeling-led — you read rooms and people before facts',
};

const MODALITY_DECISION: Record<string, string> = {
  movable: 'You decide fast and correct as you go. Starting is easy; the harder discipline is finishing what you began before the next idea arrives.',
  fixed: 'You decide slowly and then hold. Once committed you are very hard to move, which is a strength until the situation changes and the commitment does not.',
  dual: 'You decide by weighing, and you can hold two sides for a long time. Flexible and fair, but you can circle a choice long after you already know the answer.',
};

const ELEMENT_ENVIRONMENT: Record<string, string> = {
  fire: 'open, active spaces where something is happening and you can move',
  earth: 'settled, well-ordered spaces with good materials and few interruptions',
  air: 'social, stimulating spaces with people, conversation and things to look at',
  water: 'quiet, private spaces near water or greenery where nobody needs anything from you',
};

const dignityPhrase = (d: string): string => ({
  exalted: 'at its absolute strongest',
  moolatrikona: 'in its power seat',
  own: 'at home and comfortable',
  friend: 'well supported',
  neutral: 'neither helped nor hindered',
  enemy: 'working against friction',
  debilitated: 'having to work hardest',
}[d] ?? 'in a mixed condition');

const pct = (chart: Chart, g: Graha): number => Math.round((chart.planets[g].strength ?? 0) * 100);
const ALL: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

/** The house (1..12) a sign falls in, from the lagna. */
const houseOfSign = (chart: Chart, sign: number): number => ((sign - chart.lagnaSign + 12) % 12) + 1;

export function buildPortrait(chart: Chart): PortraitSection[] {
  const P = chart.planets;
  const strongest = [...ALL].sort((a, b) => pct(chart, b) - pct(chart, a))[0]!;
  const weakest = [...ALL].sort((a, b) => pct(chart, a) - pct(chart, b))[0]!;

  const moonSign = getRasi(P.moon.sign);
  const moonDig = classifyDignity('moon', P.moon.sign);
  const lagnaRasi = getRasi(chart.lagnaSign);
  const lagnaLord = SIGN_LORD[chart.lagnaSign]!;
  const lordSign = getRasi(P[lagnaLord].sign);
  const fourthSign = (chart.lagnaSign + 3) % 12;
  const fourthRasi = getRasi(fourthSign);
  const fourthLord = SIGN_LORD[fourthSign]!;
  const mercDig = classifyDignity('mercury', P.mercury.sign);

  const out: PortraitSection[] = [];

  // ── How your mind works — Moon is the mind in classical terms ──
  const moonAvastha = baladiAvastha(P.moon.siderealLong);
  out.push({
    title: 'How your mind works',
    body: `Your Moon — the mind itself in this system — sits in ${moonSign.english}, ${dignityPhrase(moonDig)}. `
      + `That makes your default thinking ${ELEMENT_MIND[moonSign.element] ?? 'mixed in style'}. `
      + `${jagradiAvastha(moonDig).name === 'Jaagrita'
        ? 'It is wide awake in your chart, so your instincts are usually worth trusting even before you have the reasoning.'
        : jagradiAvastha(moonDig).name === 'Sushupta'
          ? 'It runs quieter than most, so you do better writing a decision down than deciding in your head.'
          : 'It works at a moderate pitch — good judgment when rested, less reliable when you are stretched.'} `
      + `The Moon is in its ${moonAvastha.name.toLowerCase()} phase of the sign, which classically scales how freely it gives its results (${moonAvastha.result}).`,
  });

  // ── How you decide — lagna lord modality + Mercury ──
  out.push({
    title: 'How you make decisions',
    body: `${MODALITY_DECISION[lordSign.modality] ?? ''} `
      + `That comes from ${grahaLabel(lagnaLord)}, the ruler of your whole chart, sitting in ${lordSign.english} — a ${lordSign.modality} sign — in your ${houseOfSign(chart, P[lagnaLord].sign)}th house. `
      + `Mercury, which handles the actual weighing-up, is ${dignityPhrase(mercDig)} at ${pct(chart, 'mercury')}% strength: `
      + `${pct(chart, 'mercury') >= 55
        ? 'you can generally think your way out of a problem, and you argue well.'
        : 'under pressure you do better sleeping on it than deciding on the spot.'}`,
  });

  // ── Lifestyle — 4th house, Venus, and the chart's overall shape ──
  const venusPct = pct(chart, 'venus');
  const saturnPct = pct(chart, 'saturn');
  out.push({
    title: 'The life you gravitate toward',
    body: `Your 4th house — home, roots and what "settled" means to you — falls in ${fourthRasi.english}, ruled by ${grahaLabel(fourthLord)} `
      + `placed in your ${P[fourthLord].house}th house. ${venusPct >= saturnPct
        ? `With Venus (${venusPct}%) outweighing Saturn (${saturnPct}%), you lean toward comfort, beauty and good company — you will spend on quality of life before you spend on status.`
        : `With Saturn (${saturnPct}%) outweighing Venus (${venusPct}%), you lean toward structure and self-sufficiency — you are more comfortable with a spare, disciplined life than a luxurious one.`} `
      + `Your strongest planet overall is ${grahaLabel(strongest)} at ${pct(chart, strongest)}%, so ${strongest === 'sun' ? 'recognition and authority' : strongest === 'moon' ? 'emotional security and belonging' : strongest === 'mars' ? 'challenge and physical action' : strongest === 'mercury' ? 'ideas, words and clever work' : strongest === 'jupiter' ? 'learning, meaning and generosity' : strongest === 'venus' ? 'relationship, beauty and ease' : strongest === 'saturn' ? 'mastery earned slowly' : strongest === 'rahu' ? 'ambition and the unconventional' : 'solitude and inner work'} tends to organise your choices more than anything else.`,
  });

  // ── Environment — rising element + 4th sign ──
  out.push({
    title: 'Where you feel most yourself',
    body: `You rise in ${lagnaRasi.english}, a ${lagnaRasi.element} sign, which usually means you settle best in ${ELEMENT_ENVIRONMENT[lagnaRasi.element] ?? 'varied surroundings'}. `
      + `Your 4th house in ${fourthRasi.english} adds ${ELEMENT_ENVIRONMENT[fourthRasi.element] ?? 'its own texture'} to what "home" needs to feel like. `
      + `People meet the ${lagnaRasi.indications.slice(0, 3).join(', ')} side of you first, whatever is going on underneath.`,
  });

  // ── Comfort — Moon + strongest benefic ──
  const benefics: Graha[] = ['jupiter', 'venus', 'moon'];
  const bestBenefic = [...benefics].sort((a, b) => pct(chart, b) - pct(chart, a))[0]!;
  out.push({
    title: 'What actually settles you',
    body: `When you are depleted, the thing that reliably refills you is ruled by ${grahaLabel(bestBenefic)} (${pct(chart, bestBenefic)}%) — `
      + `${bestBenefic === 'jupiter' ? 'learning something, teaching someone, or being around a person wiser than you.'
        : bestBenefic === 'venus' ? 'beauty, music, good food and the company of someone easy to be with.'
          : 'rest, water, family and familiar surroundings — genuinely just sleep and home.'} `
      + `Your Moon in ${moonSign.english} means unsettled feelings show up as ${moonSign.element === 'fire' ? 'irritability and restlessness' : moonSign.element === 'earth' ? 'stubbornness and over-working' : moonSign.element === 'air' ? 'overthinking and too many open tabs' : 'withdrawal and going quiet'} before you notice them consciously.`,
  });

  // ── Drive — Mars + 10th ──
  const tenthSign = (chart.lagnaSign + 9) % 12;
  const tenthLord = SIGN_LORD[tenthSign]!;
  out.push({
    title: 'What gets you moving',
    body: `Mars sits at ${pct(chart, 'mars')}% in your ${P.mars.house}th house, ${dignityPhrase(classifyDignity('mars', P.mars.sign))}. `
      + `${pct(chart, 'mars') >= 55
        ? 'You have real fight in you and you start things without needing permission — the risk is heat, not hesitation.'
        : 'You do not run on aggression; you move when something matters, not when someone challenges you — the risk is delay, not conflict.'} `
      + `Your 10th house of work and public life is ruled by ${grahaLabel(tenthLord)} in your ${P[tenthLord].house}th house, which is where your effort tends to actually land.`,
  });

  // ── Friction — weakest planet ──
  out.push({
    title: 'Where life asks the most of you',
    body: `${grahaLabel(weakest)} is your quietest planet at ${pct(chart, weakest)}%, ${dignityPhrase(classifyDignity(weakest, P[weakest].sign))}, in your ${P[weakest].house}th house. `
      + `That is the area where things rarely come free — it is the muscle you have to train rather than the one you were born with. `
      + `The classical reading is not that it goes badly, but that it improves markedly with deliberate attention, and tends to become a real strength in the second half of life.`,
  });

  return out;
}

/** Deeper technical facts, for readers who want the machinery. Uses the heavier APIs. */
export interface TechnicalFact { label: string; value: string }

export function buildTechnicalFacts(chart: Chart): TechnicalFact[] {
  const P = chart.planets;
  const out: TechnicalFact[] = [];

  // Dwadasa Vargeeya Bala — strength across twelve divisional charts, not just one.
  const dvb = ALL.filter((g) => g !== 'rahu' && g !== 'ketu')
    .map((g) => ({ g, b: dwadasaVargeeyaBala(g, P[g].siderealLong).bala }))
    .sort((a, b) => b.b - a.b);
  const best = dvb[0]!, worst = dvb[dvb.length - 1]!;
  out.push({
    label: 'Strength across all 12 divisional charts (Dwaadasa Vargeeya Bala)',
    value: `${grahaLabel(best.g)} scores highest at ${best.b >= 0 ? '+' : ''}${best.b}, meaning it holds up well no matter which area of life you examine. `
      + `${grahaLabel(worst.g)} is lowest at ${worst.b >= 0 ? '+' : ''}${worst.b} — strong in the birth chart is not the same as strong everywhere.`,
  });

  // Navamsa (D-9) — the classical "second chart", read for inner life and marriage.
  const navLagna = vargaSign(P.moon.siderealLong, 9);
  out.push({
    label: 'Your Navamsa (D-9), the chart behind the chart',
    value: `Classically the D-9 shows the inner self and the second half of life. Your Moon falls in ${getRasi(navLagna).english} there. `
      + `A planet that is weak in the birth chart but strong here (vargottama, or well placed) usually delivers late rather than never.`,
  });

  // Avastha of the Sun — the soul-planet's "mood".
  const sunDig = classifyDignity('sun', P.sun.sign);
  out.push({
    label: 'Your Sun’s state (avastha)',
    value: `${baladiAvastha(P.sun.siderealLong).name} by age (${baladiAvastha(P.sun.siderealLong).result} results), `
      + `${jagradiAvastha(sunDig).name} by alertness, and ${deeptadiAvastha(sunDig).name} in mood — ${deeptadiAvastha(sunDig).meaning}. `
      + `The Sun carries how you hold authority and how visible you are willing to be.`,
  });

  // Panchanga of birth — the day's own quality.
  const t = tithiOf(P.sun.siderealLong, P.moon.siderealLong);
  const ny = nityaYoga(P.sun.siderealLong, P.moon.siderealLong);
  out.push({
    label: 'The day you were born (panchanga)',
    value: `Tithi ${t.name} (lunar day ${t.index} of 30, ${t.paksha === 'shukla' ? 'waxing' : 'waning'} half) and the nitya yoga ${ny.name}. `
      + `The waxing half classically favours building and beginning; the waning half favours completing and releasing.`,
  });

  // Janma tara — the birth star's own 9-fold cycle.
  const nak = Math.floor(((P.moon.siderealLong % 360) + 360) % 360 / (360 / 27));
  out.push({
    label: 'Your birth star cycle (tara)',
    value: `Your Moon's nakshatra is number ${nak + 1} of 27. Transits are read in a nine-step cycle from it — `
      + `${taraOf(nak, nak).name} is your own star, and the ${taraOf(nak, (nak + 2) % 27).name} and ${taraOf(nak, (nak + 4) % 27).name} steps are the ones classically flagged for care.`,
  });

  return out;
}
