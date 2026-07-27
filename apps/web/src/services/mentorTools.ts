// The tools the Cosmic Mentor can actually call. The LLM decides which to use and with what
// arguments; we execute them against the real engine and the local knowledge API, and hand the
// results back. The model never invents astrology — it only narrates what these return.
//
// Everything degrades: if the local API is down, the tools that can be answered from the bundled
// @aura/knowledge still work, and the ones that can't say so plainly rather than guessing.

import type { Aura, Chart, LifeArea, Graha } from '@aura/engine';
import { AREA_TO_HOUSE, AREA_META, SIGN_LORD } from '@aura/engine';
import { getRasi, getBhava, search, classifyDignity } from '@aura/knowledge';
import { buildKundali, dignityChip } from '../kundali';
import { buildPortrait, buildTechnicalFacts } from './portrait';
import { loadChartDashas } from './liveData';
import { computeYearAhead } from './yearAhead';
import { grahaLabel } from '../ui';
import { apiBase } from './api';

const AREAS: LifeArea[] = ['self', 'money', 'communication', 'home', 'creativity', 'health',
  'partnership', 'transformation', 'luck', 'career', 'gains', 'release'];

/** Neutral tool schema (adapted per-provider by the caller). */
export const MENTOR_TOOLS = [
  {
    name: 'get_chart_overview',
    description:
      "The user's whole birth chart at a glance: rising sign, chart ruler, every planet with its sign, house, dignity and strength, the Jaimini karakas, and the chart's overall shape. Call this when the question is broad ('tell me about my chart', 'what am I like').",
    parameters: { type: 'OBJECT', properties: {}, required: [] as string[] },
  },
  {
    name: 'get_life_area',
    description:
      "Everything about ONE area of the user's life: which house rules it, what sits there, the ruling planet and where it went, plus each placement's plain meaning. Use for 'why is my career stuck', 'what about love', 'money'.",
    parameters: {
      type: 'OBJECT',
      properties: { area: { type: 'STRING', enum: AREAS, description: 'The life area asked about.' } },
      required: ['area'],
    },
  },
  {
    name: 'get_timing',
    description:
      "The user's timing right now: current mahadasha (long season) and antardasha (chapter) with how far through they are, what comes next, and the Tajaka year-ahead. Use for 'when will things change', 'is this a good time to…', 'what's happening now'.",
    parameters: { type: 'OBJECT', properties: {}, required: [] as string[] },
  },
  {
    name: 'get_personality_read',
    description:
      "A computed portrait of the user: how their mind works, how they make decisions, the lifestyle they gravitate to, the environment that suits them, what settles them, what drives them, and where life asks the most. Use for 'what kind of person am I', 'why do I behave like this'.",
    parameters: { type: 'OBJECT', properties: {}, required: [] as string[] },
  },
  {
    name: 'get_advanced_chart_data',
    description:
      "Deeper classical layers of the user's chart: strength across all twelve divisional charts, the Navamsa, the Sun's avasthas, the birth panchanga, and the tara cycle. Use when the user asks something technical or wants more depth.",
    parameters: { type: 'OBJECT', properties: {}, required: [] as string[] },
  },
  {
    name: 'lookup_concept',
    description:
      "Look up what an astrological term MEANS from the encoded classical text (e.g. 'raja yoga', 'Saturn', 'the 7th house', 'nakshatra'). Use when the user asks a definition question rather than one about themselves.",
    parameters: {
      type: 'OBJECT',
      properties: { term: { type: 'STRING', description: 'The concept to look up.' } },
      required: ['term'],
    },
  },
  {
    name: 'get_daily_reading',
    description:
      "Today's actual reading for the user — the energies in play, the gift, the trap, the move and the remedy. Use for 'what about today', 'what should I do now', or when they describe a situation happening right now.",
    parameters: {
      type: 'OBJECT',
      properties: { area: { type: 'STRING', enum: AREAS, description: 'Optional life area to focus the reading on.' } },
      required: [] as string[],
    },
  },
];

export interface ToolContext { aura: Aura; chart: Chart; now: Date; goalArea?: LifeArea }

const ALL: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
const pct = (chart: Chart, g: Graha): number => Math.round((chart.planets[g].strength ?? 0) * 100);

/** Run a tool the model asked for. Returns a plain object the model can narrate. */
export async function runMentorTool(
  name: string, args: Record<string, unknown>, ctx: ToolContext,
): Promise<unknown> {
  const { aura, chart, now, goalArea } = ctx;

  switch (name) {
    case 'get_chart_overview': {
      const k = buildKundali(chart);
      return {
        risingSign: k.lagnaSignName,
        risingTraits: getRasi(chart.lagnaSign).indications.slice(0, 4),
        chartRuler: { planet: grahaLabel(k.lagnaLord), strengthPct: k.lagnaLordStrength, meaning: k.lagnaLordText },
        soulPlanet: grahaLabel(k.atmakaraka),
        partnerPlanet: grahaLabel(k.darakaraka),
        chartShape: k.shape,
        planets: ALL.map((g) => ({
          planet: grahaLabel(g),
          sign: getRasi(chart.planets[g].sign).english,
          house: chart.planets[g].house,
          dignity: dignityChip(classifyDignity(g, chart.planets[g].sign)) || 'neutral',
          strengthPct: pct(chart, g),
          retrograde: chart.planets[g].retrograde,
        })),
        rareCombinations: aura.yogas(chart).map((y) => ({ name: y.name, meaning: y.blurb })),
      };
    }

    case 'get_life_area': {
      const area = (AREAS.includes(args.area as LifeArea) ? args.area : goalArea ?? 'self') as LifeArea;
      const house = AREA_TO_HOUSE[area];
      const k = buildKundali(chart);
      const sign = (chart.lagnaSign + house - 1) % 12;
      const ruler = SIGN_LORD[sign]!;
      const occupants = k.rows.filter((r) => r.house === house);
      return {
        area: AREA_META[area].label,
        house,
        houseGoverns: getBhava(house).significations,
        signOnHouse: getRasi(sign).english,
        ruler: { planet: grahaLabel(ruler), sitsInHouse: chart.planets[ruler].house, strengthPct: pct(chart, ruler) },
        planetsHere: occupants.map((o) => ({
          planet: grahaLabel(o.graha), sign: o.signName, strengthPct: o.strength,
          dignity: dignityChip(o.dignity) || 'neutral', meaning: o.text,
        })),
        noteIfEmpty: occupants.length === 0
          ? `No planet sits in the ${house}th house, which is normal — this area is then read from its ruler ${grahaLabel(ruler)}.`
          : undefined,
      };
    }

    case 'get_timing': {
      const d = await loadChartDashas(chart).catch(() => null);
      const fc = aura.forecast(chart, now);
      let year: ReturnType<typeof computeYearAhead> | null = null;
      try { year = computeYearAhead(aura, chart, now); } catch { /* solar return unavailable */ }
      return {
        longSeason: {
          energy: fc.majorSeason.energy, started: fc.majorSeason.start,
          nextChangeOn: fc.majorSeason.nextStart, turnsInto: fc.majorSeason.nextEnergy,
        },
        vimshottari: d ? { rulingPlanet: grahaLabel(d.vimshottariNow.lord), percentThrough: Math.round(d.vimshottariNow.pct) } : null,
        ashtottari: d ? { rulingPlanet: grahaLabel(d.ashtottariNow.lord), percentThrough: Math.round(d.ashtottariNow.pct) } : null,
        upcomingShifts: fc.monthly.slice(0, 6).map((p) => ({ energy: p.energy, from: p.start, to: p.end, isNow: p.isNow })),
        yearAhead: year ? {
          year: year.year, munthaHouse: year.munthaHouse, munthaMeans: year.munthaMeaning,
          strongestPlanetThisYear: grahaLabel(year.strongestPlanet),
        } : null,
        source: d?.source ?? 'on-device',
      };
    }

    case 'get_personality_read':
      return { portrait: buildPortrait(chart) };

    case 'get_advanced_chart_data':
      return { technical: buildTechnicalFacts(chart) };

    case 'lookup_concept': {
      const term = String(args.term ?? '').trim();
      // Prefer the live API (same data, but proves the backend is wired); fall back to bundled.
      try {
        const res = await fetch(`${apiBase()}/search?q=${encodeURIComponent(term)}`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json() as { hits?: { label: string; summary: string }[] };
          if (data.hits?.length) return { term, definitions: data.hits.slice(0, 5), source: 'aura server' };
        }
      } catch { /* server down — bundled knowledge is identical */ }
      return { term, definitions: search(term).slice(0, 5).map((h) => ({ label: h.label, summary: h.summary })), source: 'on-device' };
    }

    case 'get_daily_reading': {
      const area = (AREAS.includes(args.area as LifeArea) ? args.area : goalArea ?? 'self') as LifeArea;
      const daily = aura.daily(chart, now, { goalArea: area });
      return {
        headline: daily.todayLine,
        longSeasonEnergy: daily.input.majorEnergy,
        currentChapterEnergy: daily.input.passingEnergy,
        gift: daily.reading.gift,
        trap: daily.reading.trap,
        move: daily.reading.move,
        watchFor: daily.reading.watch,
        remedy: daily.reading.remedy,
        focusArea: AREA_META[area].label,
      };
    }

    default:
      return { error: `Unknown tool "${name}".` };
  }
}
