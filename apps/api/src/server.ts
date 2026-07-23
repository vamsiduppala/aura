// ─────────────────────────────────────────────────────────────────────────────
// @aura/api — local Vedic-astrology knowledge service. Serves @aura/knowledge over
// HTTP so the Cosmic Mentor (or any client) can query rules + interpretations.
// Local-only, open, no auth (per the brief). CORS is wide-open for local dev.
// Run: npm --workspace @aura/api run start   (default http://localhost:8787)
// ─────────────────────────────────────────────────────────────────────────────

import Fastify from 'fastify';
import { openDb, getProfile, upsertProfile, deleteUser, type ProfileRow } from './db.js';
import { register, login, userForToken, AuthError } from './auth.js';
import {
  GRAHAS, RASIS, BHAVAS, NAKSHATRAS, YOGAS, YOGA_BY_KEY,
  DIVISIONALS, DIVISIONAL_BY_N, CHARA_KARAKAS, STHIRA_KARAKAS, sankhyaYoga, matchAakritiYogas, vajraYavaYoga,
  rajaYogas, vipareetaYoga, type PlanetSigns,
  FUNCTIONAL_NATURE, functionalNatureFor, TRANSIT_FROM_MOON, NATURAL_RELATIONS, REMEDIES,
  sodhyaPindaTiming, SODHYA_PINDA_MATTERS,
  getGraha, getRasi, getBhava, getNakshatra, search,
  interpretPlacement, interpretLagnaLord, classifyDignity, DIGNITIES,
  grahaAspectsFrom, rasiDrishti, argalaOn, ASPECT_NOTES,
  arudhaTable, ARUDHA_NAMES, grahaArudhas, OWN_SIGNS,
  vargaSign, allVargas, VARGA_DIVISORS, dwadasaVargeeyaBala,
  specialLagnas, SPECIAL_LAGNA_USE,
  sunUpagrahas, partLords, upagrahaFraction, UPAGRAHA_PART,
  ashtakavarga, bhinnashtakavarga, sodhitaAshtakavarga, sodhyaPinda, AV_PLANETS,
  type RefSigns, type AVPlanet,
  panchanga, horaLord, matterTithi, tithiPanchaka,
  dashaBalanceAtBirth, antardashas, VIMSHOTTARI_YEARS, subdivideDasha, DASHA_LEVELS,
  ashtottariBalanceAtBirth, ashtottariAntardashas,
  marakaLords, MARAKA_HOUSES, signModality, pairLongevity, combineThreePairs, LONGEVITY_RANGES,
  maheswara, rudra8thSign,
  type LifeSpan,
  baladiAvastha, jagradiAvastha, deeptadiAvastha,
  narayanaProgression, narayanaDasaLength, narayanaAntardashas,
  lagnaKendradiDasa, sudasa, drigdasa, shoolaDasa, shoolaAntardashas, niryaanaShoolaDasa,
  kalachakraPada,
  taraOf, specialNakshatra, nakshatraAspectsFrom, SPECIAL_NAKSHATRAS, lattaNakshatra, murthiOf,
  vedhaHouse, VEDHA_STHAANA,
  charaKarakas,
  muntha, MUNTHA_IN_HOUSE, harshaBala, TAJAKA_ASPECTS, DEEPTAMSA,
  DEEP_EXALTATION, uchchaBala, haddaLord, type ClassicalGraha,
  saham, computeSahams, SAHAM_FORMULAS, computeBhavaSahams, BHAVA_SAHAM_FORMULAS,
  type SahamContext, type BhavaSahamContext,
  ithasala, ishkavala, induvara, TAJAKA_YOGAS,
  muddaDasa, patyayiniDasa, patyayiniAntardasas, varshaNarayanaDasa, type PatyayiniToken, sudarsanaDasa, sudarsanaAllRefs,
  muhurtaCheck, MUHURTA_GUIDELINES,
  ETHICS_PRINCIPLES, RATIONAL_PRINCIPLES, BIRTHTIME_RECTIFICATION, MUNDANE_PRINCIPLES,
  type Graha, type Placement,
} from '@aura/knowledge';

type Dignity = Parameters<typeof jagradiAvastha>[0];

// ── Full chart reading (the "blueprint kundali") ──────────────────────────────
// Composes the knowledge layer into one house-by-house reading from a set of computed positions
// (a client runs the ephemeris; this turns positions into the interpreted chart). Offline-first
// clients can still compute this on-device — this is the authoritative server-side surface.
interface KundaliPlanetInput { sign: number; house: number; longitude: number; retrograde?: boolean; combust?: boolean }
interface KundaliInput { lagnaSign: number; planets: Record<Graha, KundaliPlanetInput> }

/** A finite number from a query-string param, or null if absent/blank/non-numeric (caller 400s). */
function qNum(v: string | undefined): number | null {
  if (v == null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const KUNDALI_SEVEN: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
const KUNDALI_NINE: Graha[] = [...KUNDALI_SEVEN, 'rahu', 'ketu'];

function buildKundaliReading(input: KundaliInput) {
  const { lagnaSign, planets } = input;
  const lagnaRasi = getRasi(lagnaSign);
  const lagnaLord = lagnaRasi.lord;
  const ll = planets[lagnaLord]!;

  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const sign = (lagnaSign + h - 1) % 12;
    const b = getBhava(h);
    const lord = getRasi(sign).lord;
    const occupants = KUNDALI_NINE.filter((g) => planets[g].house === h).map((g) => {
      const p = planets[g];
      const dignity = classifyDignity(g, p.sign);
      const interp = interpretPlacement({ graha: g, house: h, sign: p.sign, dignity, retrograde: p.retrograde, combust: p.combust });
      return { graha: g, sign: p.sign, signName: getRasi(p.sign).english, dignity, retrograde: !!p.retrograde, combust: !!p.combust, ...interp };
    });
    houses.push({
      house: h, name: b.english, sanskrit: b.sanskrit, categories: b.categories,
      significations: b.significations, sign, signName: getRasi(sign).english,
      lord, lordHouse: planets[lord]!.house, occupants,
    });
  }

  const ck = charaKarakas(Object.fromEntries([...KUNDALI_SEVEN, 'rahu'].map((g) => [g, planets[g as Graha]!.longitude])));
  const karaka = (code: string) => ck.find((k) => k.code === code)?.graha;
  const aakriti = matchAakritiYogas(KUNDALI_SEVEN.map((g) => planets[g].house));
  const shape = aakriti[0] ?? sankhyaYoga(KUNDALI_SEVEN.map((g) => planets[g].sign));
  const signs = Object.fromEntries(KUNDALI_NINE.map((g) => [g, planets[g].sign])) as PlanetSigns;

  return {
    lagna: { sign: lagnaSign, signName: lagnaRasi.english, traits: lagnaRasi.indications.slice(0, 4),
      lord: lagnaLord, lordHouse: ll.house, lordReading: interpretLagnaLord(lagnaLord, ll.house, ll.sign) },
    houses,
    karakas: { atmakaraka: karaka('AK'), amatyakaraka: karaka('AmK'), darakaraka: karaka('DK'), all: ck },
    shape: { name: shape.name, means: shape.means, effect: shape.effect },
    rajaYogas: rajaYogas(lagnaSign, signs),
    vipareeta: vipareetaYoga(lagnaSign, signs),
  };
}

export function buildServer() {
  const app = Fastify({ logger: false });
  openDb(); // local SQLite (users, sessions, profiles)

  // wide-open CORS for local use
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') reply.send();
  });

  app.get('/health', async () => ({ ok: true, service: 'aura-knowledge', version: '0.1.0' }));

  // ── Auth + profiles (Phase 2: local accounts) ───────────────────────────────
  const bearer = (req: { headers: Record<string, unknown> }): string | undefined => {
    const h = req.headers['authorization'];
    return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : undefined;
  };
  const rowToProfile = (r: ProfileRow) => ({
    birth: {
      date: r.birth_date, time: r.birth_time ?? undefined, unknownTime: !!r.unknown_time,
      place: r.place, lat: r.lat, lng: r.lng, tzOffsetMinutes: r.tz_offset,
    },
    goalArea: r.goal_area, goalName: r.goal_name,
  });

  app.post('/auth/register', async (req, reply) => {
    const b = req.body as { email?: string; password?: string };
    try { return register(b?.email ?? '', b?.password ?? ''); }
    catch (e) { return reply.code(e instanceof AuthError ? 400 : 500).send({ error: (e as Error).message }); }
  });
  app.post('/auth/login', async (req, reply) => {
    const b = req.body as { email?: string; password?: string };
    try { return login(b?.email ?? '', b?.password ?? ''); }
    catch (e) { return reply.code(e instanceof AuthError ? 401 : 500).send({ error: (e as Error).message }); }
  });
  app.get('/auth/me', async (req, reply) => {
    const user = userForToken(bearer(req));
    if (!user) return reply.code(401).send({ error: 'not authenticated' });
    const p = getProfile(user.id);
    return { user, profile: p ? rowToProfile(p) : null };
  });
  app.get('/profile', async (req, reply) => {
    const user = userForToken(bearer(req));
    if (!user) return reply.code(401).send({ error: 'not authenticated' });
    const p = getProfile(user.id);
    return p ? rowToProfile(p) : reply.code(404).send({ error: 'no profile yet' });
  });
  app.put('/profile', async (req, reply) => {
    const user = userForToken(bearer(req));
    if (!user) return reply.code(401).send({ error: 'not authenticated' });
    const b = req.body as { birth?: Record<string, unknown>; goalArea?: string; goalName?: string };
    const birth = b?.birth;
    if (!birth || !birth.date || birth.lat == null || birth.lng == null || birth.tzOffsetMinutes == null || !birth.place) {
      return reply.code(400).send({ error: 'birth { date, place, lat, lng, tzOffsetMinutes } required' });
    }
    upsertProfile({
      user_id: user.id,
      birth_date: String(birth.date), birth_time: (birth.time as string) ?? null,
      unknown_time: birth.unknownTime ? 1 : 0, place: String(birth.place),
      lat: Number(birth.lat), lng: Number(birth.lng), tz_offset: Number(birth.tzOffsetMinutes),
      goal_area: b.goalArea ?? 'career', goal_name: b.goalName ?? '', updated_at: '',
    });
    return { ok: true };
  });
  // Permanently delete the signed-in user's account and all their data (backs "Delete everything").
  app.delete('/account', async (req, reply) => {
    const user = userForToken(bearer(req));
    if (!user) return reply.code(401).send({ error: 'not authenticated' });
    deleteUser(user.id);
    return { ok: true, deleted: true };
  });

  // reference data
  app.get('/grahas', async () => Object.values(GRAHAS));
  app.get('/grahas/:key', async (req, reply) => {
    const key = (req.params as { key: string }).key as Graha;
    if (!GRAHAS[key]) return reply.code(404).send({ error: 'unknown graha' });
    return getGraha(key);
  });
  app.get('/rasis', async () => RASIS);
  app.get('/rasis/:i', async (req) => getRasi(Number((req.params as { i: string }).i)));
  app.get('/bhavas', async () => BHAVAS);
  app.get('/bhavas/:n', async (req) => getBhava(Number((req.params as { n: string }).n)));
  app.get('/nakshatras', async () => NAKSHATRAS);
  app.get('/nakshatras/:i', async (req) => getNakshatra(Number((req.params as { i: string }).i)));
  app.get('/yogas', async () => YOGAS);
  // Sankhya Naabhasa yoga (Ch 11.5.4): the yoga from the count of distinct signs the 7 planets occupy.
  app.get('/yogas/sankhya', async (req, reply) => {
    const q = req.query as { signs?: string };
    if (!q.signs) return reply.code(400).send({ error: 'signs=comma-separated signs (0-11) of the 7 planets (Sun..Saturn)' });
    return sankhyaYoga(q.signs.split(',').map(Number));
  });
  // Aakriti (shape) Naabhasa yogas (Ch 11.5.3): the yogas the 7 planets' house distribution forms.
  app.get('/yogas/aakriti', async (req, reply) => {
    const q = req.query as { houses?: string };
    if (!q.houses) return reply.code(400).send({ error: 'houses=comma-separated houses (1-12 from lagna) the 7 planets occupy' });
    return { yogas: matchAakritiYogas(q.houses.split(',').map(Number)) };
  });
  // Vajra / Yava (benefic-malefic placement in the kendras).
  app.get('/yogas/vajra-yava', async (req, reply) => {
    const q = req.query as { benefics?: string; malefics?: string };
    if (!q.benefics || !q.malefics) return reply.code(400).send({ error: 'benefics= and malefics= comma-separated houses (1-12) each group occupies' });
    return { yoga: vajraYavaYoga(q.benefics.split(',').map(Number), q.malefics.split(',').map(Number)) };
  });
  // Raaja & Vipareeta Raaja yogas (11.7): POST { lagnaSign, signs:{sun..ketu} } → the quadrant/trine
  // lord links (conjunction/aspect/exchange, incl. Dharma-Karmadhipati) + the vipareeta reading.
  app.post('/yogas/raja', async (req, reply) => {
    const b = req.body as { lagnaSign?: number; signs?: Partial<PlanetSigns> };
    const need = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    if (b?.lagnaSign == null || !b.signs || need.some((k) => (b.signs as Record<string, number>)[k] == null)) {
      return reply.code(400).send({ error: 'lagnaSign (0-11) and signs for all 9 grahas (0-11) required' });
    }
    return {
      raja: rajaYogas(b.lagnaSign, b.signs as PlanetSigns),
      vipareeta: vipareetaYoga(b.lagnaSign, b.signs as PlanetSigns),
    };
  });
  app.get('/yogas/:key', async (req, reply) => {
    const y = YOGA_BY_KEY((req.params as { key: string }).key);
    return y ?? reply.code(404).send({ error: 'unknown yoga' });
  });
  app.get('/divisionals', async () => DIVISIONALS);
  app.get('/divisionals/:n', async (req, reply) => {
    const d = DIVISIONAL_BY_N(Number((req.params as { n: string }).n));
    return d ?? reply.code(404).send({ error: 'unknown divisional' });
  });
  app.get('/karakas', async () => ({ chara: CHARA_KARAKAS, sthira: STHIRA_KARAKAS }));
  // Chara-karaka assignment (Ch 8): POST { longitudes: { sun, moon, …, rahu } } → AK..DK.
  app.post('/karakas/chara', async (req, reply) => {
    const b = req.body as { longitudes?: Partial<Record<Graha, number>> };
    if (!b?.longitudes) return reply.code(400).send({ error: 'longitudes { graha: sidereal degrees } required (Ketu ignored)' });
    return charaKarakas(b.longitudes);
  });
  app.get('/functional-nature', async () => FUNCTIONAL_NATURE);
  app.get('/functional-nature/:lagna', async (req) => functionalNatureFor(Number((req.params as { lagna: string }).lagna)));
  app.get('/transits', async () => TRANSIT_FROM_MOON);
  // Timing with Sodhya Pinda (25.6): rekhas (in the target house) × the planet's sodhya pinda →
  // the nakshatra/rasi where Saturn's transit troubles the matter and Jupiter's supports it.
  app.get('/transits/sodhya-timing', async (req, reply) => {
    const q = req.query as { rekhas?: string; pinda?: string };
    if (q.rekhas == null || q.pinda == null) return reply.code(400).send({ error: 'rekhas and pinda are required' });
    return { ...sodhyaPindaTiming(Number(q.rekhas), Number(q.pinda)), matters: SODHYA_PINDA_MATTERS };
  });
  app.get('/relationships', async () => NATURAL_RELATIONS);
  app.get('/dignities', async () => DIGNITIES);
  // Aspects & argalas (Ch 10). Compute what a planet/house aspects or intervenes on.
  app.get('/aspects/graha', async (req, reply) => {
    const q = req.query as { graha?: string; house?: string };
    if (!q.graha || q.house == null) return reply.code(400).send({ error: 'graha and house (1-12) are required' });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    return { graha: q.graha, house: Number(q.house), aspects: grahaAspectsFrom(q.graha as Graha, Number(q.house)) };
  });
  app.get('/aspects/rasi', async (req, reply) => {
    const q = req.query as { sign?: string };
    if (q.sign == null) return reply.code(400).send({ error: 'sign (0-11) is required' });
    return { sign: Number(q.sign), aspects: rasiDrishti(Number(q.sign)) };
  });
  app.get('/aspects/notes', async () => ASPECT_NOTES);
  app.get('/argala', async (req, reply) => {
    const q = req.query as { house?: string };
    if (q.house == null) return reply.code(400).send({ error: 'house (1-12) is required' });
    return { house: Number(q.house), argalas: argalaOn(Number(q.house)) };
  });
  // Divisional charts (Ch 6). Map a sidereal longitude to its sign in a varga.
  app.get('/varga', async (req, reply) => {
    const q = req.query as { longitude?: string; divisor?: string };
    const lon = qNum(q.longitude), d = qNum(q.divisor);
    if (lon == null || d == null) return reply.code(400).send({ error: 'longitude (0-360) and divisor are required (numeric)' });
    if (!(VARGA_DIVISORS as readonly number[]).includes(d)) return reply.code(400).send({ error: `divisor must be one of ${VARGA_DIVISORS.join(',')}` });
    return { longitude: lon, divisor: d, sign: vargaSign(lon, d) };
  });
  app.get('/vargas', async (req, reply) => {
    const q = req.query as { longitude?: string };
    if (q.longitude == null) return reply.code(400).send({ error: 'longitude (0-360) is required' });
    return { longitude: Number(q.longitude), vargas: allVargas(Number(q.longitude)) };
  });
  // Dwaadasa Vargeeya Bala (28.5): the D-1..D-12 strong-minus-weak count for a planet.
  app.get('/varga/dwadasa-bala', async (req, reply) => {
    const q = req.query as { graha?: string; longitude?: string };
    if (!q.graha || q.longitude == null) return reply.code(400).send({ error: 'graha and longitude (0-360) are required' });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    return { graha: q.graha, ...dwadasaVargeeyaBala(q.graha as Graha, Number(q.longitude)) };
  });

  // Narayana dasa (Ch 18) — rasi dasa progression, lengths, antardasas.
  app.get('/dasha/narayana/progression', async (req, reply) => {
    const q = req.query as { seed?: string; saturn?: string; ketu?: string };
    if (q.seed == null) return reply.code(400).send({ error: 'seed (0-11) required; optional saturn=true, ketu=true' });
    return { seed: Number(q.seed), progression: narayanaProgression(Number(q.seed), q.saturn === 'true', q.ketu === 'true') };
  });
  app.get('/dasha/narayana/length', async (req, reply) => {
    const q = req.query as { rasi?: string; lordSign?: string; exalted?: string; debilitated?: string };
    if (q.rasi == null || q.lordSign == null) return reply.code(400).send({ error: 'rasi and lordSign (0-11) required' });
    return { rasi: Number(q.rasi), years: narayanaDasaLength(Number(q.rasi), Number(q.lordSign), { exalted: q.exalted === 'true', debilitated: q.debilitated === 'true' }) };
  });
  app.get('/dasha/narayana/antardashas', async (req, reply) => {
    const q = req.query as { start?: string; years?: string };
    if (q.start == null || q.years == null) return reply.code(400).send({ error: 'start (0-11) and years required' });
    return { start: Number(q.start), antardashas: narayanaAntardashas(Number(q.start), Number(q.years)) };
  });

  // Rasi dasas (Ch 19 Kendradi, Ch 20 Sudasa, Ch 21 Drigdasa) — share Narayana lengths.
  app.get('/dasha/kendradi', async (req, reply) => {
    const q = req.query as { seed?: string; lagnaSign?: string; saturn?: string; ketu?: string };
    if (q.seed == null || q.lagnaSign == null) return reply.code(400).send({ error: 'seed and lagnaSign (0-11) required' });
    return { progression: lagnaKendradiDasa(Number(q.seed), Number(q.lagnaSign), q.saturn === 'true', q.ketu === 'true') };
  });
  app.get('/dasha/sudasa', async (req, reply) => {
    const q = req.query as { slSign?: string; slDegree?: string };
    if (q.slSign == null || q.slDegree == null) return reply.code(400).send({ error: 'slSign (0-11) and slDegree (0-30) required' });
    return sudasa(Number(q.slSign), Number(q.slDegree));
  });
  app.get('/dasha/drigdasa', async (req, reply) => {
    const q = req.query as { lagnaSign?: string };
    if (q.lagnaSign == null) return reply.code(400).send({ error: 'lagnaSign (0-11) required' });
    return { progression: drigdasa(Number(q.lagnaSign)) };
  });
  app.get('/dasha/kalachakra', async (req, reply) => {
    const q = req.query as { nak?: string; pada?: string };
    if (q.nak == null || q.pada == null) return reply.code(400).send({ error: 'nak (0-26) and pada (1-4) required' });
    return kalachakraPada(Number(q.nak), Number(q.pada));
  });
  app.get('/dasha/niryaana-shoola', async (req, reply) => {
    const q = req.query as { seed?: string };
    if (q.seed == null) return reply.code(400).send({ error: 'seed (0-11, stronger of 2nd/8th) required' });
    return { dasas: niryaanaShoolaDasa(Number(q.seed)) };
  });
  app.get('/dasha/shoola', async (req, reply) => {
    const q = req.query as { seed?: string; years?: string; antarSeed?: string };
    if (q.seed == null) return reply.code(400).send({ error: 'seed (0-11) required; optional years, antarSeed' });
    const years = q.years ? Number(q.years) : 9;
    const out: Record<string, unknown> = { dasas: shoolaDasa(Number(q.seed), years) };
    if (q.antarSeed != null) out.antardashas = shoolaAntardashas(Number(q.antarSeed), years);
    return out;
  });

  // Avasthas (Ch 15). Baladi (age) from longitude; Jagradi/Deeptadi from dignity.
  app.get('/avastha', async (req, reply) => {
    const q = req.query as { longitude?: string; dignity?: string };
    if (q.longitude == null) return reply.code(400).send({ error: 'longitude (0-360) is required; optional dignity=exalted|own|moolatrikona|friend|neutral|enemy|debilitated' });
    const out: Record<string, unknown> = { baladi: baladiAvastha(Number(q.longitude)) };
    if (q.dignity) {
      out.jagradi = jagradiAvastha(q.dignity as Dignity);
      out.deeptadi = deeptadiAvastha(q.dignity as Dignity);
    }
    return out;
  });

  // Longevity (Ch 14). Marakas (killer planets/houses) + the three-pairs range estimate.
  app.get('/longevity/marakas', async (req, reply) => {
    const q = req.query as { lagnaSign?: string };
    if (q.lagnaSign == null) return reply.code(400).send({ error: 'lagnaSign (0-11) is required' });
    return { marakaHouses: MARAKA_HOUSES, marakaLords: marakaLords(Number(q.lagnaSign)) };
  });
  // POST { pairs: [[signA,signB],[signC,signD],[signE,signF]] } → each pair's span + combined.
  app.post('/longevity/estimate', async (req, reply) => {
    const b = req.body as { pairs?: [number, number][] };
    if (!b?.pairs || b.pairs.length !== 3) return reply.code(400).send({ error: 'pairs: exactly 3 [signA,signB] pairs required' });
    const cats = b.pairs.map(([x, y]) => pairLongevity(signModality(x), signModality(y))) as [LifeSpan, LifeSpan, LifeSpan];
    const combined = combineThreePairs(cats);
    return { pairs: cats, combined, years: LONGEVITY_RANGES[combined] };
  });
  // Maheswara (14.3): lord of the special-8th from the Atmakaraka's sign. Also returns the
  // Rudra special-8th sign for the same input, so the whole "critical points" set is one call.
  app.get('/longevity/maheswara', async (req, reply) => {
    const q = req.query as { akSign?: string };
    if (q.akSign == null) return reply.code(400).send({ error: 'akSign (0-11, the sign the Atmakaraka occupies) is required' });
    const s = Number(q.akSign);
    return { akSign: s, maheswara: maheswara(s), rudra8thSign: rudra8thSign(s) };
  });

  // Tajaka annual-chart techniques (Ch 28) — muntha, harsha bala, the six aspects.
  app.get('/tajaka/muntha', async (req, reply) => {
    const q = req.query as { lagnaSign?: string; year?: string };
    if (q.lagnaSign == null || q.year == null) return reply.code(400).send({ error: 'lagnaSign (0-11) and year (year of life) required' });
    return { sign: muntha(Number(q.lagnaSign), Number(q.year)), houseMeanings: MUNTHA_IN_HOUSE };
  });
  app.get('/tajaka/harsha', async (req, reply) => {
    const q = req.query as { graha?: string; house?: string; exaltedOrOwn?: string; day?: string };
    if (!q.graha || q.house == null) return reply.code(400).send({ error: 'graha and house (1-12) required; optional exaltedOrOwn, day' });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    return { graha: q.graha, units: harshaBala(q.graha as Graha, Number(q.house), q.exaltedOrOwn === 'true', q.day === 'true') };
  });
  app.get('/tajaka/aspects', async () => ({ aspects: TAJAKA_ASPECTS, deeptamsa: DEEPTAMSA }));
  // Uchcha bala (28.4.2): closeness to deep exaltation, 0-20, from a sidereal longitude.
  app.get('/tajaka/uchcha-bala', async (req, reply) => {
    const q = req.query as { graha?: string; longitude?: string };
    if (!q.graha || q.longitude == null) return reply.code(400).send({ error: 'graha (a luminary/tara-graha) and longitude (0-360) required' });
    if (DEEP_EXALTATION[q.graha as ClassicalGraha] == null) return reply.code(404).send({ error: 'graha must be one of sun,moon,mars,mercury,jupiter,venus,saturn' });
    return { graha: q.graha, units: uchchaBala(q.graha as ClassicalGraha, Number(q.longitude)) };
  });
  // Hadda (Egyptian term) lord (28.4.3, Table 72) of a sign+degree.
  app.get('/tajaka/hadda', async (req, reply) => {
    const q = req.query as { sign?: string; degree?: string };
    if (q.sign == null || q.degree == null) return reply.code(400).send({ error: 'sign (0-11) and degree (0-30, within the sign) required' });
    return { sign: Number(q.sign), degree: Number(q.degree), lord: haddaLord(Number(q.sign), Number(q.degree)) };
  });
  // Sahams (28.8): a raw A−B+C point, or all tabled sahams from a context of longitudes.
  app.get('/tajaka/saham', async (req, reply) => {
    const q = req.query as { a?: string; b?: string; c?: string; day?: string; same?: string };
    if (q.a == null || q.b == null || q.c == null) return reply.code(400).send({ error: 'a, b, c (longitudes 0-360) required' });
    return { point: saham(Number(q.a), Number(q.b), Number(q.c), q.day !== 'false', q.same === 'true') };
  });
  app.post('/tajaka/sahams', async (req, reply) => {
    const b = req.body as { ctx?: SahamContext; day?: boolean };
    const need = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'lagna', 'lagnaLord'];
    if (!b?.ctx || need.some((k) => (b.ctx as Record<string, number>)[k] == null)) {
      return reply.code(400).send({ error: `ctx must include longitudes for: ${need.join(', ')}`, formulas: SAHAM_FORMULAS });
    }
    return computeSahams(b.ctx, b.day !== false);
  });
  // The seven bhava-based sahams (Table 74) — need cusp + house-lord + sign-lord longitudes.
  app.post('/tajaka/sahams-bhava', async (req, reply) => {
    const b = req.body as { ctx?: BhavaSahamContext; day?: boolean };
    const need = ['lagna', 'sun', 'moon', 'mars', 'saturn', 'h6', 'h8', 'h9', 'h11', 'h9lord', 'h11lord', 'sunSignLord', 'moonSignLord'];
    if (!b?.ctx || need.some((k) => (b.ctx as unknown as Record<string, number>)[k] == null)) {
      return reply.code(400).send({ error: `ctx must include longitudes for: ${need.join(', ')}`, formulas: BHAVA_SAHAM_FORMULAS });
    }
    return computeBhavaSahams(b.ctx, b.day !== false);
  });

  // Muhurta (Ch 36) — electional quality check + the per-task guidelines.
  app.get('/muhurta/guidelines', async () => MUHURTA_GUIDELINES);
  app.get('/muhurta', async (req, reply) => {
    const q = req.query as { task?: string; tithiDay?: string; weekday?: string; nakshatra?: string; janmaNak?: string };
    if (!q.task || q.tithiDay == null || q.weekday == null || q.nakshatra == null || q.janmaNak == null) {
      return reply.code(400).send({ error: 'task, tithiDay (1-15), weekday (0-6), nakshatra (0-26), janmaNak (0-26) required', tasks: Object.keys(MUHURTA_GUIDELINES) });
    }
    if (!MUHURTA_GUIDELINES[q.task]) return reply.code(404).send({ error: 'unknown task', tasks: Object.keys(MUHURTA_GUIDELINES) });
    return muhurtaCheck(q.task, Number(q.tithiDay), Number(q.weekday), Number(q.nakshatra), Number(q.janmaNak));
  });
  // Reference principles (Ch 32/33/35/37) — ethics, rational thinking, mundane, birthtime.
  app.get('/reference', async () => ({
    ethics: ETHICS_PRINCIPLES, rational: RATIONAL_PRINCIPLES,
    birthtimeRectification: BIRTHTIME_RECTIFICATION, mundane: MUNDANE_PRINCIPLES,
  }));

  // Sudarsana Chakra dasa (Ch 31) — one house per solar year, from lagna/Moon/Sun.
  app.get('/dasha/sudarsana', async (req, reply) => {
    const q = req.query as { refSign?: string; year?: string };
    if (q.refSign == null || q.year == null) return reply.code(400).send({ error: 'refSign (0-11) and year (year of life) required' });
    return sudarsanaDasa(Number(q.refSign), Number(q.year));
  });
  app.get('/dasha/sudarsana/all', async (req, reply) => {
    const q = req.query as { lagna?: string; moon?: string; sun?: string; year?: string };
    if (q.lagna == null || q.moon == null || q.sun == null || q.year == null) return reply.code(400).send({ error: 'lagna, moon, sun (0-11) and year required' });
    return sudarsanaAllRefs(Number(q.lagna), Number(q.moon), Number(q.sun), Number(q.year));
  });

  // Mudda / Varsha Vimsottari dasa (Ch 30) — Vimsottari compressed to the solar-return year.
  app.get('/dasha/mudda', async (req, reply) => {
    const q = req.query as { moonLong?: string; completedYears?: string };
    if (q.moonLong == null || q.completedYears == null) return reply.code(400).send({ error: 'moonLong (0-360) and completedYears required' });
    return muddaDasa(Number(q.moonLong), Number(q.completedYears));
  });
  // Patyayini dasa (30.3): POST { longitudes:{ sun..saturn, lagna } } → the year split by patyamsa,
  // plus each dasa's antardasas. Only the seven planets + lagna take part.
  app.post('/dasha/patyayini', async (req, reply) => {
    const b = req.body as { longitudes?: Partial<Record<PatyayiniToken, number>> };
    const need: PatyayiniToken[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'lagna'];
    if (!b?.longitudes || need.some((k) => b.longitudes![k] == null)) {
      return reply.code(400).send({ error: `longitudes must include all of: ${need.join(', ')} (each 0-360)` });
    }
    const spans = patyayiniDasa(b.longitudes as Record<PatyayiniToken, number>);
    return { dasas: spans.map((s) => ({ ...s, antardasas: patyayiniAntardasas(spans, s.lord) })) };
  });
  // Varsha Narayana dasa (30.5): the annual chart's Narayana dasa — muntha as lagna, then Narayana
  // from the strength-based seed. GET ?natalLagnaSign=&yearNumber=&seedSign=&hasSaturn=&hasKetu=
  app.get('/dasha/varsha-narayana', async (req, reply) => {
    const q = req.query as { natalLagnaSign?: string; yearNumber?: string; seedSign?: string; hasSaturn?: string; hasKetu?: string };
    if (q.natalLagnaSign == null || q.yearNumber == null || q.seedSign == null) {
      return reply.code(400).send({ error: 'natalLagnaSign (0-11), yearNumber (year of life), seedSign (0-11) required; optional hasSaturn, hasKetu' });
    }
    return varshaNarayanaDasa(Number(q.natalLagnaSign), Number(q.yearNumber), Number(q.seedSign), {
      hasSaturn: q.hasSaturn === 'true', hasKetu: q.hasKetu === 'true',
    });
  });

  // Tajaka yogas (Ch 29) — ithasala/eesarpha + house-distribution yogas.
  app.get('/tajaka/ithasala', async (req, reply) => {
    const q = req.query as { pa?: string; degA?: string; pb?: string; degB?: string };
    if (!q.pa || q.degA == null || !q.pb || q.degB == null) return reply.code(400).send({ error: 'pa, degA, pb, degB required (planets aspecting)' });
    if (!GRAHAS[q.pa] || !GRAHAS[q.pb]) return reply.code(404).send({ error: 'unknown graha' });
    return ithasala(q.pa as Graha, Number(q.degA), q.pb as Graha, Number(q.degB));
  });
  app.get('/tajaka/distribution-yoga', async (req, reply) => {
    const q = req.query as { houses?: string };
    if (!q.houses) return reply.code(400).send({ error: 'houses=comma,separated occupied houses (1-12)' });
    const houses = q.houses.split(',').map(Number);
    return { ishkavala: ishkavala(houses), induvara: induvara(houses) };
  });
  app.get('/tajaka/yogas', async () => TAJAKA_YOGAS);

  // Transit taras & special nakshatras (Ch 26) — all counted from the janma nakshatra.
  app.get('/transit/tara', async (req, reply) => {
    const q = req.query as { janmaNak?: string; transitNak?: string };
    if (q.janmaNak == null || q.transitNak == null) return reply.code(400).send({ error: 'janmaNak and transitNak (0-26) required' });
    return taraOf(Number(q.janmaNak), Number(q.transitNak));
  });
  app.get('/transit/special-nakshatras', async (req, reply) => {
    const q = req.query as { janmaNak?: string };
    if (q.janmaNak == null) return reply.code(400).send({ error: 'janmaNak (0-26) required' });
    const jn = Number(q.janmaNak);
    return Object.fromEntries(Object.keys(SPECIAL_NAKSHATRAS).map((k) =>
      [k, { nakshatra: specialNakshatra(jn, k as keyof typeof SPECIAL_NAKSHATRAS), shows: SPECIAL_NAKSHATRAS[k as keyof typeof SPECIAL_NAKSHATRAS]!.shows }]));
  });
  app.get('/transit/vedha', async (req, reply) => {
    const q = req.query as { graha?: string; house?: string };
    if (!q.graha || q.house == null) return reply.code(400).send({ error: 'graha and house (favourable transit house 1-12) required', table: VEDHA_STHAANA });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    return { graha: q.graha, favourableHouse: Number(q.house), vedhaHouse: vedhaHouse(q.graha as Graha, Number(q.house)) };
  });
  app.get('/transit/murthi', async (req, reply) => {
    const q = req.query as { house?: string };
    if (q.house == null) return reply.code(400).send({ error: 'house (1-12): transit Moon from natal Moon when the planet enters the rasi' });
    return murthiOf(Number(q.house));
  });
  app.get('/transit/latta', async (req, reply) => {
    const q = req.query as { graha?: string; nak?: string };
    if (!q.graha || q.nak == null) return reply.code(400).send({ error: 'graha and nak (0-26, transit nakshatra) required' });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    return { graha: q.graha, transitNak: Number(q.nak), latta: lattaNakshatra(q.graha as Graha, Number(q.nak)) };
  });
  app.get('/transit/nakshatra-aspects', async (req, reply) => {
    const q = req.query as { graha?: string; nak?: string };
    if (!q.graha || q.nak == null) return reply.code(400).send({ error: 'graha and nak (0-26) required' });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    return { graha: q.graha, nak: Number(q.nak), aspects: nakshatraAspectsFrom(q.graha as Graha, Number(q.nak)) };
  });

  // Dasa systems (Ch 16 Vimsottari, Ch 17 Ashtottari) — birth balance + antardasas.
  app.get('/dasha/vimshottari', async (req, reply) => {
    const q = req.query as { moonLong?: string };
    if (q.moonLong == null) return reply.code(400).send({ error: 'moonLong (0-360) is required' });
    const balance = dashaBalanceAtBirth(Number(q.moonLong));
    return { system: 'vimshottari', totalYears: 120, balance, mahaYears: VIMSHOTTARI_YEARS, antardashas: antardashas(balance.lord) };
  });
  // Recursive Vimsottari subdivision to any depth (antardasa=1 … pratyantardasa=2 … deha=5).
  app.get('/dasha/vimshottari/subdivide', async (req, reply) => {
    const q = req.query as { lord?: string; years?: string; depth?: string };
    if (!q.lord || q.years == null) return reply.code(400).send({ error: 'lord and years required; optional depth (1=antardasa..5=deha, default 2)' });
    if (!GRAHAS[q.lord]) return reply.code(404).send({ error: 'unknown graha' });
    const depth = Math.max(0, Math.min(5, q.depth == null ? 2 : Number(q.depth)));
    return { levels: DASHA_LEVELS, tree: subdivideDasha(q.lord as Graha, Number(q.years), depth) };
  });
  app.get('/dasha/ashtottari', async (req, reply) => {
    const q = req.query as { moonLong?: string };
    if (q.moonLong == null) return reply.code(400).send({ error: 'moonLong (0-360) is required' });
    const balance = ashtottariBalanceAtBirth(Number(q.moonLong));
    return { system: 'ashtottari', totalYears: 108, balance, antardashas: ashtottariAntardashas(balance.lord) };
  });

  // Panchanga (Ch 1). Tithi + nitya-yoga + karana from Sun/Moon longitudes; hora lord.
  app.get('/panchanga', async (req, reply) => {
    const q = req.query as { sunLong?: string; moonLong?: string };
    if (q.sunLong == null || q.moonLong == null) return reply.code(400).send({ error: 'sunLong and moonLong (0-360) are required' });
    return panchanga(Number(q.sunLong), Number(q.moonLong));
  });
  app.get('/hora', async (req, reply) => {
    const q = req.query as { weekday?: string; hora?: string };
    if (q.weekday == null || q.hora == null) return reply.code(400).send({ error: 'weekday (0=Sun..6=Sat) and hora (1-24) are required' });
    return { weekday: Number(q.weekday), hora: Number(q.hora), lord: horaLord(Number(q.weekday), Number(q.hora)) };
  });
  // Matter tithi (26.8) — a tithi advancing `speed`× as fast (karma=10, dhana=2), for Sarvatobhadra.
  app.get('/matter-tithi', async (req, reply) => {
    const q = req.query as { sunLong?: string; moonLong?: string; speed?: string };
    const sunLong = qNum(q.sunLong), moonLong = qNum(q.moonLong);
    if (sunLong == null || moonLong == null) return reply.code(400).send({ error: 'sunLong and moonLong (0-360) required (numeric); optional speed (default 1; karma 10, dhana 2)' });
    const speed = q.speed == null ? 1 : (qNum(q.speed) ?? NaN);
    if (!Number.isFinite(speed)) return reply.code(400).send({ error: 'speed must be numeric' });
    const index = matterTithi(sunLong, moonLong, speed);
    return { speed, index, panchaka: tithiPanchaka(index) };
  });

  // Ashtakavarga (Ch 12). POST the 8 reference signs → BAV per planet + SAV (+ 337 total).
  app.post('/ashtakavarga', async (req, reply) => {
    const b = req.body as { signs?: Partial<RefSigns> };
    const need = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'asc'];
    if (!b?.signs || need.some((k) => b.signs![k as keyof RefSigns] == null)) {
      return reply.code(400).send({ error: `signs must include all of: ${need.join(', ')} (each 0-11)` });
    }
    return ashtakavarga(b.signs as RefSigns);
  });
  // Sodhita Ashtakavarga + Sodhya Pinda per planet (12.7). Same 8 reference signs: BAV, then
  // trikona + ekadhipatya reduction (occupancy = the 7 planets' signs), then the pinda.
  app.post('/ashtakavarga/sodhya', async (req, reply) => {
    const b = req.body as { signs?: Partial<RefSigns> };
    const need = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'asc'];
    if (!b?.signs || need.some((k) => b.signs![k as keyof RefSigns] == null)) {
      return reply.code(400).send({ error: `signs must include all of: ${need.join(', ')} (each 0-11)` });
    }
    const refs = b.signs as RefSigns;
    const planetSigns = Object.fromEntries(AV_PLANETS.map((p) => [p, refs[p]])) as Record<AVPlanet, number>;
    const occupied = AV_PLANETS.map((p) => refs[p]);
    const out = {} as Record<AVPlanet, { soav: number[]; rasiPinda: number; grahaPinda: number; sodhyaPinda: number }>;
    for (const p of AV_PLANETS) {
      const soav = sodhitaAshtakavarga(bhinnashtakavarga(p, refs), occupied);
      out[p] = { soav, ...sodhyaPinda(soav, planetSigns) };
    }
    return out;
  });

  // Upagrahas (Ch 4). Sun-based longitudes + time-based part-lords / rising fraction.
  app.get('/upagrahas/sun', async (req, reply) => {
    const q = req.query as { sunLong?: string };
    if (q.sunLong == null) return reply.code(400).send({ error: 'sunLong (0-360) is required' });
    return sunUpagrahas(Number(q.sunLong));
  });
  app.get('/upagrahas/parts', async (req, reply) => {
    const q = req.query as { weekday?: string; day?: string };
    if (q.weekday == null) return reply.code(400).send({ error: 'weekday (0=Sun..6=Sat) is required; day=true|false' });
    return { weekday: Number(q.weekday), isDay: q.day !== 'false', parts: partLords(Number(q.weekday), q.day !== 'false') };
  });
  app.get('/upagrahas/fraction', async (req, reply) => {
    const q = req.query as { weekday?: string; day?: string; name?: string };
    if (q.weekday == null || !q.name) return reply.code(400).send({ error: `weekday and name required; name one of ${Object.keys(UPAGRAHA_PART).join(',')}` });
    return { name: q.name, fraction: upagrahaFraction(Number(q.weekday), q.day !== 'false', q.name) };
  });

  // Special lagnas (Ch 5) — Bhava/Hora/Ghati (from sunrise) + Sree (from Moon fraction).
  app.get('/lagnas/special', async (req, reply) => {
    const q = req.query as Record<string, string>;
    const need = ['sunLongSunrise', 'minutesSinceSunrise', 'moonLong', 'lagnaLong'];
    if (need.some((k) => q[k] == null)) return reply.code(400).send({ error: `required: ${need.join(', ')}`, use: SPECIAL_LAGNA_USE });
    return specialLagnas(Number(q.sunLongSunrise), Number(q.minutesSinceSunrise), Number(q.moonLong), Number(q.lagnaLong));
  });

  // Arudha padas (Ch 9). POST the lagna sign + each planet's sign; get all 12 arudhas.
  app.get('/arudhas/names', async () => ARUDHA_NAMES);
  // Graha arudhas (Ch 9.5): POST each planet's sign (+ optional stronger owned sign for duals).
  app.post('/arudhas/graha', async (req, reply) => {
    const b = req.body as { signs?: Record<string, number>; strongerOwned?: Record<string, number> };
    if (!b?.signs) return reply.code(400).send({ error: 'signs { graha: signIndex } required; optional strongerOwned { graha: signIndex } for dual-lords', ownSigns: OWN_SIGNS });
    return grahaArudhas(
      (g) => b.signs![g] ?? 0,
      (g, owned) => b.strongerOwned?.[g] ?? owned[0]!,
    );
  });
  app.post('/arudhas', async (req, reply) => {
    const b = req.body as { lagnaSign?: number; signs?: Record<string, number> };
    if (b?.lagnaSign == null || !b.signs) {
      return reply.code(400).send({ error: 'lagnaSign (0-11) and signs { graha: signIndex } are required' });
    }
    const signOf = (g: Graha) => b.signs![g] ?? 0;
    return arudhaTable(b.lagnaSign, signOf);
  });
  // Classify a planet's dignity in a sign (0=Aries): exalted/debilitated/moolatrikona/own/friend/neutral/enemy.
  app.get('/classify', async (req, reply) => {
    const q = req.query as { graha?: string; sign?: string };
    if (!q.graha || q.sign == null) return reply.code(400).send({ error: 'graha and sign (0-11) are required' });
    if (!GRAHAS[q.graha]) return reply.code(404).send({ error: 'unknown graha' });
    const sign = Number(q.sign);
    return { graha: q.graha, sign, dignity: classifyDignity(q.graha as Graha, sign) };
  });
  // Only behavioural remedies are surfaced for recommendation (SPEC §11.4);
  // gemstone/deity fields are reference-only and the mentor must never recommend them.
  app.get('/remedies', async () => REMEDIES);

  // search
  app.get('/search', async (req) => {
    const q = (req.query as { q?: string }).q ?? '';
    return { query: q, hits: search(q) };
  });

  // interpretation
  app.post('/interpret', async (req, reply) => {
    const body = req.body as Partial<Placement>;
    if (!body?.graha || body.house == null || body.sign == null) {
      return reply.code(400).send({ error: 'graha, house (1-12) and sign (0-11) are required' });
    }
    // If the client didn't supply dignity, derive it from graha+sign so the tone is accurate.
    const dignity = body.dignity ?? classifyDignity(body.graha, body.sign);
    return interpretPlacement({ ...(body as Placement), dignity });
  });
  app.post('/interpret/lagna-lord', async (req, reply) => {
    const b = req.body as { lord?: Graha; house?: number; sign?: number };
    if (!b?.lord || b.house == null || b.sign == null) {
      return reply.code(400).send({ error: 'lord, house and sign are required' });
    }
    return interpretLagnaLord(b.lord, b.house, b.sign);
  });
  // The whole "blueprint kundali" reading from computed positions. POST { lagnaSign, planets:{
  // sun:{sign,house,longitude,retrograde?,combust?}, … all 9 } } → house-by-house interpretation,
  // lagna lord, Jaimini karakas, chart shape, and raaja/vipareeta yogas.
  app.post('/kundali', async (req, reply) => {
    const b = req.body as Partial<KundaliInput>;
    const intInRange = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
    const finiteInRange = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
    if (!intInRange(b?.lagnaSign, 0, 11) || !b.planets) return reply.code(400).send({ error: 'lagnaSign must be an integer 0-11 and planets are required' });
    const bad = KUNDALI_NINE.find((g) => {
      const p = b.planets![g];
      return !p || !intInRange(p.sign, 0, 11) || !intInRange(p.house, 1, 12) || !finiteInRange(p.longitude, 0, 360);
    });
    if (bad) return reply.code(400).send({ error: `planets.${bad} must have sign (integer 0-11), house (integer 1-12) and longitude (0-360)` });
    return buildKundaliReading(b as KundaliInput);
  });

  return app;
}

// Start only when run directly (not when imported by tests).
if (process.env.AURA_NO_LISTEN !== '1' && !process.env.VITEST) {
  const port = Number(process.env.PORT ?? 8787);
  buildServer()
    .listen({ port, host: '0.0.0.0' })
    .then(() => console.log(`aura knowledge API on http://localhost:${port}`))
    .catch((e) => { console.error(e); process.exit(1); });
}
