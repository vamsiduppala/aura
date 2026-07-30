// Composable interpretation (new-structure.md §4.6).
//
// THE PROBLEM: the interesting content is combinatorial, not a list. Nine planets at five
// levels is 45 blocks, but the reading that matters is "Venus, as Governor, inside a Saturn
// term, in my 7th house" — and two levels is already 81 pairs, five levels 59,049. You cannot
// hand-write that. You also must not generate it per request: nondeterministic, expensive,
// and unauditable, which is the opposite of what an app that tells people about their life
// needs.
//
// THE ANSWER: ~100 authored fragments, assembled deterministically.
//
//   base[planet][office]              the term's own character      (caller supplies)
//   + relation[rulerAbove][subRuler]  what the COMBINATION does     81 fragments
//   + houseFlavour[occupiedHouse]     where it lands for THIS person 12 fragments
//
// Every layer is authored prose in `interpretation.json`. Nothing here is model output, and
// §4.6 keeps the LLM smoothing pass offline, batched and astrologer-approved — users never
// see unreviewed generated astrology.

import type { Chart, Graha, House } from '@aura/engine';
import { relationClass, type RelationClass } from './composer.js';
import contentFile from '../interpretation.json' with { type: 'json' };

interface ContentFile {
  $meta: { contentVersion: number };
  relation: Record<Graha, Record<Graha, string>>;
  houseFlavour: Record<string, string>;
}
const CONTENT = contentFile as unknown as ContentFile;

/** Bumped when any fragment changes. Part of the cache key, so stale text cannot survive. */
export const CONTENT_VERSION: number = CONTENT.$meta.contentVersion;

export interface InterpretInput {
  /** The planet whose period is being read. */
  planet: Graha;
  /** 1 = King … 5 = Messenger. */
  level: number;
  /** The ruler of the period above. Absent at level 1. */
  parentPlanet?: Graha | undefined;
  /** Optional. Without it the house layer is omitted rather than guessed. */
  chart?: Chart | undefined;
}

export interface Interpretation {
  /** What this pairing does. Empty at level 1, which has no ruler above it. */
  relation: string | null;
  /** Where it lands for this person. Null without a chart. */
  houseFlavour: string | null;
  /** Which bhava the ruling planet occupies. Null without a chart. */
  house: House | null;
  relationClass: RelationClass | null;
  /** Stable, portable key for caching or freezing assembled output. */
  cacheKey: string;
  contentVersion: number;
}

/**
 * FNV-1a, 32-bit, hex. §4.6 says sha256; this is deliberately not that.
 *
 * A cache key needs to be deterministic and identical across implementations, not
 * collision-resistant against an adversary — nobody attacks their own interpretation cache.
 * sha256 in a browser means the async Web Crypto API, which would make every call site
 * asynchronous for no benefit. FNV-1a is synchronous, trivially portable to Dart/Swift/Kotlin,
 * and produces the same digest everywhere. If these keys ever become security-relevant, that
 * assumption has changed and this must change with it.
 */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply, kept in range with Math.imul.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * A hash of the chart features this interpretation actually depends on — not the whole chart.
 *
 * That distinction is what makes the cache useful: two users whose Venus sits in the same
 * house with the same dignity get the same text and therefore the same key, so the fragment
 * is assembled (and, later, reviewed) once rather than per person.
 */
export function chartFeatureHash(chart: Chart, planet: Graha): string {
  const p = chart.planets[planet];
  return fnv1a([
    p.house,
    // Dignity bucketed, not raw: a 0.61 and a 0.62 must not be different cache entries.
    Math.round(p.dignity * 4) / 4,
    p.retrograde ? 'R' : '-',
    p.combust ? 'C' : '-',
  ].join('|'));
}

/**
 * Assemble the layers for one period. Pure and deterministic: same inputs, same output,
 * same key, forever.
 */
export function interpret(input: InterpretInput): Interpretation {
  const { planet, level, parentPlanet, chart } = input;

  let relation: string | null = null;
  let cls: RelationClass | null = null;
  if (parentPlanet) {
    relation = CONTENT.relation[parentPlanet]?.[planet] ?? null;
    cls = relationClass(parentPlanet, planet);
  }

  let houseFlavour: string | null = null;
  let house: House | null = null;
  if (chart) {
    house = chart.planets[planet].house;
    houseFlavour = CONTENT.houseFlavour[String(house)] ?? null;
  }

  const cacheKey = [
    'i', CONTENT_VERSION, planet, level, parentPlanet ?? '-', cls ?? '-',
    chart ? chartFeatureHash(chart, planet) : '-',
  ].join(':');

  return { relation, houseFlavour, house, relationClass: cls, cacheKey, contentVersion: CONTENT_VERSION };
}

/** Every relation fragment, for coverage tests and for the authoring console (M4). */
export const RELATION_FRAGMENTS = CONTENT.relation;
export const HOUSE_FRAGMENTS = CONTENT.houseFlavour;
