// Cosmic Mentor chat service (SPEC pivot §3). Gemini with FORCED function-calling:
// the LLM must call query_energy → we run the local engine → the LLM narrates the real
// data. Guarded by a crisis check (never "read" a crisis) + a no-doom pass on the reply.
// Degrades gracefully to a deterministic engine-only reply if there's no key/network.

import {
  type Aura, type Chart, type LifeArea, type MentorAnswer, type Timeframe,
  MENTOR_SYSTEM_PROMPT, MENTOR_TOOL_SCHEMA, detectCrisis, checkNoDoom,
  SUPPORT_MESSAGE, ENERGY_META,
} from '@aura/engine';
import { lookupAstrologyLive, type AstroLookup } from './knowledge';

const AREA_ENUM: LifeArea[] = ['self', 'money', 'communication', 'home', 'creativity', 'health',
  'partnership', 'transformation', 'luck', 'career', 'gains', 'release'];

// Addendum layered on the engine's strict prompt: the mentor may now reach the encoded
// knowledge base + the user's real chart, and (per the product update) may name the
// classical planet alongside its energy — but every safety rule still holds.
const MENTOR_KNOWLEDGE_ADDENDUM = `
You also have a second tool: lookup_astrology(topic, area?). Use it when the user wants to
UNDERSTAND something — a concept ("what's a raja yoga?", "what does my rising sign mean?") or
why they are a certain way in a life area ("why do I get so guarded in love?"). Pass a short
topic and, if the question is about a life area, that area. It returns real facts from the
knowledge base and the user's own real chart placements. Narrate ONLY what it returns.
For questions about what's happening or what to do now/next, still use query_energy.
You MAY now name the classical planet next to its energy (e.g. "your Heavy Lifting energy —
Saturn"), because the app shows both. Keep it light and warm; never dump raw chart mechanics
(degrees, dasha math), never predict doom, illness or dated catastrophe, and never recommend
gemstones, fasting or rituals — behaviour-only, always with a way through.`;

const LS_KEY = 'aura.geminiKey';
const MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.0-flash';
const ENDPOINT = (m: string, key: string) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;

/** Prefer a user-set key (Settings → localStorage) over the bundled dev key. */
function getKey(): string | undefined {
  try { const k = localStorage.getItem(LS_KEY); if (k) return k; } catch { /* ignore */ }
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || undefined;
}
export function isChatLive(): boolean { return !!getKey(); }
export function setGeminiKey(key: string): void { try { localStorage.setItem(LS_KEY, key.trim()); } catch { /* ignore */ } }
export function clearGeminiKey(): void { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } }
export function hasUserKey(): boolean { try { return !!localStorage.getItem(LS_KEY); } catch { return false; } }

export interface ChatTurn { role: 'user' | 'mentor'; text: string }
export interface ChatResult { text: string; usedEngine: boolean; source: 'gemini' | 'local' | 'support' }

// ── Gemini tools (adapts the engine's neutral schema to Gemini's function format) ──
const geminiTool = {
  functionDeclarations: [
    {
      name: MENTOR_TOOL_SCHEMA.name,
      description: MENTOR_TOOL_SCHEMA.description,
      parameters: {
        type: 'OBJECT',
        properties: {
          focus: { type: 'STRING', enum: MENTOR_TOOL_SCHEMA.parameters.properties.focus.enum },
          timeframe: { type: 'STRING', enum: MENTOR_TOOL_SCHEMA.parameters.properties.timeframe.enum },
        },
        required: ['focus', 'timeframe'],
      },
    },
    {
      name: 'lookup_astrology',
      description:
        "Look up a real astrology concept from the knowledge base and/or the user's own real chart. Use for questions about UNDERSTANDING (a concept, or why the user is a certain way in a life area). Returns grounded facts + real placements to narrate.",
      parameters: {
        type: 'OBJECT',
        properties: {
          topic: { type: 'STRING', description: 'Short topic or concept to look up (the user\'s words are fine).' },
          area: { type: 'STRING', enum: AREA_ENUM, description: 'The life area, if the question is about one.' },
        },
        required: ['topic'],
      },
    },
  ],
};
const ALLOWED_FNS = ['query_energy', 'lookup_astrology'];

// ── Deterministic fallback intent extraction (used when the LLM is unavailable) ──
const FOCUS_WORDS: [LifeArea, RegExp][] = [
  ['partnership', /\b(relationship|partner|spouse|marriage|married|love|dating|ex|boyfriend|girlfriend|wife|husband|romance)\b/i],
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
  return `${opener}, ${heat}, and ${a.keyEnergy} is the energy moving through it. ${a.trap} The way through isn’t to push harder — it’s smaller and kinder: ${a.remedy} And lean on what you’re actually built with — ${a.strength.name.toLowerCase()}: ${a.strength.note}`;
}

/** Deterministic narration of a knowledge lookup (used when the LLM is unavailable). */
function localAstroReply(l: AstroLookup): string {
  if (l.chart && l.chart.placements.length) {
    const p = l.chart.placements[0]!;
    const extra = l.chart.placements[1];
    const lead = `In your ${l.chart.area.toLowerCase()}, the pattern is real — ${p.meaning}`;
    const more = extra ? ` ${extra.planet} adds its own colour here too.` : '';
    return `${lead}${more} None of it is a verdict; it’s a leaning you can work with.`;
  }
  if (l.concepts.length) {
    const c = l.concepts[0]!;
    return `Here’s the grounded version — ${c.label}: ${c.summary}. Want me to tie that back to your own chart?`;
  }
  return 'Tell me a bit more about what you want to understand, and I’ll look it up properly.';
}

function softenDoom(text: string): string {
  return checkNoDoom(text).ok ? text : localReplyFromText(text);
}
function localReplyFromText(_t: string): string {
  return 'Let’s keep this grounded and kind. Tell me the area that’s heaviest right now — your relationships, work, money, health, or just you — and I’ll read what’s moving through it.';
}

async function callGemini(body: unknown, key: string): Promise<any> {
  const res = await fetch(ENDPOINT(MODEL, key), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return res.json();
}

/** Answer a user chat message. Always calls the engine; the LLM only narrates. */
export async function askMentor(
  message: string, aura: Aura, chart: Chart, now: Date, history: ChatTurn[] = [],
): Promise<ChatResult> {
  // 1) Crisis: never "read" it (SPEC §11.3).
  if (detectCrisis(message)) {
    return { text: SUPPORT_MESSAGE + ' In the US, call or text 988; elsewhere, findahelpline.com.', usedEngine: false, source: 'support' };
  }

  // 2) No key → deterministic engine-only reply.
  const key = getKey();
  if (!key) {
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  }

  // 3) Gemini forced function-call → engine → narrate.
  try {
    const contents = [
      ...history.map((t) => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];
    const systemPrompt = MENTOR_SYSTEM_PROMPT + MENTOR_KNOWLEDGE_ADDENDUM;
    const first = await callGemini({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: [geminiTool],
      toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ALLOWED_FNS } },
      contents,
    }, key);
    const call = first?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
    if (!call) {
      // Model answered directly — guard + return, or fall back to engine.
      const direct = first?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(' ');
      if (direct) return { text: softenDoom(direct), usedEngine: false, source: 'gemini' };
      const intent = extractIntent(message);
      return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
    }

    // Dispatch by tool name → run the real local backend → hand the result back to narrate.
    let result: unknown;
    if (call.name === 'lookup_astrology') {
      const area = AREA_ENUM.includes(call.args?.area) ? (call.args.area as LifeArea) : undefined;
      const topic = (call.args?.topic as string) || message;
      result = await lookupAstrologyLive(topic, chart, area);
    } else {
      const focus = (call.args?.focus ?? extractIntent(message).focus) as LifeArea;
      const timeframe = (call.args?.timeframe ?? 'now') as Timeframe;
      result = aura.mentorAnswer(chart, { focus, timeframe }, now);
    }

    const second = await callGemini({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: [geminiTool],
      toolConfig: { functionCallingConfig: { mode: 'NONE' } },
      contents: [
        ...contents,
        { role: 'model', parts: [{ functionCall: call }] },
        { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] },
      ],
    }, key);
    const text = second?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(' ')?.trim();
    if (text) return { text: softenDoom(text), usedEngine: true, source: 'gemini' };
    // Narration came back empty → deterministic local fallback for whichever tool ran.
    const fallback = call.name === 'lookup_astrology'
      ? localAstroReply(result as AstroLookup)
      : localReply(result as MentorAnswer);
    return { text: fallback, usedEngine: true, source: 'local' };
  } catch {
    // Network/API failure → deterministic engine reply (never leave the user stuck).
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  }
}

export { ENERGY_META };
