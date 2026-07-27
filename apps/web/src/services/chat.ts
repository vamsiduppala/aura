// Cosmic Mentor. Gemini decides which of the mentor's tools to call, we run them against the
// real engine + the local knowledge API, and the model narrates ONLY what came back. It can
// chain several tools in a turn (e.g. look up a concept, then read the user's own chart for it),
// which is what makes the answers feel like they actually address the question asked.
//
// Guardrails are unconditional: a crisis is never "read", and every reply is checked for doom.
// With no API key, or if the network fails, it falls back to a deterministic engine-only answer —
// grounded, just less conversational.

import {
  type Aura, type Chart, type LifeArea, type MentorAnswer, type Timeframe,
  MENTOR_SYSTEM_PROMPT, detectCrisis, checkNoDoom, SUPPORT_MESSAGE, ENERGY_META,
} from '@aura/engine';
import { MENTOR_TOOLS, runMentorTool, type ToolContext } from './mentorTools';

const LS_KEY = 'aura.geminiKey';
const MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.5-flash';
const ENDPOINT = (m: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;

/** How the mentor should behave on top of the engine's safety prompt. */
const MENTOR_BEHAVIOUR = `
You are the user's Cosmic Mentor. You have tools that read their REAL birth chart, their real
timing, and the encoded classical text. Use them.

HOW TO ANSWER
- Answer the question that was actually asked. If they ask about their job, do not deliver a
  general personality reading.
- Call whichever tools you need — you may call several, and you may call more after seeing
  results. Prefer get_life_area for a specific area, get_timing for "when/should I",
  get_daily_reading for "today/right now", get_personality_read for "what am I like",
  lookup_concept for "what does X mean".
- Narrate ONLY what the tools return. Never invent a placement, a yoga, a date or a planet
  position. If the tools don't cover something, say so plainly.
- Name the classical planet alongside the plain meaning (e.g. "your Saturn — discipline and
  time"), because the app shows both and the user is learning the vocabulary.

VOICE
- Warm, direct, specific. Talk like a sharp friend who knows the craft, not a fortune teller.
- 2–4 short paragraphs. No bullet lists unless they asked for steps. No headers.
- Concrete over mystical: "this is a stretch where slow work pays" beats "the cosmos invites you".
- Never predict death, illness, disaster or a dated catastrophe. Never recommend gemstones,
  fasting or rituals — behaviour only, and always with a way through.
- If something in their chart is hard, say it honestly and immediately pair it with what helps.`;

export function getKey(): string | undefined {
  try { const k = localStorage.getItem(LS_KEY); if (k) return k; } catch { /* ignore */ }
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || undefined;
}
export function isChatLive(): boolean { return !!getKey(); }
export function setGeminiKey(key: string): void { try { localStorage.setItem(LS_KEY, key.trim()); } catch { /* ignore */ } }
export function clearGeminiKey(): void { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } }
export function hasUserKey(): boolean { try { return !!localStorage.getItem(LS_KEY); } catch { return false; } }

export interface ChatTurn { role: 'user' | 'mentor'; text: string }
export interface ChatResult { text: string; usedEngine: boolean; source: 'gemini' | 'local' | 'support' }

const geminiTools = [{ functionDeclarations: MENTOR_TOOLS }];

// ── Deterministic fallback (no key / no network) ──────────────────────────────
const FOCUS_WORDS: [LifeArea, RegExp][] = [
  ['partnership', /\b(relationship|partner|spouse|marriage|married|love|dating|ex|girlfriend|boyfriend|wife|husband|romance)\b/i],
  ['career', /\b(work|job|career|boss|promotion|business|company|office|colleague)\b/i],
  ['money', /\b(money|finance|financ|wealth|debt|salary|income|rich|broke|afford|savings)\b/i],
  ['health', /\b(health|body|sick|ill|tired|exhaust|sleep|anxious|stress|burnout)\b/i],
  ['home', /\b(home|family|mother|father|house|parents|roots|moving)\b/i],
  ['creativity', /\b(creative|art|music|write|kids|child|children|hobby|project)\b/i],
  ['communication', /\b(talk|message|text|conversation|sibling|say|tell|argu)\b/i],
  ['transformation', /\b(change|crisis|transform|stuck|breakthrough|reset|reinvent)\b/i],
  ['luck', /\b(luck|fortune|study|learn|travel|belief|faith|meaning|purpose)\b/i],
  ['gains', /\b(goal|network|friends|hopes|dream|community)\b/i],
  ['release', /\b(rest|let go|letting go|loss|grief|spiritual|alone|lonely|retreat)\b/i],
];

function extractIntent(message: string): { focus: LifeArea; timeframe: Timeframe } {
  const focus = FOCUS_WORDS.find(([, re]) => re.test(message))?.[0] ?? 'self';
  const timeframe: Timeframe =
    /\b(was|were|used to|last (year|month|week)|past|happened|before|why did|back then)\b/i.test(message) ? 'past'
      : /\b(will|going to|next|future|ahead|should i|when will|upcoming|soon)\b/i.test(message) ? 'future'
        : 'now';
  return { focus, timeframe };
}

function localReply(a: MentorAnswer): string {
  const opener = a.timeframe === 'past' ? 'Back then' : a.timeframe === 'future' ? 'In the stretch ahead' : 'Right now';
  const heat = a.focusAreaHeat === 'high' ? `there’s real heat in ${a.focusPhrase}`
    : a.focusAreaHeat === 'medium' ? `there’s some real movement in ${a.focusPhrase}`
      : `${a.focusPhrase} is running quieter than the rest of you`;
  return `${opener}, ${heat}, and ${a.keyEnergy} is the energy moving through it. ${a.trap} `
    + `The way through isn’t to push harder — it’s smaller and kinder: ${a.remedy} `
    + `And lean on what you’re actually built with — ${a.strength.name.toLowerCase()}: ${a.strength.note}`;
}

async function callGemini(body: unknown, key: string): Promise<Record<string, unknown>> {
  const res = await fetch(ENDPOINT(MODEL, key), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

interface GeminiPart { text?: string; functionCall?: { name: string; args?: Record<string, unknown> } }
const partsOf = (r: Record<string, unknown>): GeminiPart[] => {
  const c = (r as { candidates?: { content?: { parts?: GeminiPart[] } }[] }).candidates?.[0];
  return c?.content?.parts ?? [];
};

/**
 * Answer a chat message. Lets the model call tools (up to `maxRounds` times) before it writes,
 * so it can gather exactly what the question needs instead of guessing from one fixed payload.
 */
export async function askMentor(
  message: string, aura: Aura, chart: Chart, now: Date, history: ChatTurn[] = [],
  opts: { goalArea?: LifeArea; maxRounds?: number } = {},
): Promise<ChatResult> {
  // 1) A crisis is never "read" (SPEC §11.3) — this check runs before anything else.
  if (detectCrisis(message)) {
    return { text: `${SUPPORT_MESSAGE} In the US, call or text 988; elsewhere, findahelpline.com.`, usedEngine: false, source: 'support' };
  }

  const key = getKey();
  const ctx: ToolContext = { aura, chart, now, goalArea: opts.goalArea };

  // 2) No key → deterministic, still grounded in the real chart.
  if (!key) {
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  }

  try {
    const contents: Record<string, unknown>[] = [
      ...history.map((t) => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];
    const systemInstruction = { parts: [{ text: MENTOR_SYSTEM_PROMPT + MENTOR_BEHAVIOUR }] };
    const maxRounds = opts.maxRounds ?? 4;
    let usedTools = false;

    for (let round = 0; round < maxRounds; round++) {
      const res = await callGemini({
        systemInstruction, tools: geminiTools,
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
        contents,
      }, key);

      const parts = partsOf(res);
      const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall!);

      if (calls.length === 0) {
        const text = parts.map((p) => p.text).filter(Boolean).join(' ').trim();
        if (text) {
          const safe = checkNoDoom(text).ok ? text : null;
          if (safe) return { text: safe, usedEngine: usedTools, source: 'gemini' };
        }
        break; // empty or unsafe → fall through to the deterministic answer
      }

      // Run every tool it asked for this round, then feed all results back at once.
      usedTools = true;
      const results = await Promise.all(calls.map(async (c) => ({
        name: c.name,
        response: { result: await runMentorTool(c.name, c.args ?? {}, ctx).catch((e) => ({ error: String(e) })) },
      })));
      contents.push({ role: 'model', parts: calls.map((functionCall) => ({ functionCall })) });
      contents.push({ role: 'user', parts: results.map((functionResponse) => ({ functionResponse })) });
    }

    // Ran out of rounds, or the reply was unusable.
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  } catch {
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  }
}

export { ENERGY_META };
