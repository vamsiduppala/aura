// Knowledge lookup for the Cosmic Mentor. Bridges the chat to @aura/knowledge (the
// encoded book) + the user's real chart, so the mentor can ground "what does X mean?"
// and "why am I like this in <area>?" in real rules + real placements instead of
// inventing astrology. Pure + deterministic — unit-tested without the LLM.
import type { Chart, Graha, LifeArea } from '@aura/engine';
import { AREA_TO_HOUSE, AREA_META, SIGN_LORD } from '@aura/engine';
import { search, getRasi } from '@aura/knowledge';
import { buildKundali, dignityChip } from '../kundali';
import { grahaLabel } from '../ui';
import { API_BASE } from './api';

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

/** Look up grounded astrology facts + (optionally) the user's real placements for an area. */
export function lookupAstrology(query: string, chart: Chart, area?: LifeArea): AstroLookup {
  const concepts = search(query).slice(0, 5).map((h) => ({ label: h.label, summary: h.summary }));

  if (!area) return { query, concepts };

  const k = buildKundali(chart);
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
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json() as { hits?: { label: string; summary: string }[] };
      const concepts = (data.hits ?? []).slice(0, 5).map((h) => ({ label: h.label, summary: h.summary }));
      if (concepts.length) return { ...base, concepts };
    }
  } catch { /* API down → keep the bundled concepts */ }
  return base;
}
