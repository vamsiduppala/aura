import { describe, it, expect } from 'vitest';
import { answerMentorQuery } from '../src/mentor/query.js';
import { MENTOR_TOOL_SCHEMA, MENTOR_SYSTEM_PROMPT } from '../src/mentor/prompt.js';
import { computeChart } from '../src/chart/chart.js';
import { AstronomiaEphemeris } from '../src/astro/ephemeris.js';
import { checkNoDoom } from '../src/safety/guardrails.js';
import type { BirthData, LifeArea } from '../src/types.js';
import type { Timeframe } from '../src/mentor/query.js';

const ephem = new AstronomiaEphemeris();
const chart = computeChart(
  { date: '1988-05-19', time: '21:05', unknownTime: false, place: 'X', lat: 40, lng: -74, tzOffsetMinutes: -240 },
  ephem,
);
const now = new Date('2026-07-21T00:00:00Z');

describe('Cosmic Mentor engine query', () => {
  it('returns real, doom-free engine data for every focus × timeframe', () => {
    const areas: LifeArea[] = ['partnership', 'career', 'money', 'self'];
    const times: Timeframe[] = ['past', 'now', 'future'];
    for (const focus of areas) {
      for (const timeframe of times) {
        const a = answerMentorQuery(chart, { focus, timeframe }, now, ephem);
        expect(a.timeframe).toBe(timeframe);
        expect(a.keyEnergy.length).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(a.focusAreaHeat);
        expect(a.gift.length).toBeGreaterThan(10);
        expect(a.trap.length).toBeGreaterThan(10);
        expect(a.remedy.length).toBeGreaterThan(10);
        // the approved copy the LLM narrates must be doom-free
        expect(checkNoDoom(a.gift).ok && checkNoDoom(a.trap).ok && checkNoDoom(a.remedy).ok).toBe(true);
      }
    }
  });

  it('past/future answers carry a period; now carries none', () => {
    expect(answerMentorQuery(chart, { focus: 'career', timeframe: 'past' }, now, ephem).period).toBeDefined();
    expect(answerMentorQuery(chart, { focus: 'career', timeframe: 'future' }, now, ephem).period).toBeDefined();
    expect(answerMentorQuery(chart, { focus: 'career', timeframe: 'now' }, now, ephem).period).toBeUndefined();
  });

  it('the guardrail prompt + tool schema are well-formed', () => {
    expect(MENTOR_SYSTEM_PROMPT).toMatch(/query_energy/);
    expect(MENTOR_SYSTEM_PROMPT.toLowerCase()).toMatch(/never/);
    expect(MENTOR_TOOL_SCHEMA.name).toBe('query_energy');
    expect(MENTOR_TOOL_SCHEMA.parameters.required).toEqual(['focus', 'timeframe']);
    expect(MENTOR_TOOL_SCHEMA.parameters.properties.focus.enum).toContain('partnership');
  });
});
