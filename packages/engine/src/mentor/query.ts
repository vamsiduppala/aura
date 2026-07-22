// ─────────────────────────────────────────────────────────────────────────────
// Cosmic Mentor — the engine-side query the chat LLM is FORCED to call (SPEC pivot §3).
// The LLM never invents astrology; it extracts {focus, timeframe} and this function
// returns the REAL deterministic engine data (energies, focus-area heat, the approved
// gift/trap/remedy copy, dates) for the LLM to narrate. This is the only source of truth.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chart, Energy, LifeArea } from '../types.js';
import { DEFAULT_CONFIG, type EngineConfig } from '../types.js';
import { ENERGY_META, AREA_META, AREA_TO_HOUSE } from '../constants.js';
import { CONTENT } from '../content/templates.js';
import { computeReadingInput } from '../engine.js';
import { buildRetrospective } from '../synthesis/retrospective.js';
import { buildForecast } from '../synthesis/forecast.js';
import { standingStrength } from '../synthesis/blueprint.js';
import type { Ephemeris } from '../astro/ephemeris.js';

export type Timeframe = 'past' | 'now' | 'future';

export interface MentorQuery { focus: LifeArea; timeframe: Timeframe; }

/** Compact, factual engine data for the LLM to narrate. No prose invention allowed. */
/** Natural-language phrase for each life area (reads well after "there's heat in …"). */
const FOCUS_PHRASE: Record<LifeArea, string> = {
  self: 'you and how you show up', money: 'money and what you value',
  communication: 'how you speak up and connect', home: 'home and family',
  creativity: 'romance and what you make', health: 'your body and daily rhythm',
  partnership: 'your close relationships', transformation: 'the deep changes underway',
  luck: 'luck, learning and the big picture', career: 'your work and direction',
  gains: 'your goals and your network', release: 'rest and what you’re letting go of',
};

export interface MentorAnswer {
  focus: string;
  /** Natural-language phrase for the focus area (for smooth narration). */
  focusPhrase: string;
  timeframe: Timeframe;
  majorEnergy: string;
  passingEnergy: string;
  /** The energy most relevant to the answer (the focus/shift energy). */
  keyEnergy: string;
  keyEnergyMeaning: string;
  focusAreaHeat: 'high' | 'medium' | 'low';
  /** Approved, deterministic beats — the LLM rephrases these, never replaces them. */
  gift: string;
  trap: string;
  remedy: string;
  /** For past/future: the period the answer refers to. */
  period?: { startISO: string; endISO: string };
  /** Notable transit context, if any. */
  transitNote?: string;
  /** The user's real standing strength to lean on — a born gift or driving energy. */
  strength: { name: string; note: string };
}

function heatBand(value: number, all: number[]): 'high' | 'medium' | 'low' {
  const max = Math.max(...all, 1e-9);
  const r = value / max;
  return r >= 0.7 ? 'high' : r >= 0.4 ? 'medium' : 'low';
}

function label(e: Energy): string { return ENERGY_META[e].label; }

/**
 * Answer a mentor query with real engine data. Deterministic; the LLM only narrates it.
 */
export function answerMentorQuery(
  chart: Chart, q: MentorQuery, now: Date, ephem: Ephemeris,
  config: EngineConfig = DEFAULT_CONFIG,
): MentorAnswer {
  const focusLabel = AREA_META[q.focus].label;
  const strength = standingStrength(chart);

  if (q.timeframe === 'past') {
    const retro = buildRetrospective(chart, now, ephem, { focusArea: q.focus });
    const item = retro[retro.length - 1] ?? retro[0];
    const now_ri = computeReadingInput(chart, now, ephem, { goalArea: q.focus, config });
    const e: Energy = item?.energy ?? now_ri.passingEnergy;
    return {
      focus: focusLabel,
      focusPhrase: FOCUS_PHRASE[q.focus],
      strength,
      timeframe: 'past',
      majorEnergy: label(now_ri.majorEnergy),
      passingEnergy: label(now_ri.passingEnergy),
      keyEnergy: label(e),
      keyEnergyMeaning: item?.statement ?? ENERGY_META[e].gloss,
      focusAreaHeat: heatBand(now_ri.houseScore[AREA_TO_HOUSE[q.focus] - 1] ?? 0, now_ri.houseScore),
      gift: CONTENT[e].gift[0]!,
      trap: CONTENT[e].trap[0]!,
      remedy: CONTENT[e].remedies[0]!,
      ...(item ? { period: { startISO: item.start, endISO: item.end } } : {}),
    };
  }

  if (q.timeframe === 'future') {
    const fc = buildForecast(chart, now, config);
    const upcoming = fc.monthly.find((p) => new Date(p.start).getTime() > now.getTime()) ?? fc.monthly[0];
    const e: Energy = upcoming?.energy ?? computeReadingInput(chart, now, ephem, { config }).passingEnergy;
    const now_ri = computeReadingInput(chart, now, ephem, { goalArea: q.focus, config });
    return {
      focus: focusLabel,
      focusPhrase: FOCUS_PHRASE[q.focus],
      strength,
      timeframe: 'future',
      majorEnergy: label(now_ri.majorEnergy),
      passingEnergy: label(now_ri.passingEnergy),
      keyEnergy: label(e),
      keyEnergyMeaning: ENERGY_META[e].gloss,
      focusAreaHeat: heatBand(now_ri.houseScore[AREA_TO_HOUSE[q.focus] - 1] ?? 0, now_ri.houseScore),
      gift: CONTENT[e].gift[0]!,
      trap: CONTENT[e].trap[0]!,
      remedy: CONTENT[e].remedies[0]!,
      ...(upcoming ? { period: { startISO: upcoming.start, endISO: upcoming.end } } : {}),
    };
  }

  // now
  const ri = computeReadingInput(chart, now, ephem, { goalArea: q.focus, config });
  const key = ri.passingEnergy; // the active shift is what "right now" is about
  return {
    focus: focusLabel,
    focusPhrase: FOCUS_PHRASE[q.focus],
    strength,
    timeframe: 'now',
    majorEnergy: label(ri.majorEnergy),
    passingEnergy: label(ri.passingEnergy),
    keyEnergy: label(key),
    keyEnergyMeaning: ENERGY_META[key].gloss,
    focusAreaHeat: heatBand(ri.houseScore[AREA_TO_HOUSE[q.focus] - 1] ?? 0, ri.houseScore),
    gift: CONTENT[ri.majorEnergy].gift[0]!,
    trap: CONTENT[key].trap[0]!,
    remedy: CONTENT[key].remedies[0]!,
    ...(ri.transit.sadeSati ? { transitNote: `A long, testing chapter is active (phase: ${ri.transit.sadeSati}).` } : {}),
  };
}
