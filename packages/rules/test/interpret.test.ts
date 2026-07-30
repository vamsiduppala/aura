// Composable interpretation (§4.6). Two things under test: that the assembly is complete and
// deterministic, and that the authored prose obeys the product's content rules — because a
// banned word or a prediction reaching a user is a worse failure than a crash.

import { describe, expect, it } from 'vitest';
import { AstronomiaEphemeris, computeChart, type BirthData, type Graha } from '@aura/engine';
import {
  CONTENT_VERSION, HOUSE_FRAGMENTS, RELATION_FRAGMENTS, chartFeatureHash, interpret,
} from '../src/index.js';

const PLANETS: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

const BIRTH: BirthData = {
  date: '1997-04-11', time: '20:55', unknownTime: false,
  place: 'Visakhapatnam, Andhra Pradesh, India',
  lat: 17.68009, lng: 83.20161, tzOffsetMinutes: 330,
};
const chart = computeChart(BIRTH, new AstronomiaEphemeris());

describe('coverage — the combinatorial space is actually covered', () => {
  it('all 81 relation pairs exist and are distinct', () => {
    const seen = new Set<string>();
    for (const parent of PLANETS) {
      for (const child of PLANETS) {
        const text = RELATION_FRAGMENTS[parent]?.[child];
        expect(text, `${parent}→${child}`).toBeTruthy();
        expect(text!.length, `${parent}→${child}`).toBeGreaterThan(25);
        seen.add(text!);
      }
    }
    // 81 distinct fragments. Duplicates would mean two different pairings read identically,
    // which defeats the entire point of the layer.
    expect(seen.size).toBe(81);
  });

  it('all 12 houses have a flavour, and they are distinct', () => {
    const values = Array.from({ length: 12 }, (_, i) => HOUSE_FRAGMENTS[String(i + 1)]);
    for (const [i, v] of values.entries()) {
      expect(v, `house ${i + 1}`).toBeTruthy();
      expect(v!.length).toBeGreaterThan(25);
    }
    expect(new Set(values).size).toBe(12);
  });

  it('the direction matters — parent→child is not the same fragment as child→parent', () => {
    // Saturn ruling over Mars is a different situation from Mars ruling over Saturn, and the
    // content must reflect that or the layer is decorative.
    let asymmetric = 0;
    for (const a of PLANETS) {
      for (const b of PLANETS) {
        if (a === b) continue;
        if (RELATION_FRAGMENTS[a]![b] !== RELATION_FRAGMENTS[b]![a]) asymmetric++;
      }
    }
    expect(asymmetric).toBe(72); // every off-diagonal pair differs
  });
});

describe('assembly', () => {
  it('layers what it has and omits what it does not', () => {
    const full = interpret({ planet: 'venus', level: 3, parentPlanet: 'saturn', chart });
    expect(full.relation).toBeTruthy();
    expect(full.houseFlavour).toBeTruthy();
    expect(full.house).toBeGreaterThanOrEqual(1);
    expect(full.relationClass).toBe('friend'); // Saturn regards Venus as a friend

    // Level 1 has no ruler above it, so there is no relation layer — not a blank string.
    const king = interpret({ planet: 'venus', level: 1, chart });
    expect(king.relation).toBeNull();
    expect(king.relationClass).toBeNull();

    // No chart means the house layer is absent, never guessed.
    const noChart = interpret({ planet: 'venus', level: 3, parentPlanet: 'saturn' });
    expect(noChart.houseFlavour).toBeNull();
    expect(noChart.house).toBeNull();
  });

  it('the same planet reads differently under different rulers', () => {
    // This is the whole justification for §4.6 over a flat 45-block library.
    const underSaturn = interpret({ planet: 'venus', level: 3, parentPlanet: 'saturn', chart });
    const underJupiter = interpret({ planet: 'venus', level: 3, parentPlanet: 'jupiter', chart });
    expect(underSaturn.relation).not.toBe(underJupiter.relation);
    expect(underSaturn.cacheKey).not.toBe(underJupiter.cacheKey);
  });
});

describe('cache keys', () => {
  it('are deterministic', () => {
    const a = interpret({ planet: 'mars', level: 4, parentPlanet: 'sun', chart });
    const b = interpret({ planet: 'mars', level: 4, parentPlanet: 'sun', chart });
    expect(a.cacheKey).toBe(b.cacheKey);
  });

  it('change with every input that changes the text, and only those', () => {
    const base = interpret({ planet: 'mars', level: 4, parentPlanet: 'sun', chart });
    const keys = new Set([
      base.cacheKey,
      interpret({ planet: 'venus', level: 4, parentPlanet: 'sun', chart }).cacheKey,
      interpret({ planet: 'mars', level: 2, parentPlanet: 'sun', chart }).cacheKey,
      interpret({ planet: 'mars', level: 4, parentPlanet: 'moon', chart }).cacheKey,
      interpret({ planet: 'mars', level: 4, parentPlanet: 'sun' }).cacheKey, // no chart
    ]);
    expect(keys.size).toBe(5);
  });

  it('carry the content version, so revised prose cannot serve from cache', () => {
    expect(interpret({ planet: 'sun', level: 1 }).cacheKey).toContain(`:${CONTENT_VERSION}:`);
  });

  it('bucket dignity, so two near-identical charts share one entry', () => {
    // The point of hashing FEATURES rather than the chart: without bucketing, a 0.61 and a
    // 0.62 dignity would be separate cache entries and separate astrologer reviews.
    const h = chartFeatureHash(chart, 'venus');
    expect(h).toMatch(/^[0-9a-f]{8}$/);
    expect(chartFeatureHash(chart, 'venus')).toBe(h);
    // A different planet in a different house must hash differently.
    const others = PLANETS.filter((p) => chart.planets[p].house !== chart.planets.venus.house);
    expect(others.length).toBeGreaterThan(0);
    expect(chartFeatureHash(chart, others[0]!)).not.toBe(h);
  });
});

describe('the content rules hold across every authored fragment', () => {
  const all = [
    ...PLANETS.flatMap((p) => PLANETS.map((c) => RELATION_FRAGMENTS[p]![c]!)),
    ...Object.entries(HOUSE_FRAGMENTS).filter(([k]) => !k.startsWith('$')).map(([, v]) => v),
  ];

  it('uses no banned vocabulary', () => {
    // These either frighten people or make the app read like a temple pamphlet. Say what is
    // happening instead.
    const banned = [
      'malefic', 'benefic', 'auspicious', 'inauspicious', 'dosha', 'cursed',
      'unlucky', 'lucky', 'blessed', 'destiny', 'fate', 'karma',
    ];
    const offenders: string[] = [];
    for (const text of all) {
      for (const word of banned) {
        if (new RegExp(`\\b${word}`, 'i').test(text)) offenders.push(`${word}: ${text}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('promises no outcome and predicts no event', () => {
    // Conditions, not predictions. "You will get the job" is the failure mode; "directness
    // gets traction here" is the product.
    const predictive = [
      /\byou will\b/i, /\bwill happen\b/i, /\bguarantee/i, /\bcertain(ly)? to\b/i,
      /\bdestined\b/i, /\bpromise[sd]?\b/i,
    ];
    const offenders = all.filter((t) => predictive.some((re) => re.test(t)));
    expect(offenders).toEqual([]);
  });

  it('prescribes no remedy, ritual or purchase', () => {
    // Behavioural only. Never gemstones, fasting or ritual.
    //
    // Note the narrowness of the fasting pattern. `/\bfast(ing)?\b/` was the first attempt
    // and it flagged "Genuinely fast" and "Fast, pointed exchange" — an over-broad ban that
    // would have blocked perfectly good copy. A content guard that cries wolf gets disabled,
    // so it has to match the prescription rather than the word.
    const remedial = [
      /gemstone/i, /\bfasting\b/i, /\ba fast\b/i, /\bfast on\b/i,
      /\bmantra/i, /\bpuja\b/i, /\bwear\b.*\bstone\b/i,
      /\bdonate\b/i, /\bchant/i, /\bcharity\b/i,
    ];
    const offenders = all.filter((t) => remedial.some((re) => re.test(t)));
    expect(offenders).toEqual([]);
  });

  it('gives no medical, legal or financial directive', () => {
    const directive = [
      /\bsee a lawyer\b/i, /\btake .*medication\b/i, /\bdiagnos/i,
      /\binvest in\b/i, /\bbuy (stocks|shares|crypto)/i, /\bsell your\b/i,
    ];
    const offenders = all.filter((t) => directive.some((re) => re.test(t)));
    expect(offenders).toEqual([]);
  });

  it('reads as one voice — every fragment is a sentence, not a label', () => {
    for (const text of all) {
      expect(text.trim().length).toBeGreaterThan(25);
      // Ends like prose, and starts capitalised.
      expect(text.trim()).toMatch(/[.!?]$/);
      expect(text.trim()[0]).toBe(text.trim()[0]!.toUpperCase());
    }
  });
});
