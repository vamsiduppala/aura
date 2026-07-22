// Yoga (planetary combination) reference — Ch 11. Each yoga's defining rule + its
// traditional effect, distilled into our own concise phrasing (not the source's prose).

import type { YogaKnowledge } from '../types.js';

export const YOGAS: YogaKnowledge[] = [
  // ── Solar (Ravi) yogas ──
  { key: 'vesi', name: 'Vesi Yoga', category: 'Ravi', rule: 'A planet other than the Moon in the 2nd house from the Sun.', effect: 'A balanced, truthful outlook; content even with modest means.' },
  { key: 'vosi', name: 'Vosi Yoga', category: 'Ravi', rule: 'A planet other than the Moon in the 12th house from the Sun.', effect: 'Skilful, charitable, learned and well-known.' },
  { key: 'ubhayachara', name: 'Ubhayachara Yoga', category: 'Ravi', rule: 'Planets other than the Moon in both the 2nd and 12th from the Sun.', effect: 'Comfort and standing — a leader or their equal.' },
  { key: 'budha-aditya', name: 'Budha-Aditya Yoga', category: 'Ravi', rule: 'The Sun and Mercury together in one sign (strongest when Mercury is not combust).', effect: 'Sharp intelligence and skill; respected expertise, especially in the area of the chart it falls in.' },
  // ── Lunar (Chandra) yogas ──
  { key: 'sunapha', name: 'Sunapha Yoga', category: 'Chandra', rule: 'A planet other than the Sun in the 2nd from the Moon.', effect: 'Self-earned wealth, intelligence and reputation.' },
  { key: 'anapha', name: 'Anapha Yoga', category: 'Chandra', rule: 'A planet other than the Sun in the 12th from the Moon.', effect: 'Good looks, character, health and reputation; well-provided-for.' },
  { key: 'duradhara', name: 'Duradhara Yoga', category: 'Chandra', rule: 'Planets other than the Sun in both the 2nd and 12th from the Moon.', effect: 'Many pleasures, wealth, vehicles and good support around you.' },
  { key: 'kemadruma', name: 'Kemadruma Yoga', category: 'Chandra', rule: 'No planets (other than the Sun) in the 1st, 2nd or 12th from the Moon, and no planets in kendras from the lagna.', effect: 'A hard, self-made road — success comes through great effort; it can mute other good combinations. (Framed as a challenge with an exit, never doom.)' },
  { key: 'chandra-mangala', name: 'Chandra-Mangala Yoga', category: 'Chandra', rule: 'The Moon and Mars together in one sign.', effect: 'Worldly, resourceful and materially driven — turns feeling into effort and earnings.' },
  { key: 'adhi', name: 'Adhi Yoga', category: 'Chandra', rule: 'Natural benefics occupy the 6th, 7th and 8th from the Moon.', effect: 'Rises to leadership, ministership or command, per the strength of the planets.' },
  // ── Pancha Mahapurusha (five great persons) ──
  { key: 'ruchaka', name: 'Ruchaka Yoga', category: 'Mahapurusha', rule: 'Mars in its own/exaltation sign AND in a kendra (1/4/7/10) from the lagna.', effect: 'A fiery great one — bold, enterprising, a natural leader who prevails over opposition.' },
  { key: 'bhadra', name: 'Bhadra Yoga', category: 'Mahapurusha', rule: 'Mercury in its own/exaltation sign AND in a kendra from the lagna.', effect: 'An earthy great one — learned, articulate, systematic and independent.' },
  { key: 'sasa', name: 'Sasa Yoga', category: 'Mahapurusha', rule: 'Saturn in its own/exaltation sign AND in a kendra from the lagna.', effect: 'An airy great one — wise, enduring, resourceful, knows others’ weaknesses and moves.' },
  { key: 'malavya', name: 'Malavya Yoga', category: 'Mahapurusha', rule: 'Venus in its own/exaltation sign AND in a kendra from the lagna.', effect: 'A watery great one — magnetic, refined, healthy, gifted in the arts and comforts.' },
  { key: 'hamsa', name: 'Hamsa Yoga', category: 'Mahapurusha', rule: 'Jupiter in its own/exaltation sign AND in a kendra from the lagna.', effect: 'An ethery great one — wise, pure, respected, a fine speaker who enjoys life fully.' },
  // ── Raja / Dhana (power & wealth) — the classic definitions ──
  { key: 'raja-generic', name: 'Raja Yoga', category: 'Raja', rule: 'A link (conjunction, aspect, exchange, or one in the other’s house) between a lord of a kendra (1/4/7/10) and a lord of a trikona (1/5/9).', effect: 'Capacity to rise — power, position and success, especially in the dasas of the planets involved.' },
  { key: 'dhana-generic', name: 'Dhana Yoga', category: 'Dhana', rule: 'A link between the lords of wealth houses (2, 11) and the lords of 1/5/9, or benefics strong in 2/11.', effect: 'Resources gather around your efforts — a knack for turning action into accumulation.' },
  { key: 'vipareeta-raja', name: 'Vipareeta Raja Yoga', category: 'Raja', rule: 'Lords of the dusthanas (6, 8, 12) placed in dusthanas (in each other’s houses).', effect: 'Rise through adversity — difficulty that flips into unexpected advantage.' },
  { key: 'neechabhanga', name: 'Neecha-bhanga Raja Yoga', category: 'Raja', rule: 'A debilitated planet whose debilitation is "cancelled" (e.g. its dispositor or the exalting planet of that sign is strong/in a kendra).', effect: 'A weak start that turns into strength — a late-blooming rise from an initial disadvantage.' },
  { key: 'gajakesari', name: 'Gajakesari Yoga', category: 'Chandra', rule: 'Jupiter in a kendra (1/4/7/10) from the Moon.', effect: 'Respect, wisdom and standing; sound judgment that others trust.' },
];

export const YOGA_BY_KEY = (key: string): YogaKnowledge | undefined => YOGAS.find((y) => y.key === key);
