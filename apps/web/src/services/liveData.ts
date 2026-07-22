// Live timing-systems data for the deep chart. Fetches natal balances from the local aura
// API (apps/api) when it's running, and falls back to computing the same values in-browser
// via @aura/knowledge so the feature always works offline. The "current period" is walked
// from the birth date on-device (the API's natal balance + the year-length maths).
import type { Chart, Graha } from '@aura/engine';
import {
  dashaBalanceAtBirth, ashtottariBalanceAtBirth, narayanaProgression, getRasi,
  VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS, ASHTOTTARI_ORDER, ASHTOTTARI_YEARS,
  type DashaBalance, type AshtottariBalance,
} from '@aura/knowledge';
import { API_BASE } from './api';

const YEAR_MS = 365.25 * 86_400_000;

export interface CurrentPeriod { lord: Graha; pct: number }
export interface DashaSnapshot {
  source: 'server' | 'on-device';
  vimshottari: { lord: Graha; yearsLeft: number };
  ashtottari: { lord: Graha; yearsLeft: number };
  vimshottariNow: CurrentPeriod;
  ashtottariNow: CurrentPeriod;
  narayana: number[];
  narayanaNames: string[];
}

/** Walk a cyclic dasa sequence from the birth balance to `elapsedYears`, returning the running period. */
function currentPeriod(order: Graha[], years: Record<Graha, number>, startLord: Graha, firstRemaining: number, elapsedYears: number): CurrentPeriod {
  const startIdx = order.indexOf(startLord);
  const firstFull = years[startLord];
  if (elapsedYears < firstRemaining) {
    const into = firstFull - firstRemaining + elapsedYears;
    return { lord: startLord, pct: Math.min(100, Math.max(0, (into / firstFull) * 100)) };
  }
  let t = firstRemaining;
  for (let i = 1; i < 400; i++) {
    const lord = order[(startIdx + i) % order.length]!;
    const len = years[lord];
    if (len > 0 && elapsedYears < t + len) return { lord, pct: ((elapsedYears - t) / len) * 100 };
    t += len;
  }
  return { lord: startLord, pct: 0 };
}

function elapsedYears(chart: Chart): number {
  const b = new Date(`${chart.birth.date}T${chart.birth.time ?? '12:00'}:00`).getTime();
  return Math.max(0, (Date.now() - b) / YEAR_MS);
}

function withCurrent(chart: Chart, v: { lord: Graha; yearsLeft: number }, a: { lord: Graha; yearsLeft: number }, source: DashaSnapshot['source']): DashaSnapshot {
  const e = elapsedYears(chart);
  const narayana = narayanaProgression(chart.lagnaSign);
  return {
    source,
    vimshottari: v,
    ashtottari: a,
    vimshottariNow: currentPeriod(VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS, v.lord, v.yearsLeft, e),
    ashtottariNow: currentPeriod(ASHTOTTARI_ORDER, ASHTOTTARI_YEARS, a.lord, a.yearsLeft, e),
    narayana,
    narayanaNames: narayana.map((s) => getRasi(s).english),
  };
}

function local(chart: Chart): DashaSnapshot {
  const moonLong = chart.planets.moon.siderealLong;
  const v: DashaBalance = dashaBalanceAtBirth(moonLong);
  const a: AshtottariBalance = ashtottariBalanceAtBirth(moonLong);
  return withCurrent(chart, { lord: v.lord, yearsLeft: v.yearsLeft }, { lord: a.lord, yearsLeft: a.yearsLeft }, 'on-device');
}

/** Load the dasha snapshot — natal balances from the API if reachable, else computed locally. */
export async function loadChartDashas(chart: Chart): Promise<DashaSnapshot> {
  const moonLong = chart.planets.moon.siderealLong;
  try {
    const opts = { signal: AbortSignal.timeout(1500) };
    const [v, a] = await Promise.all([
      fetch(`${API_BASE}/dasha/vimshottari?moonLong=${moonLong}`, opts).then((r) => r.json()),
      fetch(`${API_BASE}/dasha/ashtottari?moonLong=${moonLong}`, opts).then((r) => r.json()),
    ]);
    if (!v?.balance?.lord || !a?.balance?.lord) throw new Error('bad response');
    return withCurrent(chart,
      { lord: v.balance.lord, yearsLeft: v.balance.yearsLeft },
      { lord: a.balance.lord, yearsLeft: a.balance.yearsLeft }, 'server');
  } catch {
    return local(chart);
  }
}
