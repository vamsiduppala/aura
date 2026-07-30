// The Plan Composer (new-structure.md §4.5) — deterministic, scored, versioned.
//
// THE SEAM THIS FILE DEFENDS: everything here is mechanism. Every astrological judgement
// lives in rules.json as data. If you find yourself adding a planet name or a number to this
// file, it belongs in the JSON instead — that is what makes the tables editable by an
// astrologer without a deploy (§4.5, M4, M15).
//
//   score = suitability[category][planet]
//         + relationModifier[relationClass(parentPlanet, planet)]
//         + houseModifier(chart, planet, category)
//   archetype = PUSH | BUILD | HOLD, by threshold
//
// Three consequences worth naming, because they are the reason this replaced a lookup on the
// planet alone:
//   · The archetype depends on the PARENT period, so the same Mars Governor reads differently
//     inside a Sun term than inside a Saturn one.
//   · It depends on the CHART, so two people in the same Mars Governor can get different
//     advice — which is the difference between a plan and a horoscope.
//   · It is reproducible. Same chart, same category, same rulesVersion → same plan, forever.

import { naturalRelation } from '@aura/knowledge';
import type { Chart, Graha } from '@aura/engine';
import rulesFile from '../rules.json' with { type: 'json' };

export type Archetype = 'push' | 'build' | 'hold';
export type RelationClass = 'friend' | 'neutral' | 'enemy';

interface RulesFile {
  $meta: { rulesVersion: number };
  categories: string[];
  suitability: Record<string, Record<Graha, number>>;
  relationModifier: Record<string, number>;
  houseSignificators: Record<string, number>;
  archetypes: Record<Archetype, { minScore: number; label: string; verb: string; gloss: string }>;
}

const RULES = rulesFile as unknown as RulesFile;

/** Persisted on every plan beside `engineVersion`, so old plans stay explainable. */
export const RULES_VERSION: number = RULES.$meta.rulesVersion;

export const CATEGORIES: readonly string[] = RULES.categories;
export const ARCHETYPES = RULES.archetypes;

/** Ordered strongest-first, so the first matching threshold wins. */
const ARCHETYPE_ORDER: Archetype[] = ['push', 'build', 'hold'];

export interface ScoreInput {
  category: string;
  /** The planet ruling the stage being scored. */
  planet: Graha;
  /** The planet ruling the period this stage sits inside. Absent at the top level. */
  parentPlanet?: Graha | undefined;
  /** Optional. Without it the house term is simply not applied — never guessed. */
  chart?: Chart | undefined;
  /**
   * How to render a planet's name in the `because` lines. Supplied by the caller because
   * this package holds astrological JUDGEMENT, not presentation — it should not decide that
   * `'sun'` is displayed as "Sun", and under localisation it certainly should not.
   */
  nameOf?: ((planet: Graha) => string) | undefined;
}

export interface ScoreBreakdown {
  /** Sum of the parts below. */
  score: number;
  archetype: Archetype;
  suitability: number;
  relation: number;
  relationClass: RelationClass | null;
  house: number;
  /** Which bhava the category was read from, if a chart was supplied. */
  houseSignificator: number | null;
  rulesVersion: number;
  /** Plain-language reasons, in the order they were applied. For the "why this stage"
   *  disclosure and for debugging a plan that reads wrong (M15's chart debugger). */
  because: string[];
}

/**
 * How the ruler sits with the ruler above it.
 *
 * **The classical table is ASYMMETRIC and the direction is a judgement, not a detail.** Mars
 * regards Mercury as an enemy; Mercury regards Mars as merely neutral. We read it
 * PARENT → CHILD — how the ruler regards the sub-ruler serving under it — because that is the
 * question a sub-period actually poses. Reversing the arguments silently flips readings, so it
 * is pinned by a test.
 *
 * Rāhu and Ketu are absent from that table, so any pairing involving them is neutral and
 * contributes nothing. That is deliberate: a fabricated relation would be indistinguishable
 * from a real one.
 */
export function relationClass(parent: Graha, child: Graha): RelationClass {
  if (parent === child) return 'friend'; // a planet is never at odds with itself
  return naturalRelation(parent, child) as RelationClass;
}

/**
 * The house term. A planet standing in the category's own bhava is working on home ground;
 * one standing in the 6th, 8th or 12th from it is working uphill. Capped at ±1 so the house
 * can colour the reading but never outweigh the category, which is the stronger signal.
 */
function houseModifier(
  chart: Chart, planet: Graha, category: string,
): { value: number; significator: number; reason: string | null } {
  const significator = RULES.houseSignificators[category] ?? 1;
  const placed = chart.planets[planet].house;
  // Houses counted inclusively from the significator, the classical way: the significator
  // itself is 1, so the 6th from it is significator + 5.
  const from = ((placed - significator + 12) % 12) + 1;
  if (from === 1) {
    return { value: 1, significator, reason: `in your ${ordinal(significator)} house, where this is read from` };
  }
  if (from === 6 || from === 8 || from === 12) {
    return {
      value: -1, significator,
      reason: `${ordinal(from)} from your ${ordinal(significator)} house, so it works uphill here`,
    };
  }
  return { value: 0, significator, reason: null };
}

const ordinal = (n: number): string => {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd'
    : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
};

/** Score one stage and pick its archetype. Pure: no clock, no I/O, no randomness. */
export function scoreStage(input: ScoreInput): ScoreBreakdown {
  const { category, planet, parentPlanet, chart } = input;
  const name = input.nameOf ?? ((g: Graha) => g);
  const table = RULES.suitability[category] ?? RULES.suitability.other!;
  const suitability = table[planet] ?? 0;
  const because: string[] = [];

  if (suitability !== 0) {
    because.push(
      suitability > 0
        ? `${name(planet)} carries this kind of work`
        : `${name(planet)} resists this kind of work`,
    );
  }

  let relation = 0;
  let cls: RelationClass | null = null;
  if (parentPlanet) {
    cls = relationClass(parentPlanet, planet);
    relation = RULES.relationModifier[cls] ?? 0;
    if (relation !== 0) {
      because.push(
        relation > 0
          ? `it sits well inside the ${name(parentPlanet)} term above it`
          : `it pulls against the ${name(parentPlanet)} term above it`,
      );
    }
  }

  let house = 0;
  let houseSignificator: number | null = null;
  if (chart) {
    const h = houseModifier(chart, planet, category);
    house = h.value;
    houseSignificator = h.significator;
    if (h.reason) because.push(h.reason);
  }

  const score = suitability + relation + house;
  const archetype = ARCHETYPE_ORDER.find((a) => score >= ARCHETYPES[a].minScore) ?? 'hold';

  return {
    score, archetype, suitability, relation, relationClass: cls,
    house, houseSignificator, rulesVersion: RULES_VERSION, because,
  };
}

/** The label, verb and one-line gloss for an archetype. Copy lives in the rules data. */
export const archetypeMeta = (a: Archetype) => ARCHETYPES[a];
