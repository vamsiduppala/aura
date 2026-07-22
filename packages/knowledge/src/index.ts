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
export {
  bhavaLagna, horaLagna, ghatiLagna, sreeLagna, specialLagnas,
  SPECIAL_LAGNA_USE, type SpecialLagnas,
} from './data/lagnas.js';
export {
  sunUpagrahas, partLords, upagrahaFraction, UPAGRAHA_PART, UPAGRAHA_NOTES,
  type SunUpagrahas,
} from './data/upagrahas.js';
export {
  ashtakavarga, bhinnashtakavarga, AV_TABLE, AV_PLANETS,
  type AVPlanet, type AVRef, type RefSigns, type AshtakavargaResult,
} from './data/ashtakavarga.js';
export {
  tithiOf, nityaYoga, karanaOf, horaLord, panchanga,
  NITYA_YOGAS, WEEKDAY_LORD, type Tithi, type Panchanga,
} from './data/panchanga.js';
export {
  VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS, VIMSHOTTARI_TOTAL, nakshatraLord,
  dashaBalanceAtBirth, dashaSequence, subPeriodYears, antardashas, DASHA_VARIATION_OFFSET,
  type DashaBalance, type DashaSpan,
} from './data/vimshottari.js';
export {
  ASHTOTTARI_ORDER, ASHTOTTARI_YEARS, ASHTOTTARI_TOTAL,
  ashtottariBalanceAtBirth, ashtottariAntardashas,
  type AshtottariBalance,
} from './data/ashtottari.js';
export {
  MARAKA_HOUSES, marakaLords, RUDRA_8TH_SIGN, rudra8thSign, signModality,
  pairLongevity, LONGEVITY_RANGES, combineThreePairs, LONGEVITY_NOTES,
  type LifeSpan, type Modality,
} from './data/longevity.js';
export {
  baladiAvastha, jagradiAvastha, deeptadiAvastha, AVASTHA_NOTES,
  type Baladi, type Jagradi, type Deeptadi,
} from './data/avasthas.js';
export {
  narayanaProgression, narayanaDasaLength, narayanaSecondCycle, narayanaAntardashas,
  type RasiMotion, type DasaLengthOpts, type Antardasa,
} from './data/narayana.js';
export {
  kendradiProgression, lagnaKendradiDasa, sudasa, drigdasa,
  shoolaDasa, shoolaAntardashas, niryaanaShoolaDasa, MODALITY_YEARS,
  type Sudasa, type RasiSpan,
} from './data/rasidasha.js';
export {
  kalachakraPada, isSavya, KALACHAKRA_RASI_YEARS, MIRROR_SIGN, SAVYA_24, APASAVYA_24,
  type KalachakraPada,
} from './data/kalachakra.js';
export {
  TARAS, taraOf, SPECIAL_NAKSHATRAS, specialNakshatra,
  NAKSHATRA_ASPECTS, nakshatraAspectsFrom, type Tara, type TaraResult,
} from './data/taras.js';
export {
  muntha, MUNTHA_IN_HOUSE, TAJAKA_ASPECTS, DEEPTAMSA, HARSHA_HOUSE, harshaBala,
  type TajakaAspect,
} from './data/tajaka.js';
export { getGraha, getRasi, getBhava, getNakshatra, search, type SearchHit } from './query.js';
export {
  interpretPlacement, interpretLagnaLord, classifyDignity,
  type Placement, type Interpretation, type Dignity,
} from './interpret.js';
