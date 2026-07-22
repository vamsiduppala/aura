// "Your year ahead" — the Tajaka annual (varshaphal) reading. Uses the engine's
// solar-return chart + @aura/knowledge's Tajaka techniques (muntha, harsha bala, sahams)
// to summarise the year the person is currently in. All client-side/deterministic.
import type { Aura, Chart, Graha } from '@aura/engine';
import { SIGN_LORD } from '@aura/engine';
import {
  MUNTHA_IN_HOUSE, harshaBala, classifyDignity, computeSahams, getRasi,
} from '@aura/knowledge';

export interface YearAhead {
  year: number;
  returnDate: string;
  munthaSignName: string;
  munthaHouse: number;
  munthaMeaning: string;
  strongestPlanet: Graha;
  strongestUnits: number;
  punyaSahamSign: string;
}

const AV: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

export function computeYearAhead(aura: Aura, chart: Chart, now: Date): YearAhead {
  const ann = aura.currentAnnualChart(chart, now);
  const c = ann.chart;
  const hour = Number((c.birth.time ?? '12:00').split(':')[0]);
  const dayBirth = hour >= 6 && hour < 18;

  // Strongest planet of the year by Harsha bala.
  let best: Graha = 'sun';
  let bestU = -1;
  for (const g of AV) {
    const p = c.planets[g];
    const dig = classifyDignity(g, p.sign);
    const exaltedOrOwn = dig === 'exalted' || dig === 'own' || dig === 'moolatrikona';
    const u = harshaBala(g, p.house, exaltedOrOwn, dayBirth);
    if (u > bestU) { bestU = u; best = g; }
  }

  // Punya (fortune) saham for the year.
  const lagnaLord = SIGN_LORD[c.lagnaSign]!;
  const sahams = computeSahams({
    sun: c.planets.sun.siderealLong, moon: c.planets.moon.siderealLong, mars: c.planets.mars.siderealLong,
    mercury: c.planets.mercury.siderealLong, jupiter: c.planets.jupiter.siderealLong, venus: c.planets.venus.siderealLong,
    saturn: c.planets.saturn.siderealLong, lagna: c.lagnaLong, lagnaLord: c.planets[lagnaLord].siderealLong,
  }, dayBirth);

  return {
    year: ann.year,
    returnDate: c.birth.date,
    munthaSignName: getRasi(ann.muntha).english,
    munthaHouse: ann.munthaHouse,
    munthaMeaning: MUNTHA_IN_HOUSE[ann.munthaHouse] ?? '',
    strongestPlanet: best,
    strongestUnits: bestU,
    punyaSahamSign: getRasi(Math.floor((sahams.punya ?? 0) / 30)).english,
  };
}
