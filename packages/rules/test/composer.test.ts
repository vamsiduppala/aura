// The Plan Composer (§4.5). What these tests defend is not the numbers — an astrologer will
// revise those — but the MECHANISM: that scoring is deterministic, that it actually depends on
// the parent and the chart, that thresholds partition cleanly, and that no astrology has crept
// out of rules.json and into the code.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { AstronomiaEphemeris, computeChart, type BirthData, type Graha } from '@aura/engine';
import {
  ARCHETYPES, CATEGORIES, RULES_VERSION, archetypeMeta, relationClass, scoreStage,
  type Archetype,
} from '../src/index.js';

const PLANETS: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

// A real chart, so the house term is exercised against real placements.
const BIRTH: BirthData = {
  date: '1997-04-11', time: '20:55', unknownTime: false,
  place: 'Visakhapatnam, Andhra Pradesh, India',
  lat: 17.68009, lng: 83.20161, tzOffsetMinutes: 330,
};
const chart = computeChart(BIRTH, new AstronomiaEphemeris());

describe('the data/code seam', () => {
  it('no planet name and no score appears in the composer source', () => {
    // §4.5: "engineers do not encode astrology in code". If this fails, a judgement has
    // leaked out of rules.json, and an astrologer can no longer change it without a deploy.
    const src = readFileSync(new URL('../src/composer.ts', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const planet of PLANETS) {
      // `planet` as a variable name is fine; a planet's NAME as a literal is not.
      expect(new RegExp(`['"\`]${planet}['"\`]`, 'i').test(src), planet).toBe(false);
    }
  });

  it('every category has a score for every planet', () => {
    for (const category of CATEGORIES) {
      for (const planet of PLANETS) {
        const { suitability } = scoreStage({ category, planet });
        expect(Number.isInteger(suitability), `${category}/${planet}`).toBe(true);
        expect(Math.abs(suitability)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('an unknown category falls back to neutral rather than throwing', () => {
    // A category added to the UI before the tables catch up must degrade, not crash.
    const s = scoreStage({ category: 'time-travel', planet: 'mars' });
    expect(s.suitability).toBe(0);
    expect(s.archetype).toBe('build');
  });

  it('carries the rulesVersion, so an old plan stays explainable', () => {
    expect(RULES_VERSION).toBeGreaterThanOrEqual(1);
    expect(scoreStage({ category: 'job', planet: 'mars' }).rulesVersion).toBe(RULES_VERSION);
  });
});

describe('archetypes partition the score line', () => {
  it('thresholds are ordered and leave no gap', () => {
    expect(ARCHETYPES.push.minScore).toBeGreaterThan(ARCHETYPES.build.minScore);
    expect(ARCHETYPES.build.minScore).toBeGreaterThan(ARCHETYPES.hold.minScore);
  });

  it('every reachable score maps to exactly one archetype', () => {
    // Range is suitability(-2..2) + relation(-1..1) + house(-1..1) = -4..4.
    for (let score = -4; score <= 4; score++) {
      const matches = (['push', 'build', 'hold'] as Archetype[])
        .filter((a) => score >= ARCHETYPES[a].minScore);
      expect(matches.length, `score ${score}`).toBeGreaterThan(0);
      // The strongest match is the one the composer picks, and it must be deterministic.
      expect(matches[0]).toBe(score >= 2 ? 'push' : score >= 0 ? 'build' : 'hold');
    }
  });

  it('BUILD exists as a real middle, not a rounding of PUSH or HOLD', () => {
    // Collapsing three states into two is what makes a plan read like a horoscope.
    expect(scoreStage({ category: 'other', planet: 'sun' }).archetype).toBe('build');
    expect(archetypeMeta('build').label).toBe('BUILD');
    expect(archetypeMeta('build').gloss).not.toBe(archetypeMeta('push').gloss);
  });

  it('all three archetypes are actually reachable across real inputs', () => {
    const seen = new Set<Archetype>();
    for (const category of CATEGORIES) {
      for (const planet of PLANETS) {
        for (const parentPlanet of PLANETS) {
          seen.add(scoreStage({ category, planet, parentPlanet, chart }).archetype);
        }
      }
    }
    expect([...seen].sort()).toEqual(['build', 'hold', 'push']);
  });
});

describe('the parent period changes the reading', () => {
  it('the same planet in the same category can differ by parent', () => {
    // This is the point of the composer. A lookup on the planet alone cannot do it.
    const results = PLANETS.map((parentPlanet) =>
      scoreStage({ category: 'job', planet: 'mars', parentPlanet }).score);
    expect(new Set(results).size).toBeGreaterThan(1);
  });

  it('a friendly parent scores higher than a hostile one, all else equal', () => {
    // Sun regards Mars as a friend; Mars regards Mercury as an enemy.
    const friend = scoreStage({ category: 'job', planet: 'mars', parentPlanet: 'sun' });
    const enemy = scoreStage({ category: 'job', planet: 'mercury', parentPlanet: 'mars' });
    expect(friend.relationClass).toBe('friend');
    expect(enemy.relationClass).toBe('enemy');
    expect(friend.relation).toBeGreaterThan(enemy.relation);
  });

  it('the relation is read PARENT → CHILD, and the classical table is asymmetric', () => {
    // This caught a wrong test assumption and is worth pinning: naturalRelation is NOT
    // symmetric. Mars regards Mercury as an enemy; Mercury regards Mars as merely neutral.
    expect(relationClass('mars', 'mercury')).toBe('enemy');
    expect(relationClass('mercury', 'mars')).toBe('neutral');

    // So the direction we choose is a judgement, not a detail. We ask how the RULER regards
    // the sub-ruler serving under it — the parent's disposition toward the child — because
    // that is the question a sub-period poses. Reversing it would silently flip readings.
    const asRuler = scoreStage({ category: 'job', planet: 'mercury', parentPlanet: 'mars' });
    const reversed = scoreStage({ category: 'job', planet: 'mars', parentPlanet: 'mercury' });
    expect(asRuler.relation).toBe(-1);
    expect(reversed.relation).toBe(0);
  });

  it('a planet is never at odds with itself', () => {
    for (const planet of PLANETS) {
      expect(relationClass(planet, planet), planet).toBe('friend');
    }
  });

  it('Rāhu and Ketu resolve to neutral rather than an invented relation', () => {
    // They are absent from the classical natural-relations table. Silence beats fabrication.
    for (const other of PLANETS) {
      if (other === 'rahu' || other === 'ketu') continue;
      expect(relationClass('rahu', other)).toBe('neutral');
      expect(relationClass(other, 'ketu')).toBe('neutral');
    }
  });

  it('with no parent, the relation term contributes nothing', () => {
    const s = scoreStage({ category: 'job', planet: 'mars' });
    expect(s.relation).toBe(0);
    expect(s.relationClass).toBeNull();
  });
});

describe('the chart changes the reading', () => {
  it('supplying a chart can move the score, and never by more than ±1', () => {
    let moved = 0;
    for (const category of CATEGORIES) {
      for (const planet of PLANETS) {
        const without = scoreStage({ category, planet });
        const with_ = scoreStage({ category, planet, chart });
        expect(Math.abs(with_.house)).toBeLessThanOrEqual(1);
        expect(with_.score - without.score).toBe(with_.house);
        if (with_.house !== 0) moved++;
      }
    }
    // Two people with the same Mars Governor should be able to get different advice.
    expect(moved).toBeGreaterThan(0);
  });

  it('without a chart the house term is skipped, never guessed', () => {
    const s = scoreStage({ category: 'job', planet: 'mars' });
    expect(s.house).toBe(0);
    expect(s.houseSignificator).toBeNull();
  });

  it('names the bhava the category was read from', () => {
    // job/promotion → 10th, love → 7th, money → 2nd. Classical, and stated so it is checkable.
    expect(scoreStage({ category: 'job', planet: 'sun', chart }).houseSignificator).toBe(10);
    expect(scoreStage({ category: 'love', planet: 'venus', chart }).houseSignificator).toBe(7);
    expect(scoreStage({ category: 'money', planet: 'saturn', chart }).houseSignificator).toBe(2);
  });
});

describe('determinism and disclosure', () => {
  it('same inputs, same output, every time', () => {
    for (const category of CATEGORIES) {
      for (const planet of PLANETS) {
        const a = scoreStage({ category, planet, parentPlanet: 'venus', chart });
        const b = scoreStage({ category, planet, parentPlanet: 'venus', chart });
        expect(a).toEqual(b);
      }
    }
  });

  it('the score always equals the sum of its stated parts', () => {
    // The breakdown is shown to the user and used by the chart debugger (M15). If it did not
    // add up, both would be lying.
    for (const category of CATEGORIES) {
      for (const planet of PLANETS) {
        const s = scoreStage({ category, planet, parentPlanet: 'saturn', chart });
        expect(s.score).toBe(s.suitability + s.relation + s.house);
      }
    }
  });

  it('gives a plain-language reason for every term it applied', () => {
    const s = scoreStage({ category: 'job', planet: 'mars', parentPlanet: 'mercury', chart });
    // suitability +2, relation -1 (enemy) — both non-zero, so both must be explained.
    expect(s.because.length).toBeGreaterThanOrEqual(2);
    for (const line of s.because) expect(line.length).toBeGreaterThan(10);
  });

  it('says nothing about terms that contributed nothing', () => {
    const s = scoreStage({ category: 'other', planet: 'sun' });
    expect(s.because).toEqual([]);
  });
});
