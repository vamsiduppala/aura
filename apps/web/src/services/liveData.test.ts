import { describe, it, expect } from 'vitest';
import { Aura, AstronomiaEphemeris, type BirthData } from '@aura/engine';
import { dashaBalanceAtBirth, ashtottariBalanceAtBirth } from '@aura/knowledge';
import { loadChartDashas } from './liveData';

// No API server in the test env → loadChartDashas must fall back to on-device computation.
const aura = new Aura(new AstronomiaEphemeris());
const chart = aura.chart({
  date: '2001-03-14', time: '09:42', unknownTime: false,
  place: 'Jaipur', lat: 26.92, lng: 75.82, tzOffsetMinutes: 330,
} as BirthData);

describe('loadChartDashas — falls back to on-device dasha computation', () => {
  it('returns the correct lords computed locally when the API is unreachable', async () => {
    const snap = await loadChartDashas(chart);
    expect(snap.source).toBe('on-device');
    const moonLong = chart.planets.moon.siderealLong;
    expect(snap.vimshottari.lord).toBe(dashaBalanceAtBirth(moonLong).lord);
    expect(snap.ashtottari.lord).toBe(ashtottariBalanceAtBirth(moonLong).lord);
    expect(snap.narayana).toHaveLength(12);
    expect(snap.narayanaNames).toHaveLength(12);
  });

  it('computes a current dasha period (lord + % through) for each system', async () => {
    const snap = await loadChartDashas(chart);
    const grahas = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    for (const now of [snap.vimshottariNow, snap.ashtottariNow]) {
      expect(grahas).toContain(now.lord);
      expect(now.pct).toBeGreaterThanOrEqual(0);
      expect(now.pct).toBeLessThanOrEqual(100);
    }
  });
});
