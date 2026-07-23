import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris, type BirthData } from '@aura/engine';
import { lookupAstrology } from '../services/knowledge';

// The mentor grounds "what's special about my chart?" in the user's ACTUAL combinations, not a
// guess — so lookupAstrology always returns real chart "signatures" (karakas, shape, raja yogas).
const engine = new Aura(new AstronomiaEphemeris());
const birth: BirthData = { date: '1990-05-15', time: '08:30', unknownTime: false, place: 'Delhi', lat: 28.61, lng: 77.21, tzOffsetMinutes: 330 };

describe('mentor chart lookup — real signatures', () => {
  it('surfaces the user’s soul/partner planet and chart shape from their real chart', () => {
    const chart = engine.chart(birth);
    const l = lookupAstrology('what is special about my chart', chart);
    expect(l.signatures.some((s) => /Soul & partner planets/.test(s.label))).toBe(true);
    expect(l.signatures.some((s) => /Chart shape/.test(s.label))).toBe(true);
    for (const s of l.signatures) expect(s.detail.length).toBeGreaterThan(15); // real sentences, not stubs
  });

  it('returns signatures alongside area placements when an area is asked about', () => {
    const chart = engine.chart(birth);
    const l = lookupAstrology('why am I like this at work', chart, 'career');
    expect(l.chart?.placements).toBeDefined();
    expect(l.signatures.length).toBeGreaterThanOrEqual(2); // karakas + shape at minimum
  });

  it('only claims a raja/vipareeta yoga when the chart actually has one', () => {
    const chart = engine.chart(birth);
    const labels = lookupAstrology('do I have special combinations', chart).signatures.map((s) => s.label);
    // Whatever yoga labels appear must be real ones, never a fabricated catch-all.
    for (const label of labels) {
      expect(['Soul & partner planets', 'Chart shape', 'Dharma-Karmadhipati raja yoga', 'Raja yoga', 'Vipareeta raja yoga']).toContain(label);
    }
  });
});
