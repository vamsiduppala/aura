// Builds the "whole chart, read out" view from a Chart, using @aura/knowledge to
// interpret every planet placement (planet + house + sign + dignity) into plain
// language — the Blueprint's full-kundali section the user asked for:
//   "Saturn, Ketu in 5th house (Pisces) in Scorpio lagna, meaning your loving
//    pattern is a little serious and a little detached."
import type { Chart, Graha } from '@aura/engine';
import { SIGN_LORD } from '@aura/engine';
import {
  interpretPlacement, interpretLagnaLord, classifyDignity, getRasi, getBhava, charaKarakas,
  matchAakritiYogas, sankhyaYoga,
  type Dignity,
} from '@aura/knowledge';

/** Classical order for stable, familiar sequencing (Sun → Ketu). */
const ORDER: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

export interface KundaliRow {
  graha: Graha;
  house: number;      // 1..12
  sign: number;       // 0..11
  signName: string;
  dignity: Dignity;
  strength: number;   // natal strength as 0..100 %
  retrograde: boolean;
  combust: boolean;
  vargottama: boolean;
  title: string;      // "Saturn in the 5th house (Creativity), in Pisces"
  text: string;       // the readable meaning
  keywords: string[];
}

export interface Kundali {
  lagnaSign: number;
  lagnaSignName: string;
  lagnaSignNote: string;   // a few plain traits of the rising sign
  lagnaLord: Graha;
  lagnaLordStrength: number; // 0..100 %
  lagnaLordText: string;
  atmakaraka: Graha;       // Jaimini AK — the soul's core planet
  darakaraka: Graha;       // Jaimini DK — the planet describing the spouse
  shape: { name: string; means: string; effect: string }; // the chart's Naabhasa "shape" yoga
  rows: KundaliRow[]; // ordered by house asc, then classical order (co-tenants sit together)
}

const KARAKA_BODIES: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu'];
const SEVEN: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

/** A human dignity chip label, or '' when there's nothing notable to flag. */
export function dignityChip(d: Dignity): string {
  switch (d) {
    case 'exalted': return 'exalted · at its best';
    case 'moolatrikona': return 'in its power seat';
    case 'own': return 'at home';
    case 'debilitated': return 'debilitated · works harder';
    case 'friend': return 'in a friend’s sign';
    case 'enemy': return 'in a tough sign';
    default: return '';
  }
}

export function buildKundali(chart: Chart): Kundali {
  const lagnaLord = SIGN_LORD[chart.lagnaSign]!;
  const lord = chart.planets[lagnaLord];
  const lagnaLordText = interpretLagnaLord(lagnaLord, lord.house, lord.sign).text;

  const pct = (g: Graha) => Math.round((chart.planets[g].strength ?? 0) * 100);

  const rows: KundaliRow[] = ORDER
    .map((g): KundaliRow => {
      const p = chart.planets[g];
      const dignity = classifyDignity(g, p.sign);
      const interp = interpretPlacement({
        graha: g, house: p.house, sign: p.sign, dignity,
        retrograde: p.retrograde, combust: p.combust,
      });
      return {
        graha: g, house: p.house, sign: p.sign, signName: getRasi(p.sign).english,
        dignity, strength: pct(g), retrograde: p.retrograde, combust: p.combust, vargottama: p.vargottama,
        title: interp.title, text: interp.text, keywords: interp.keywords,
      };
    })
    .sort((a, b) => a.house - b.house || ORDER.indexOf(a.graha) - ORDER.indexOf(b.graha));

  const ck = charaKarakas(Object.fromEntries(KARAKA_BODIES.map((g) => [g, chart.planets[g].siderealLong])));
  const karaka = (code: string): Graha => ck.find((k) => k.code === code)!.graha;

  // The chart's Naabhasa "shape": a house-based Aakriti yoga if any, else the Sankhya yoga.
  const aakriti = matchAakritiYogas(SEVEN.map((g) => chart.planets[g].house));
  const shape = aakriti[0] ?? sankhyaYoga(SEVEN.map((g) => chart.planets[g].sign));

  return {
    lagnaSign: chart.lagnaSign,
    lagnaSignName: getRasi(chart.lagnaSign).english,
    lagnaSignNote: getRasi(chart.lagnaSign).indications.slice(0, 3).join(', '),
    lagnaLord,
    lagnaLordStrength: pct(lagnaLord),
    lagnaLordText,
    atmakaraka: karaka('AK'),
    darakaraka: karaka('DK'),
    shape: { name: shape.name, means: shape.means, effect: shape.effect },
    rows,
  };
}

// ── House-centric view: your life read house by house (which energies landed where) ──
export interface HouseCard {
  house: number;        // 1..12
  name: string;         // life area, e.g. "Creativity"
  sanskrit: string;
  governs: string;      // what the house shapes (top significations)
  categories: string[];
  sign: number;
  signName: string;
  lord: Graha;          // ruler of the house
  lordHouse: number;    // where that ruler sits
  occupants: KundaliRow[]; // planets in this house, with their situational meaning
}

export interface ChartByHouse extends Kundali { houses: HouseCard[]; strengths: { graha: Graha; pct: number }[] }

const CLASSICAL: Graha[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

/** The full chart organised by house (life area) — the primary Blueprint view. */
export function buildHouses(chart: Chart): ChartByHouse {
  const k = buildKundali(chart);
  const byHouse = new Map<number, KundaliRow[]>();
  for (const r of k.rows) {
    const arr = byHouse.get(r.house) ?? [];
    arr.push(r);
    byHouse.set(r.house, arr);
  }

  const houses: HouseCard[] = [];
  for (let h = 1; h <= 12; h++) {
    const sign = (chart.lagnaSign + (h - 1)) % 12;
    const b = getBhava(h);
    const lord = SIGN_LORD[sign]!;
    const lordRow = k.rows.find((r) => r.graha === lord);
    houses.push({
      house: h, name: b.english, sanskrit: b.sanskrit,
      governs: b.significations.slice(0, 6).join(', '),
      categories: b.categories, sign, signName: getRasi(sign).english,
      lord, lordHouse: lordRow?.house ?? h,
      occupants: byHouse.get(h) ?? [],
    });
  }

  const strengths = CLASSICAL.map((g) => ({ graha: g, pct: Math.round((chart.planets[g].strength ?? 0) * 100) }));
  return { ...k, houses, strengths };
}
