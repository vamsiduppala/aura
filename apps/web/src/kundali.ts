// Builds the "whole chart, read out" view from a Chart, using @aura/knowledge to
// interpret every planet placement (planet + house + sign + dignity) into plain
// language — the Blueprint's full-kundali section the user asked for:
//   "Saturn, Ketu in 5th house (Pisces) in Scorpio lagna, meaning your loving
//    pattern is a little serious and a little detached."
import type { Chart, Graha } from '@aura/engine';
import { SIGN_LORD } from '@aura/engine';
import {
  interpretPlacement, interpretLagnaLord, classifyDignity, getRasi,
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
  lagnaLord: Graha;
  lagnaLordText: string;
  rows: KundaliRow[]; // ordered by house asc, then classical order (co-tenants sit together)
}

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
        dignity, retrograde: p.retrograde, combust: p.combust, vargottama: p.vargottama,
        title: interp.title, text: interp.text, keywords: interp.keywords,
      };
    })
    .sort((a, b) => a.house - b.house || ORDER.indexOf(a.graha) - ORDER.indexOf(b.graha));

  return {
    lagnaSign: chart.lagnaSign,
    lagnaSignName: getRasi(chart.lagnaSign).english,
    lagnaLord,
    lagnaLordText,
    rows,
  };
}
