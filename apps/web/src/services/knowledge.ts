// Knowledge lookup for the Cosmic Mentor. Bridges the chat to @aura/knowledge (the
// encoded book) + the user's real chart, so the mentor can ground "what does X mean?"
// and "why am I like this in <area>?" in real rules + real placements instead of
// inventing astrology. Pure + deterministic — unit-tested without the LLM.
import type { Chart, Graha, LifeArea } from '@aura/engine';
import { AREA_TO_HOUSE, AREA_META, SIGN_LORD } from '@aura/engine';
import { search, getRasi, rajaYogas, vipareetaYoga, type PlanetSigns } from '@aura/knowledge';
import { buildKundali, dignityChip } from '../kundali';
import { grahaLabel } from '../ui';
import { apiBase } from './api';

const ALL_GRAHAS: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

export interface AstroPlacement {
  planet: string;
  house: number;
  sign: string;
  dignity: string;   // human chip ("at home", "exalted · at its best"…) or ''
  meaning: string;
}
export interface AstroLookup {
  query: string;
  /** Top grounded facts from the encoded book (grahas/rasis/houses/nakshatras/yogas). */
  concepts: { label: string; summary: string }[];
  /** Chart-level "signatures" the user actually has — soul/partner planet, shape, raja/vipareeta
   *  yogas — so the mentor can answer "what's special about my chart?" from real data, not a guess. */
  signatures: { label: string; detail: string }[];
  /** The user's real chart, focused on the asked-about life area (if one was given). */
  chart?: {
    area: string;
    lagnaSign: string;
    lagnaLord: string;
    lagnaLordMeaning: string;
    /** Planets sitting in that area's house, interpreted; plus the area's ruler. */
    placements: AstroPlacement[];
  };
}

/** The notable chart-wide combinations the user actually has (Jaimini karakas, shape, raja yogas). */
function chartSignatures(chart: Chart, k: ReturnType<typeof buildKundali>): { label: string; detail: string }[] {
  const out: { label: string; detail: string }[] = [];
  out.push({ label: 'Soul & partner planets', detail: `Your Atmakaraka (soul planet) is ${grahaLabel(k.atmakaraka)}; your Darakaraka (partner planet) is ${grahaLabel(k.darakaraka)}.` });
  out.push({ label: 'Chart shape', detail: `${k.shape.name} (${k.shape.means}): ${k.shape.effect}` });

  const signs = Object.fromEntries(ALL_GRAHAS.map((g) => [g, chart.planets[g].sign])) as PlanetSigns;
  const raja = rajaYogas(chart.lagnaSign, signs);
  if (raja.some((r) => r.dharmaKarmadhipati)) {
    out.push({ label: 'Dharma-Karmadhipati raja yoga', detail: 'The lords of your 9th (calling/luck) and 10th (work) are linked — your sense of purpose and your work pull the same way, and standing tends to follow when you act on what you believe is right.' });
  } else if (raja.length) {
    out.push({ label: 'Raja yoga', detail: 'A kendra (angle) lord is linked with a trikona (trine) lord — a real capacity to rise when capability and opportunity line up.' });
  }
  if (vipareetaYoga(chart.lagnaSign, signs).present) {
    out.push({ label: 'Vipareeta raja yoga', detail: 'Difficulty tends to flip into advantage for you — you often win precisely where the odds looked worst, usually after an initial struggle.' });
  }
  return out;
}

/** Look up grounded astrology facts + (optionally) the user's real placements for an area. */
export function lookupAstrology(query: string, chart: Chart, area?: LifeArea): AstroLookup {
  const concepts = search(query).slice(0, 5).map((h) => ({ label: h.label, summary: h.summary }));
  const k = buildKundali(chart);
  const signatures = chartSignatures(chart, k);

  if (!area) return { query, concepts, signatures };

  const house = AREA_TO_HOUSE[area];
  const occupants = k.rows.filter((r) => r.house === house);

  // The area's ruler = the lord of the sign on that house (whole-sign from the lagna).
  const houseSignIndex = (chart.lagnaSign + (house - 1)) % 12;
  const ruler: Graha = SIGN_LORD[houseSignIndex]!;
  const rulerRow = k.rows.find((r) => r.graha === ruler);

  const toPlacement = (r: (typeof k.rows)[number]): AstroPlacement => ({
    planet: grahaLabel(r.graha), house: r.house, sign: r.signName,
    dignity: dignityChip(r.dignity), meaning: r.text,
  });

  const placements: AstroPlacement[] = [
    ...occupants.map(toPlacement),
    // include the ruler if it isn't already listed as an occupant
    ...(rulerRow && !occupants.some((o) => o.graha === ruler) ? [toPlacement(rulerRow)] : []),
  ];

  return {
    query,
    concepts,
    signatures,
    chart: {
      area: AREA_META[area].label,
      lagnaSign: getRasi(chart.lagnaSign).english,
      lagnaLord: grahaLabel(k.lagnaLord),
      lagnaLordMeaning: k.lagnaLordText,
      placements,
    },
  };
}

/**
 * Same as lookupAstrology, but grounds the concept facts from the live aura API
 * (`/search`) when the local server is running — so the Mentor's book lookups come
 * straight off the backend. The real-chart placements stay client-side. Falls back to the
 * bundled knowledge when the API is unreachable (identical data either way).
 */
export async function lookupAstrologyLive(query: string, chart: Chart, area?: LifeArea): Promise<AstroLookup> {
  const base = lookupAstrology(query, chart, area);
  try {
    const res = await fetch(`${apiBase()}/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as { hits?: { label: string; summary: string }[] };
      const concepts = (data.hits ?? []).slice(0, 5).map((h) => ({ label: h.label, summary: h.summary }));
      if (concepts.length) return { ...base, concepts };
    }
  } catch { /* API down → keep the bundled concepts */ }
  return base;
}
