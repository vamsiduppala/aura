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
  type Graha, type Placement,
} from '@aura/knowledge';

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
