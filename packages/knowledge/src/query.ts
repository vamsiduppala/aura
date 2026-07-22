// Lookup + lightweight search over the knowledge base.

import type { Graha } from './types.js';
import { GRAHAS } from './data/grahas.js';
import { RASIS, RASI_BY_INDEX } from './data/rasis.js';
import { BHAVAS, BHAVA } from './data/bhavas.js';
import { NAKSHATRAS, NAKSHATRA_BY_INDEX } from './data/nakshatras.js';
import { YOGAS } from './data/yogas.js';

export const getGraha = (g: Graha) => GRAHAS[g]!;
export const getRasi = (i: number) => RASI_BY_INDEX(i);
export const getBhava = (n: number) => BHAVA(n);
export const getNakshatra = (i: number) => NAKSHATRA_BY_INDEX(i);

export interface SearchHit { kind: string; id: string; label: string; summary: string }

/** Simple term search across all reference data (for the mentor to look concepts up). */
export function search(term: string): SearchHit[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  const match = (s: string) => s.toLowerCase().includes(q);

  for (const g of Object.values(GRAHAS)) {
    if (match(g.english) || match(g.sanskrit) || g.significations.some(match) || match(g.governs)) {
      hits.push({ kind: 'graha', id: g.key, label: g.english, summary: `${g.governs}; ${g.significations.slice(0, 4).join(', ')}` });
    }
  }
  for (const r of RASIS) {
    if (match(r.english) || match(r.sanskrit) || r.indications.some(match)) {
      hits.push({ kind: 'rasi', id: String(r.index), label: r.english, summary: `${r.modality} ${r.element}; ${r.indications.slice(0, 4).join(', ')}` });
    }
  }
  for (const b of BHAVAS) {
    if (match(b.english) || match(b.sanskrit) || b.significations.some(match)) {
      hits.push({ kind: 'bhava', id: String(b.number), label: `${b.number}th house (${b.english})`, summary: b.significations.slice(0, 5).join(', ') });
    }
  }
  for (const n of NAKSHATRAS) {
    if (match(n.name) || match(n.deity) || match(n.theme)) {
      hits.push({ kind: 'nakshatra', id: String(n.index), label: n.name, summary: `${n.theme} (deity: ${n.deity})` });
    }
  }
  for (const y of YOGAS) {
    if (match(y.name) || match(y.rule) || match(y.effect) || match(y.category)) {
      hits.push({ kind: 'yoga', id: y.key, label: y.name, summary: y.effect });
    }
  }
  return hits;
}
