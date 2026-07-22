// Live timing-systems data for the deep chart. Fetches from the local aura API
// (apps/api) when it's running, and falls back to computing the same values in-browser
// via @aura/knowledge so the feature always works offline. Same maths either way.
import type { Chart, Graha } from '@aura/engine';
import {
  dashaBalanceAtBirth, ashtottariBalanceAtBirth, narayanaProgression,
  getRasi, type DashaBalance, type AshtottariBalance,
} from '@aura/knowledge';
import { API_BASE } from './api';

export interface DashaSnapshot {
  source: 'server' | 'on-device';
  vimshottari: { lord: Graha; yearsLeft: number };
  ashtottari: { lord: Graha; yearsLeft: number };
  /** Narayana rasi-dasa order from the rising sign (sign indices, 0..11). */
  narayana: number[];
  narayanaNames: string[];
}

function local(chart: Chart): DashaSnapshot {
  const moonLong = chart.planets.moon.siderealLong;
  const v: DashaBalance = dashaBalanceAtBirth(moonLong);
  const a: AshtottariBalance = ashtottariBalanceAtBirth(moonLong);
  const narayana = narayanaProgression(chart.lagnaSign);
  return {
    source: 'on-device',
    vimshottari: { lord: v.lord, yearsLeft: v.yearsLeft },
    ashtottari: { lord: a.lord, yearsLeft: a.yearsLeft },
    narayana,
    narayanaNames: narayana.map((s) => getRasi(s).english),
  };
}

/** Load the dasha snapshot — from the API if reachable, else computed locally. */
export async function loadChartDashas(chart: Chart): Promise<DashaSnapshot> {
  const moonLong = chart.planets.moon.siderealLong;
  try {
    const opts = { signal: AbortSignal.timeout(1500) };
    const [v, a] = await Promise.all([
      fetch(`${API_BASE}/dasha/vimshottari?moonLong=${moonLong}`, opts).then((r) => r.json()),
      fetch(`${API_BASE}/dasha/ashtottari?moonLong=${moonLong}`, opts).then((r) => r.json()),
    ]);
    if (!v?.balance?.lord || !a?.balance?.lord) throw new Error('bad response');
    const narayana = narayanaProgression(chart.lagnaSign);
    return {
      source: 'server',
      vimshottari: { lord: v.balance.lord, yearsLeft: v.balance.yearsLeft },
      ashtottari: { lord: a.balance.lord, yearsLeft: a.balance.yearsLeft },
      narayana,
      narayanaNames: narayana.map((s) => getRasi(s).english),
    };
  } catch {
    return local(chart);
  }
}
