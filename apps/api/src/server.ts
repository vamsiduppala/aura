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
  FUNCTIONAL_NATURE, functionalNatureFor,
  getGraha, getRasi, getBhava, getNakshatra, search,
  interpretPlacement, interpretLagnaLord,
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
    return interpretPlacement(body as Placement);
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
