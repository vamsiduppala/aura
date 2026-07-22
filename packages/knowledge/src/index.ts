// @aura/knowledge — public API. Structured Vedic-astrology rule data + interpretation.

export * from './types.js';
export { GRAHAS, GRAHA_KEYS } from './data/grahas.js';
export { RASIS, RASI_BY_INDEX } from './data/rasis.js';
export { BHAVAS, BHAVA } from './data/bhavas.js';
export { NAKSHATRAS, NAKSHATRA_BY_INDEX } from './data/nakshatras.js';
export { YOGAS, YOGA_BY_KEY } from './data/yogas.js';
export { DIVISIONALS, DIVISIONAL_BY_N, type DivisionalKnowledge } from './data/divisionals.js';
export {
  CHARA_KARAKAS, STHIRA_KARAKAS, NAISARGIKA_HOUSE_KARAKA,
  type CharaKaraka, type SthiraKaraka,
} from './data/karakas.js';
export {
  FUNCTIONAL_NATURE, functionalNatureFor, baadhakaHouse, type FunctionalNature,
} from './data/functional.js';
export {
  TRANSIT_FROM_MOON, isFavourableTransit, sadeSatiPhase, type TransitRule,
} from './data/transits.js';
export {
  NATURAL_RELATIONS, naturalRelation, temporaryRelation, compoundRelation,
  type Relation, type CompoundRelation,
} from './data/relationships.js';
export { REMEDIES, behaviouralRemedy, type Remedy } from './data/remedies.js';
export { DIGNITIES, dignityOf, type DignityDef } from './data/dignities.js';
export {
  GRAHA_DRISHTI, advanceHouse, grahaAspectsFrom, rasiDrishti,
  ARGALA_PRIMARY, ARGALA_SECONDARY, VIRODHARGALA, ARGALA_MEANING, argalaOn,
  ASPECT_NOTES, type ArgalaSource,
} from './data/aspects.js';
export {
  arudhaOf, allArudhas, arudhaTable, ARUDHA_NAMES, ARUDHA_USE, CO_LORD,
  type ArudhaResult,
} from './data/arudhas.js';
export {
  vargaSign, allVargas, VARGA_DIVISORS, type VargaDivisor,
} from './data/varga.js';
export { getGraha, getRasi, getBhava, getNakshatra, search, type SearchHit } from './query.js';
export {
  interpretPlacement, interpretLagnaLord, classifyDignity,
  type Placement, type Interpretation, type Dignity,
} from './interpret.js';
