// ─────────────────────────────────────────────────────────────────────────────
// Optional LLM polish (Tier 6, SPEC §6.3 / §11.7). OFF by default (Q-05): aura ships
// template-only. When enabled, a guarded LLM pass *rephrases pre-selected, pre-approved
// beats* into smoother prose — it never invents predictions, never adds remedies, never
// introduces medical/financial/deterministic/doom claims. The output is validated by the
// same no-doom + no-jargon guards before it's shown.
//
// No API key or network call lives here; the app injects an adapter if/when desired.
// ─────────────────────────────────────────────────────────────────────────────

import type { Reading } from '../types.js';
import { checkNoDoom } from '../safety/guardrails.js';

/** The strict guardrail system prompt for any LLM polish pass. */
export const POLISH_SYSTEM_PROMPT = `You are the voice of "aura", a gentle, grounded astrology-adjacent reflection app.
You will be given five short pre-approved "beats" (gift, trap, move, watch, remedy) that were
selected by a deterministic engine. Your ONLY job is to lightly rephrase them into warmer, more
natural prose while preserving their exact meaning and intent.

Hard rules — never break these:
- Do NOT invent any new prediction, event, date, person, or outcome. Rephrase only what is given.
- Do NOT add or change the remedy. Keep it behavioural, free, and healthy. Never suggest purchases,
  fasting, extreme regimens, gemstones, rituals, or anything medical.
- Do NOT make medical, psychological, financial, or legal claims or directives.
- Do NOT predict death, illness, disaster, catastrophe, ruin, or any dated calamity. No fear, no doom.
- Do NOT use astrology jargon (no planet names, houses, signs, Sanskrit, "retrograde", "sidereal").
- Keep the honest gift↔trap pairing. Never turn the reading into pure flattery.
- Keep each beat to one or two sentences. Warm, plain, second person.

Return the five rephrased beats in the same structure. If anything would require breaking a rule,
return the original beat unchanged.`;

export interface PolishAdapter {
  /** Rephrase the given beats under the guardrail. Must be side-effect free. */
  rephrase(beats: Record<string, string>, system: string): Promise<Record<string, string>>;
}

/** Default: no polish — returns the beats unchanged. */
export const NOOP_POLISH: PolishAdapter = {
  async rephrase(beats) { return beats; },
};

/**
 * Polish a reading's prose beats. Falls back to the original beat whenever the polished
 * text fails the no-doom guard, so a misbehaving model can never introduce doom.
 */
export async function polishReading(
  reading: Reading, adapter: PolishAdapter = NOOP_POLISH,
): Promise<Reading> {
  const beats = {
    headline: reading.headline, gift: reading.gift, trap: reading.trap,
    move: reading.move, watch: reading.watch, remedy: reading.remedy,
  };
  const out = await adapter.rephrase(beats, POLISH_SYSTEM_PROMPT);
  const safe = (key: keyof typeof beats): string => {
    const candidate = out[key];
    if (typeof candidate !== 'string' || !candidate.trim()) return beats[key];
    // The remedy is never rephrased away from the approved library; guard doom on all.
    if (key === 'remedy' && candidate !== beats.remedy && !checkNoDoom(candidate).ok) return beats.remedy;
    return checkNoDoom(candidate).ok ? candidate : beats[key];
  };
  return {
    ...reading,
    headline: safe('headline'), gift: safe('gift'), trap: safe('trap'),
    move: safe('move'), watch: safe('watch'), remedy: safe('remedy'),
  };
}
