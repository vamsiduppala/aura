import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris } from '../src/index.js';
import type { BirthData } from '../src/types.js';

// Structural regression locks (SPEC §12 "snapshot tests for synthesis given fixed input").
// We snapshot the deterministic STRUCTURE — the derived energies/areas/sequence — not the
// prose, so content edits don't churn these while logic regressions are caught.
const aura = new Aura(new AstronomiaEphemeris());
const now = new Date('2026-07-21T00:00:00Z');

const REF: Record<string, BirthData> = {
  einstein: { date: '1879-03-14', time: '11:30', unknownTime: false, place: 'Ulm', lat: 48.4, lng: 10, tzOffsetMinutes: 40 },
  kai: { date: '2001-03-14', time: '09:42', unknownTime: false, place: 'Jaipur', lat: 26.92, lng: 75.82, tzOffsetMinutes: 330 },
};

function structure(birth: BirthData) {
  const chart = aura.chart(birth);
  const input = aura.daily(chart, now, { goalArea: 'career' }).input;
  const fc = aura.forecast(chart, now);
  return {
    major: input.majorEnergy,
    passing: input.passingEnergy,
    dominantAreas: input.dominantAreas,
    season: fc.majorSeason.energy,
    nextSeason: fc.majorSeason.nextEnergy,
    monthlySequence: fc.monthly.map((p) => p.energy),
    yogaKeys: aura.yogas(chart).map((y) => y.key),
    blueprintEnergies: aura.blueprint(chart).map((r) => r.energy),
  };
}

describe('synthesis structural snapshots (regression locks)', () => {
  it('Einstein — derived structure is stable', () => {
    expect(structure(REF.einstein!)).toMatchInlineSnapshot(`
      {
        "blueprintEnergies": [
          "mind",
          "fire",
          "grow",
          "build",
        ],
        "dominantAreas": [
          "career",
          "home",
          "luck",
        ],
        "major": "love",
        "monthlySequence": [
          "build",
          "mind",
          "let",
          "love",
        ],
        "nextSeason": "main",
        "passing": "grow",
        "season": "love",
        "yogaKeys": [
          "malavya",
          "gajakesari",
          "budhaditya",
          "raja",
        ],
      }
    `);
  });
  it('Kai — derived structure is stable', () => {
    expect(structure(REF.kai!)).toMatchInlineSnapshot(`
      {
        "blueprintEnergies": [
          "fire",
          "grow",
          "love",
          "build",
        ],
        "dominantAreas": [
          "gains",
          "health",
          "transformation",
        ],
        "major": "mind",
        "monthlySequence": [
          "love",
          "main",
          "feel",
          "fire",
          "crave",
        ],
        "nextSeason": "let",
        "passing": "love",
        "season": "mind",
        "yogaKeys": [
          "budhaditya",
          "raja",
          "dhana",
        ],
      }
    `);
  });
});
