// ─────────────────────────────────────────────────────────────────────────────
// @aura/knowledge — types for the Vedic-astrology knowledge base.
// The traditional RULES/FACTS are encoded as structured data (our own concise
// phrasing), organized per the source's chapters. This is the reference the Cosmic
// Mentor and the interpretation engine read from. Computation lives in @aura/engine.
// ─────────────────────────────────────────────────────────────────────────────

export type Graha =
  | 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu';

/** Sign index 0..11 (0 = Aries). */
export type SignIndex = number;
/** House 1..12. */
export type House = number;

export type Element = 'fire' | 'earth' | 'air' | 'ether' | 'water';
export type Guna = 'sattva' | 'rajas' | 'tamas';
export type Modality = 'movable' | 'fixed' | 'dual';
export type Gender = 'male' | 'female' | 'neuter';
export type Varna = 'brahmana' | 'kshatriya' | 'vaishya' | 'shudra';
export type NaturalNature = 'benefic' | 'malefic' | 'conditional';

// ── Planets (Ch 3) ───────────────────────────────────────────────────────────
export interface GrahaKnowledge {
  key: Graha;
  english: string;
  sanskrit: string;
  naturalNature: NaturalNature;
  /** The one thing it primarily governs (Ch 3.2.3). */
  governs: string;
  /** Broad significations (people, themes) it stands for. */
  significations: string[];
  /** People it represents (planetary cabinet, Ch 3.2.5). */
  cabinet: string;
  deity: string;
  gender: Gender;
  element: Element | null;
  varna: Varna | null;
  guna: Guna | null;
  /** Body tissue it rules (sapta dhatu, Ch 3.2.12). */
  bodyTissue: string | null;
  taste: string | null;
  season: string | null;
  /** House (1/4/7/10) of directional strength (dig bala, Ch 3.2.15). */
  digBalaHouse: House | null;
  strongIn: 'day' | 'night' | 'always' | null;
  colour: string | null;
}

// ── Signs (Ch 2) ─────────────────────────────────────────────────────────────
export interface RasiKnowledge {
  index: SignIndex;
  english: string;
  sanskrit: string;
  lord: Graha;
  element: Element;
  modality: Modality;
  /** Odd signs are 'male', even are 'female' (Ch 2.2.2). */
  gender: Gender;
  guna: Guna | null;
  dosha: 'pitta' | 'vaata' | 'kapha' | null;
  direction: string | null;
  varna: Varna | null;
  /** Body part in Kalapurusha (the cosmic body). */
  bodyPart: string;
  indications: string[];
}

// ── Houses (Ch 7) ────────────────────────────────────────────────────────────
export type HouseCategory = 'kendra' | 'trikona' | 'dusthana' | 'upachaya' | 'maraka' | 'panapara' | 'apoklima';
export interface BhavaKnowledge {
  number: House;
  english: string;
  sanskrit: string;
  categories: HouseCategory[];
  /** Natural significator planet(s) of the house. */
  karakas: Graha[];
  bodyPart: string;
  significations: string[];
}

// ── Nakshatras (Ch 1.3.6 / Table 2) ──────────────────────────────────────────
export interface NakshatraKnowledge {
  index: number; // 0..26
  name: string;
  lord: Graha; // Vimsottari dasha lord
  deity: string;
  symbol: string;
  /** One-line nature/theme. */
  theme: string;
}

// ── Yogas (Ch 11) ────────────────────────────────────────────────────────────
export interface YogaKnowledge {
  key: string;
  name: string;
  category: string;
  /** The defining rule, in plain terms. */
  rule: string;
  /** The classical effect/result. */
  effect: string;
}

// ── A generic concept entry (for search + chapters not yet modeled richly) ──
export interface Concept {
  id: string;
  chapter: string;
  term: string;
  aka?: string[];
  summary: string;
  tags: string[];
}
