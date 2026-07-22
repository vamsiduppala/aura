import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris, type BirthData } from '@aura/engine';
import { lookupAstrology, lookupAstrologyLive } from './knowledge';

// The knowledge backend the Cosmic Mentor's second tool (lookup_astrology) calls. Pure +
// deterministic, so we test it directly without the LLM.
const aura = new Aura(new AstronomiaEphemeris());
const birth: BirthData = {
  date: '1990-05-20', time: '08:30', unknownTime: false,
  place: 'Delhi', lat: 28.6, lng: 77.2, tzOffsetMinutes: 330,
};
const chart = aura.chart(birth);
const SIGNS = /Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/;

describe('lookupAstrology — mentor knowledge backend', () => {
  it('returns grounded concept facts for a plain term (no chart when no area)', () => {
    const r = lookupAstrology('courage', chart);
    expect(r.concepts.length).toBeGreaterThan(0);
    expect(r.concepts[0]!.summary.length).toBeGreaterThan(0);
    expect(r.chart).toBeUndefined();
  });

  it('explains the user’s real chart for a life area with named planets + real meanings', () => {
    const r = lookupAstrology('why do I get so guarded in love?', chart, 'partnership');
    expect(r.chart).toBeDefined();
    expect(r.chart!.lagnaSign).toMatch(SIGNS);
    expect(r.chart!.lagnaLord.length).toBeGreaterThan(1);
    // the area's ruler is always included, so there is at least one placement
    expect(r.chart!.placements.length).toBeGreaterThan(0);
    for (const p of r.chart!.placements) {
      expect(p.planet.length).toBeGreaterThan(1);
      expect(p.sign).toMatch(SIGNS);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
      expect(p.meaning.length).toBeGreaterThan(40);
    }
  });

  it('lookupAstrologyLive falls back to the bundled result when the API is unreachable', async () => {
    const live = await lookupAstrologyLive('courage', chart);
    const local = lookupAstrology('courage', chart);
    expect(live.concepts.length).toBe(local.concepts.length);
    expect(live.concepts[0]?.label).toBe(local.concepts[0]?.label);
  });
});
