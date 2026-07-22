// Remedies — Ch 34. IMPORTANT product rule: aura only ever surfaces FREE, BEHAVIOURAL,
// healthy remedies (SPEC §11.4). So the "good deeds" (Ch 34.3) are encoded as approved
// behavioural actions (our own concise phrasing). Gemstone/deity associations (Ch 34.2/
// 34.5) are kept as flagged REFERENCE ONLY — the mentor never recommends purchases,
// gemstones, fasting, or rituals. Mantras (Devanagari) are intentionally not encoded.

import type { Graha } from '../types.js';

export interface Remedy {
  graha: Graha;
  /** Free, behavioural, healthy — safe for the mentor to suggest. */
  behavioural: string;
  /** Traditional gemstone (REFERENCE ONLY — never recommended by the product). */
  gemstoneReference: string;
  /** Ruling deity (reference). */
  deityReference: string;
}

export const REMEDIES: Record<string, Remedy> = {
  sun: { graha: 'sun', behavioural: 'Get morning sunlight soon after waking; do one act of genuine service without seeking credit.', gemstoneReference: 'ruby', deityReference: 'Agni' },
  moon: { graha: 'moon', behavioural: 'Care for someone who needs it; keep meals and sleep steady; spend time near water or with music.', gemstoneReference: 'pearl', deityReference: 'Varuna' },
  mars: { graha: 'mars', behavioural: 'Burn the heat with hard physical exercise; give any angry message a 24-hour pause.', gemstoneReference: 'red coral', deityReference: 'Subrahmanya' },
  mercury: { graha: 'mercury', behavioural: 'Single-task with the phone away; write the decision down; learn or teach one small thing.', gemstoneReference: 'emerald', deityReference: 'Maha Vishnu' },
  jupiter: { graha: 'jupiter', behavioural: 'Teach, mentor, or help someone; pick one worthy thing to go deep on and be generous.', gemstoneReference: 'yellow sapphire', deityReference: 'Indra' },
  venus: { graha: 'venus', behavioural: 'Make something with your hands; have one honest, slightly uncomfortable conversation; appreciate beauty on purpose.', gemstoneReference: 'diamond', deityReference: 'Sachi Devi' },
  saturn: { graha: 'saturn', behavioural: 'Do one small consistent action daily for the streak, not the result; get outside; don’t isolate; help someone doing hard work.', gemstoneReference: 'blue sapphire', deityReference: 'Brahma' },
  rahu: { graha: 'rahu', behavioural: 'Fix the sleep window for a week; cut screens before bed; aim the restlessness at one worthy thing.', gemstoneReference: 'hessonite', deityReference: 'Durga' },
  ketu: { graha: 'ketu', behavioural: 'Keep a daily grounding practice — breath, a walk, journaling — and do one small thing that connects you to a person.', gemstoneReference: 'cat’s eye', deityReference: 'Ganesha' },
};

/** Only the behavioural remedy is safe to surface — the product never recommends the rest. */
export function behaviouralRemedy(graha: Graha): string {
  return REMEDIES[graha]?.behavioural ?? '';
}
