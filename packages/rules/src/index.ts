// @vim/rules — the astrologer-editable layer.
//
// `rules.json` holds every astrological judgement as versioned data. `src/` holds only
// mechanism: scoring, assembly, cache keys. That split is the whole point of the package —
// see new-structure.md §4.5 ("engineers do not encode astrology in code") and §4.6.

export {
  RULES_VERSION, CATEGORIES, ARCHETYPES,
  scoreStage, relationClass, archetypeMeta,
  type Archetype, type RelationClass, type ScoreInput, type ScoreBreakdown,
} from './composer.js';

export {
  CONTENT_VERSION, RELATION_FRAGMENTS, HOUSE_FRAGMENTS,
  interpret, chartFeatureHash,
  type InterpretInput, type Interpretation,
} from './interpret.js';
