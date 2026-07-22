// ─────────────────────────────────────────────────────────────────────────────
// @aura/api — local Vedic-astrology knowledge service. Serves @aura/knowledge over
// HTTP so the Cosmic Mentor (or any client) can query rules + interpretations.
// Local-only, open, no auth (per the brief). CORS is wide-open for local dev.
// Run: npm --workspace @aura/api run start   (default http://localhost:8787)
// ─────────────────────────────────────────────────────────────────────────────

import Fastify from 'fastify';
import {
  GRAHAS, RASIS, BHAVAS, NAKSHATRAS, YOGAS, YOGA_BY_KEY,
  DIVISIONALS, DIVISIONAL_BY_N, CHARA_KARAKAS, STHIRA_KARAKAS,
  FUNCTIONAL_NATURE, functionalNatureFor, TRANSIT_FROM_MOON, NATURAL_RELATIONS, REMEDIES,
  getGraha, getRasi, getBhava, getNakshatra, search,
  interpretPlacement, interpretLagnaLord, classifyDignity, DIGNITIES,
  grahaAspectsFrom, rasiDrishti, argalaOn, ASPECT_NOTES,
  arudhaTable, ARUDHA_NAMES,
  vargaSign, allVargas, VARGA_DIVISORS,
  specialLagnas, SPECIAL_LAGNA_USE,
  sunUpagrahas, partLords, upagrahaFraction, UPAGRAHA_PART,
  ashtakavarga, type RefSigns,
  panchanga, horaLord,
  dashaBalanceAtBirth, antardashas, VIMSHOTTARI_YEARS,
  ashtottariBalanceAtBirth, ashtottariAntardashas,
  marakaLords, MARAKA_HOUSES, signModality, pairLongevity, combineThreePairs, LONGEVITY_RANGES,
  type LifeSpan,
  baladiAvastha, jagradiAvastha, deeptadiAvastha,
  narayanaProgression, narayanaDasaLength, narayanaAntardashas,
  type Graha, type Placement,
} from '@aura/knowledge';

type Dignity = Parameters<typeof jagradiAvastha>[0];

export function buildServer() {
  const app = Fastify({ logger: false });

  // wide-open CORS for local use
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') reply.send();
  });

  app.get('/health', async () => ({ ok: true, service: 'aura-knowledge', version: '0.1.0' }));

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
  app.get('/functional-nature', async () => FUNCTIONAL_NATURE);
  app.get('/functional-nature/:lagna', async (req) => functionalNatureFor(Number((req.params as { lagna: string }).lagna)));
  app.get('/transits', async () => TRANSIT_FROM_MOON);
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
    if (q.longitude == null || q.divisor == null) return reply.code(400).send({ error: 'longitude (0-360) and divisor are required' });
    const d = Number(q.divisor);
    if (!(VARGA_DIVISORS as readonly number[]).includes(d)) return reply.code(400).send({ error: `divisor must be one of ${VARGA_DIVISORS.join(',')}` });
    return { longitude: Number(q.longitude), divisor: d, sign: vargaSign(Number(q.longitude), d) };
  });
  app.get('/vargas', async (req, reply) => {
    const q = req.query as { longitude?: string };
    if (q.longitude == null) return reply.code(400).send({ error: 'longitude (0-360) is required' });
    return { longitude: Number(q.longitude), vargas: allVargas(Number(q.longitude)) };
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

  // Dasa systems (Ch 16 Vimsottari, Ch 17 Ashtottari) — birth balance + antardasas.
  app.get('/dasha/vimshottari', async (req, reply) => {
    const q = req.query as { moonLong?: string };
    if (q.moonLong == null) return reply.code(400).send({ error: 'moonLong (0-360) is required' });
    const balance = dashaBalanceAtBirth(Number(q.moonLong));
    return { system: 'vimshottari', totalYears: 120, balance, mahaYears: VIMSHOTTARI_YEARS, antardashas: antardashas(balance.lord) };
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

  // Ashtakavarga (Ch 12). POST the 8 reference signs → BAV per planet + SAV (+ 337 total).
  app.post('/ashtakavarga', async (req, reply) => {
    const b = req.body as { signs?: Partial<RefSigns> };
    const need = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'asc'];
    if (!b?.signs || need.some((k) => b.signs![k as keyof RefSigns] == null)) {
      return reply.code(400).send({ error: `signs must include all of: ${need.join(', ')} (each 0-11)` });
    }
    return ashtakavarga(b.signs as RefSigns);
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

  return app;
}

// Start when run directly.
const port = Number(process.env.PORT ?? 8787);
buildServer()
  .listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`aura knowledge API on http://localhost:${port}`))
  .catch((e) => { console.error(e); process.exit(1); });
