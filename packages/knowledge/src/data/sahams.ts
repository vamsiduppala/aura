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
  | 'lagna' | 'lagnaLord' | 'punya';

export interface SahamFormula { name: string; meaning: string; a: SahamToken; b: SahamToken; c: SahamToken; sameDayNight?: boolean }

/** Table 74 (subset): the important sahams, as token formulas. Punya is computed first. */
export const SAHAM_FORMULAS: SahamFormula[] = [
  { name: 'punya', meaning: 'fortune / good deeds', a: 'moon', b: 'sun', c: 'lagna' },
  { name: 'vidya', meaning: 'education', a: 'sun', b: 'moon', c: 'lagna' },
  { name: 'yasas', meaning: 'fame', a: 'jupiter', b: 'punya', c: 'lagna' },
  { name: 'mitra', meaning: 'friend', a: 'jupiter', b: 'punya', c: 'venus' },
  { name: 'mahatmya', meaning: 'greatness', a: 'punya', b: 'mars', c: 'lagna' },
  { name: 'asha', meaning: 'desires', a: 'saturn', b: 'mars', c: 'lagna' },
  { name: 'bhratri', meaning: 'brothers', a: 'jupiter', b: 'saturn', c: 'lagna', sameDayNight: true },
  { name: 'gaurava', meaning: 'respect / regard', a: 'jupiter', b: 'moon', c: 'sun' },
  { name: 'pitri', meaning: 'father', a: 'saturn', b: 'sun', c: 'lagna' },
  { name: 'rajya', meaning: 'kingdom / status', a: 'saturn', b: 'sun', c: 'lagna' },
];

/** Longitudes needed to resolve the saham tokens (0..360 each). */
export type SahamContext = Record<Exclude<SahamToken, 'punya'>, number>;

/** Compute all the tabled sahams from a context of longitudes (Punya resolved first). */
export function computeSahams(ctx: SahamContext, day = true): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of SAHAM_FORMULAS) {
    const resolve = (t: SahamToken): number => (t === 'punya' ? out.punya! : ctx[t]);
    out[f.name] = saham(resolve(f.a), resolve(f.b), resolve(f.c), day, f.sameDayNight);
  }
  return out;
}
