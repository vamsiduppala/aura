import { describe, it, expect } from 'vitest';
import { CONTENT } from '../src/content/templates.js';
import { ENERGY_META, AREA_META, ENERGIES } from '../src/constants.js';
import { FORECAST_GLOSS, buildForecast } from '../src/synthesis/forecast.js';
import { BLUEPRINT_DESC, buildBlueprint } from '../src/synthesis/blueprint.js';
import {
  generateReading, generateExpandedReading, generateTodayLine, generateRemedyShort,
} from '../src/synthesis/reading.js';
import { computeChart } from '../src/chart/chart.js';
import { computeReadingInput } from '../src/engine.js';
import { buildRetrospective } from '../src/synthesis/retrospective.js';
import { answerMentorQuery } from '../src/mentor/query.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import type { BirthData, LifeArea } from '../src/types.js';

// Astrology terms that must NEVER reach a user-facing string (SPEC §1, §12).
const FORBIDDEN: RegExp[] = [
  /\b(mars|mercury|jupiter|venus|saturn|rahu|ketu)\b/i,
  /\b(the moon|the sun)\b/i, // "sunlight"/"morning" are fine; the celestial bodies are not
  /\b(aries|taurus|gemini|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i,
  /\b(graha|dasha|dasa|mahadasha|antardasha|nakshatra|pada|lagna|rashi|bhava|gochara|vimshottari|ayanamsa|drishti|kendra|trikona|dusthana)\b/i,
  /\b(sidereal|ascendant|retrograde|combust|exalted|debilitat|zodiac|horoscope|natal chart|jyotish)\b/i,
];

function scan(label: string, text: string, offenders: string[]) {
  for (const re of FORBIDDEN) {
    const m = text.match(re);
    if (m) offenders.push(`${label}: "${m[0]}" in → ${text}`);
  }
}

describe('no-jargon lint (SPEC §12)', () => {
  it('the template bank contains no astrology jargon', () => {
    const offenders: string[] = [];
    for (const e of ENERGIES) {
      const c = CONTENT[e];
      const groups: [string, string[]][] = [
        ['headlines', c.headlines], ['gift', c.gift], ['trap', c.trap],
        ['move', c.move], ['watch', c.watch], ['remedies', c.remedies],
        ['remedyShort', c.remedyShort],
      ];
      for (const [k, arr] of groups) arr.forEach((s) => scan(`${e}.${k}`, s, offenders));
      for (const [area, arr] of Object.entries(c.moveByArea ?? {})) {
        (arr as string[]).forEach((s) => scan(`${e}.moveByArea.${area}`, s, offenders));
      }
    }
    for (const e of ENERGIES) {
      scan(`meta.${e}.label`, ENERGY_META[e].label, offenders);
      scan(`meta.${e}.gloss`, ENERGY_META[e].gloss, offenders);
      scan(`forecastGloss.${e}`, FORECAST_GLOSS[e], offenders);
      scan(`blueprintDesc.${e}`, BLUEPRINT_DESC[e], offenders);
    }
    for (const a of Object.values(AREA_META)) {
      scan(`area.${a.area}.label`, a.label, offenders);
      scan(`area.${a.area}.gloss`, a.gloss, offenders);
    }
    expect(offenders).toEqual([]);
  });

  it('generated readings (daily, expanded, blueprint) contain no jargon', () => {
    const ephem = new AstronomiaEphemeris();
    const birth: BirthData = {
      date: '1985-11-02', time: '14:20', unknownTime: false,
      place: 'Delhi', lat: 28.6, lng: 77.2, tzOffsetMinutes: 330,
    };
    const chart = computeChart(birth, ephem);
    const offenders: string[] = [];

    // Scan a week of daily readings (varies via transit).
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.UTC(2026, 6, 21 + d));
      const input = computeReadingInput(chart, date, ephem, { goalArea: 'career' });
      const r = generateReading(input, date.toISOString().slice(0, 10), chart.lagnaLong);
      for (const [k, v] of Object.entries(r)) {
        if (typeof v === 'string') scan(`reading.${k}`, v, offenders);
      }
      scan('todayLine', generateTodayLine(input, date.toISOString().slice(0, 10), chart.lagnaLong), offenders);
      scan('remedyShort', generateRemedyShort(input, date.toISOString().slice(0, 10), chart.lagnaLong), offenders);
    }

    // Expanded readings for every energy.
    for (const e of ENERGIES) {
      const r = generateExpandedReading(e, 'build', '2026-08-01', '2026-10-01', chart.lagnaLong);
      for (const [k, v] of Object.entries(r)) {
        if (typeof v === 'string') scan(`expanded.${e}.${k}`, v, offenders);
      }
    }

    // Blueprint rows.
    for (const row of buildBlueprint(chart)) {
      scan(`blueprint.${row.role}`, row.desc, offenders);
    }
    // Forecast glosses.
    const fc = buildForecast(chart, new Date('2026-07-21T00:00:00Z'));
    for (const p of [...fc.daily, ...fc.weekly, ...fc.monthly]) scan('forecast.gloss', p.gloss, offenders);

    // Retrospective statements + Cosmic Mentor answers (pivot features).
    const nowD = new Date('2026-07-21T00:00:00Z');
    const areas: LifeArea[] = ['partnership', 'career', 'money', 'self'];
    for (const focusArea of areas) {
      for (const r of buildRetrospective(chart, nowD, ephem, { focusArea })) {
        scan('retro.statement', r.statement, offenders);
      }
      for (const tf of ['past', 'now', 'future'] as const) {
        const a = answerMentorQuery(chart, { focus: focusArea, timeframe: tf }, nowD, ephem);
        scan('mentor.focusPhrase', a.focusPhrase, offenders);
        scan('mentor.keyEnergyMeaning', a.keyEnergyMeaning, offenders);
        scan('mentor.strength.name', a.strength.name, offenders);
        scan('mentor.strength.note', a.strength.note, offenders);
        if (a.transitNote) scan('mentor.transitNote', a.transitNote, offenders);
      }
    }

    expect(offenders).toEqual([]);
  });
});
