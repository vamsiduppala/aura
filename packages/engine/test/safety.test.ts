import { describe, it, expect } from 'vitest';
import { detectCrisis, checkNoDoom } from '../src/safety/guardrails.js';
import { CONTENT } from '../src/content/templates.js';
import { ENERGIES } from '../src/constants.js';
import { FORECAST_GLOSS } from '../src/synthesis/forecast.js';
import { BLUEPRINT_DESC } from '../src/synthesis/blueprint.js';
import { generateReading, generateExpandedReading } from '../src/synthesis/reading.js';
import { computeChart } from '../src/chart/chart.js';
import { computeReadingInput } from '../src/engine.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import type { BirthData } from '../src/types.js';

describe('crisis detection (SPEC §11.3)', () => {
  it('flags clear crisis signals', () => {
    for (const t of [
      'i want to kill myself',
      'thinking about ending my life',
      'I don’t want to live anymore',
      'i keep wanting to hurt myself',
      'suicidal thoughts again',
      'no reason to go on',
    ]) expect(detectCrisis(t)).toBe(true);
  });

  it('does not flag ordinary goal text', () => {
    for (const t of [
      'Kai’s studio', 'build my business empire', 'get fit and strong',
      'find love', 'kill it at work this quarter', 'dying to travel more', '', undefined,
    ]) expect(detectCrisis(t)).toBe(false);
  });
});

describe('no-doom content guard (SPEC §11.2)', () => {
  it('the whole template bank is doom-free', () => {
    const offenders: string[] = [];
    for (const e of ENERGIES) {
      const c = CONTENT[e];
      const all = [
        ...c.headlines, ...c.gift, ...c.trap, ...c.move, ...c.watch,
        ...c.remedies, ...c.remedyShort,
        ...Object.values(c.moveByArea ?? {}).flat(),
      ];
      for (const s of all) {
        const chk = checkNoDoom(s);
        if (!chk.ok) offenders.push(`${e}: ${chk.matches.join(',')} in "${s}"`);
      }
      const chkG = checkNoDoom(FORECAST_GLOSS[e]);
      if (!chkG.ok) offenders.push(`forecastGloss.${e}: ${chkG.matches.join(',')}`);
      const chkB = checkNoDoom(BLUEPRINT_DESC[e]);
      if (!chkB.ok) offenders.push(`blueprintDesc.${e}: ${chkB.matches.join(',')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('generated readings across many charts/days are doom-free', () => {
    const ephem = new AstronomiaEphemeris();
    const births: BirthData[] = [
      { date: '1988-02-29', time: '23:10', unknownTime: false, place: 'A', lat: 40, lng: -73, tzOffsetMinutes: -300 },
      { date: '1975-07-04', time: '05:00', unknownTime: false, place: 'B', lat: 19, lng: 72, tzOffsetMinutes: 330 },
      { date: '2003-12-12', time: '16:45', unknownTime: false, place: 'C', lat: -33, lng: 151, tzOffsetMinutes: 600 },
    ];
    const offenders: string[] = [];
    for (const b of births) {
      const chart = computeChart(b, ephem);
      for (let d = 0; d < 10; d++) {
        const date = new Date(Date.UTC(2026, d, 3 + d));
        const input = computeReadingInput(chart, date, ephem, { goalArea: 'self' });
        const r = generateReading(input, date.toISOString().slice(0, 10), chart.lagnaLong);
        for (const v of Object.values(r)) {
          if (typeof v === 'string' && !checkNoDoom(v).ok) offenders.push(v);
        }
      }
      for (const e of ENERGIES) {
        const r = generateExpandedReading(e, 'build', '2026-08-01', '2026-10-01', chart.lagnaLong);
        for (const v of Object.values(r)) {
          if (typeof v === 'string' && !checkNoDoom(v).ok) offenders.push(v);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
