// ─────────────────────────────────────────────────────────────────────────────
// Sahams — Ch 28.8. Sensitive points in the zodiac ("Arabic parts"), each with a formula
// A − B + C (reversed to B − A + C at night, unless flagged same). A 30° adjustment applies
// when C does not fall between B and A zodiacally. Verified against the book's artha-saham
// worked example (2°30′ Sc).
// ─────────────────────────────────────────────────────────────────────────────

const mod360 = (n: number): number => ((n % 360) + 360) % 360;

/**
 * A saham point from three longitudes. `day` chooses A−B+C (day) vs B−A+C (night);
 * `sameDayNight` forces the day formula. Adds 30° if C is not between B and A zodiacally.
 */
export function saham(A: number, B: number, C: number, day = true, sameDayNight = false): number {
  const useDay = day || sameDayNight;
  const x = useDay ? A : B;
  const y = useDay ? B : A;
  let s = mod360(x - y + C);
  const between = mod360(C - y) <= mod360(x - y);
  if (!between) s = mod360(s + 30);
  return s;
}

export type SahamToken =
  | 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn'
  | 'lagna' | 'lagnaLord'
  | 'punya' | 'sastra';   // sahams used as inputs to other sahams (resolved from earlier results)

export interface SahamFormula { name: string; meaning: string; a: SahamToken; b: SahamToken; c: SahamToken; sameDayNight?: boolean }

/**
 * Table 74 sahams, as token formulas. Ordered so any saham used as an input (Punya, Sastra) is
 * computed before the sahams that reference it. Only the sahams whose formulas use planets, the
 * lagna, the lagna lord, or an already-computed saham are listed here; the seven that need a bhava
 * cusp / house-lord longitude (Mrityu, Paradesa, Santapa, Karyasiddhi, Jalapatana, Apamrityu, Labha)
 * are left to a caller that has that chart data. `samartha` uses its main formula — when Mars owns
 * the lagna the book substitutes (Jupiter − Mars + Lagna), applied by the caller.
 */
export const SAHAM_FORMULAS: SahamFormula[] = [
  { name: 'punya', meaning: 'fortune / good deeds', a: 'moon', b: 'sun', c: 'lagna' },
  { name: 'vidya', meaning: 'education', a: 'sun', b: 'moon', c: 'lagna' },
  { name: 'yasas', meaning: 'fame', a: 'jupiter', b: 'punya', c: 'lagna' },
  { name: 'mitra', meaning: 'friend', a: 'jupiter', b: 'punya', c: 'venus' },
  { name: 'mahatmya', meaning: 'greatness', a: 'punya', b: 'mars', c: 'lagna' },
  { name: 'asha', meaning: 'desires', a: 'saturn', b: 'mars', c: 'lagna' },
  { name: 'samartha', meaning: 'enterprise / ability', a: 'mars', b: 'lagnaLord', c: 'lagna' },
  { name: 'bhratri', meaning: 'brothers', a: 'jupiter', b: 'saturn', c: 'lagna', sameDayNight: true },
  { name: 'gaurava', meaning: 'respect / regard', a: 'jupiter', b: 'moon', c: 'sun' },
  { name: 'pitri', meaning: 'father', a: 'saturn', b: 'sun', c: 'lagna' },
  { name: 'rajya', meaning: 'kingdom / status', a: 'saturn', b: 'sun', c: 'lagna' },
  { name: 'matri', meaning: 'mother', a: 'moon', b: 'venus', c: 'lagna' },
  { name: 'putra', meaning: 'children', a: 'jupiter', b: 'moon', c: 'lagna' },
  { name: 'jeeva', meaning: 'life', a: 'saturn', b: 'jupiter', c: 'lagna' },
  { name: 'karma', meaning: 'work / action', a: 'mars', b: 'mercury', c: 'lagna' },
  { name: 'roga', meaning: 'disease', a: 'lagna', b: 'moon', c: 'lagna' },
  { name: 'kali', meaning: 'great misfortune', a: 'jupiter', b: 'mars', c: 'lagna' },
  { name: 'sastra', meaning: 'sciences', a: 'jupiter', b: 'saturn', c: 'mercury' },
  { name: 'bandhu', meaning: 'relatives', a: 'mercury', b: 'moon', c: 'lagna' },
  { name: 'paradara', meaning: 'adultery', a: 'venus', b: 'sun', c: 'lagna' },
  { name: 'vanik', meaning: 'commerce', a: 'moon', b: 'mercury', c: 'lagna' },
  { name: 'vivaha', meaning: 'marriage', a: 'venus', b: 'saturn', c: 'lagna' },
  { name: 'sraddha', meaning: 'devotion / sincerity', a: 'venus', b: 'mars', c: 'lagna' },
  { name: 'preeti', meaning: 'love / attachment', a: 'sastra', b: 'punya', c: 'lagna' },
  { name: 'jadya', meaning: 'chronic disease', a: 'mars', b: 'saturn', c: 'mercury' },
  { name: 'vyapara', meaning: 'business', a: 'mars', b: 'saturn', c: 'lagna', sameDayNight: true },
  { name: 'satru', meaning: 'enemy', a: 'mars', b: 'saturn', c: 'lagna' },
  { name: 'bandhana', meaning: 'imprisonment', a: 'punya', b: 'saturn', c: 'lagna' },
];

const COMPUTED_TOKENS = new Set<SahamToken>(['punya', 'sastra']);

/** Longitudes needed to resolve the saham tokens (0..360 each). The computed sahams aren't required. */
export type SahamContext = Record<Exclude<SahamToken, 'punya' | 'sastra'>, number>;

/** Compute all the tabled sahams from a context of longitudes (chained sahams resolved in order). */
export function computeSahams(ctx: SahamContext, day = true): Record<string, number> {
  const out: Record<string, number> = {};
  const resolve = (t: SahamToken): number =>
    COMPUTED_TOKENS.has(t) ? out[t]! : ctx[t as Exclude<SahamToken, 'punya' | 'sastra'>];
  for (const f of SAHAM_FORMULAS) {
    out[f.name] = saham(resolve(f.a), resolve(f.b), resolve(f.c), day, f.sameDayNight);
  }
  return out;
}
