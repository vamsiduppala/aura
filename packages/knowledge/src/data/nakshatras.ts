// Nakshatra (constellation) reference — Vimsottari lord, deity, symbol, theme
// (Ch 1.3.6 / Table 2). Standard traditional attributes as structured data.

import type { NakshatraKnowledge } from '../types.js';

export const NAKSHATRAS: NakshatraKnowledge[] = [
  { index: 0, name: 'Ashwini', lord: 'ketu', deity: 'Ashwini Kumaras', symbol: 'horse’s head', theme: 'swift starts, healing, pioneering energy' },
  { index: 1, name: 'Bharani', lord: 'venus', deity: 'Yama', symbol: 'yoni', theme: 'restraint, bearing burdens, transformation' },
  { index: 2, name: 'Krittika', lord: 'sun', deity: 'Agni', symbol: 'razor / flame', theme: 'cutting through, purification, sharp focus' },
  { index: 3, name: 'Rohini', lord: 'moon', deity: 'Prajapati', symbol: 'cart', theme: 'growth, fertility, beauty, material comfort' },
  { index: 4, name: 'Mrigashira', lord: 'mars', deity: 'Soma', symbol: 'deer’s head', theme: 'searching, curiosity, gentleness' },
  { index: 5, name: 'Ardra', lord: 'rahu', deity: 'Rudra', symbol: 'teardrop', theme: 'storms, upheaval, effortful transformation' },
  { index: 6, name: 'Punarvasu', lord: 'jupiter', deity: 'Aditi', symbol: 'quiver of arrows', theme: 'renewal, return, safe abundance' },
  { index: 7, name: 'Pushya', lord: 'saturn', deity: 'Brihaspati', symbol: 'cow’s udder / flower', theme: 'nourishment, devotion, the most auspicious' },
  { index: 8, name: 'Ashlesha', lord: 'mercury', deity: 'Nagas', symbol: 'coiled serpent', theme: 'entwining, penetrating insight, cunning' },
  { index: 9, name: 'Magha', lord: 'ketu', deity: 'Pitris (ancestors)', symbol: 'throne', theme: 'ancestry, authority, tradition, legacy' },
  { index: 10, name: 'P. Phalguni', lord: 'venus', deity: 'Bhaga', symbol: 'hammock', theme: 'pleasure, rest, romance, creativity' },
  { index: 11, name: 'U. Phalguni', lord: 'sun', deity: 'Aryaman', symbol: 'bed', theme: 'patronage, service, contracts, generosity' },
  { index: 12, name: 'Hasta', lord: 'moon', deity: 'Savitr', symbol: 'hand', theme: 'skill, craft, dexterity, making things real' },
  { index: 13, name: 'Chitra', lord: 'mars', deity: 'Tvashtar', symbol: 'bright jewel', theme: 'craftsmanship, brilliance, design' },
  { index: 14, name: 'Swati', lord: 'rahu', deity: 'Vayu', symbol: 'young sprout in wind', theme: 'independence, movement, flexibility' },
  { index: 15, name: 'Vishakha', lord: 'jupiter', deity: 'Indra-Agni', symbol: 'triumphal archway', theme: 'goal-focus, determination, achievement' },
  { index: 16, name: 'Anuradha', lord: 'saturn', deity: 'Mitra', symbol: 'lotus', theme: 'friendship, devotion, cooperation' },
  { index: 17, name: 'Jyeshtha', lord: 'mercury', deity: 'Indra', symbol: 'earring / umbrella', theme: 'seniority, protection, hard-won courage' },
  { index: 18, name: 'Mula', lord: 'ketu', deity: 'Nirriti', symbol: 'tied roots', theme: 'getting to the root, dissolving, foundations' },
  { index: 19, name: 'P. Ashadha', lord: 'venus', deity: 'Apas', symbol: 'winnowing fan', theme: 'invincibility, cleansing, early victory' },
  { index: 20, name: 'U. Ashadha', lord: 'sun', deity: 'Vishvedevas', symbol: 'elephant tusk', theme: 'lasting victory, integrity, endurance' },
  { index: 21, name: 'Shravana', lord: 'moon', deity: 'Vishnu', symbol: 'ear / three footprints', theme: 'listening, learning, connection' },
  { index: 22, name: 'Dhanishta', lord: 'mars', deity: 'Vasus', symbol: 'drum', theme: 'rhythm, wealth, music, abundance' },
  { index: 23, name: 'Shatabhisha', lord: 'rahu', deity: 'Varuna', symbol: 'empty circle', theme: 'healing, mystery, seclusion, secrets' },
  { index: 24, name: 'P. Bhadrapada', lord: 'jupiter', deity: 'Aja Ekapada', symbol: 'sword', theme: 'intensity, idealism, penance' },
  { index: 25, name: 'U. Bhadrapada', lord: 'saturn', deity: 'Ahir Budhnya', symbol: 'serpent of the deep', theme: 'depth, wisdom, calm patience' },
  { index: 26, name: 'Revati', lord: 'mercury', deity: 'Pushan', symbol: 'fish', theme: 'nourishment, safe journeys, completion' },
];

export const NAKSHATRA_BY_INDEX = (i: number): NakshatraKnowledge => NAKSHATRAS[((i % 27) + 27) % 27]!;
