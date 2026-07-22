// Cosmic Mentor chat service (SPEC pivot §3). Gemini with FORCED function-calling:
// the LLM must call query_energy → we run the local engine → the LLM narrates the real
// data. Guarded by a crisis check (never "read" a crisis) + a no-doom pass on the reply.
// Degrades gracefully to a deterministic engine-only reply if there's no key/network.

import {
  type Aura, type Chart, type LifeArea, type MentorAnswer, type Timeframe,
  MENTOR_SYSTEM_PROMPT, MENTOR_TOOL_SCHEMA, detectCrisis, checkNoDoom,
  SUPPORT_MESSAGE, ENERGY_META,
} from '@aura/engine';

const KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.0-flash';
const ENDPOINT = (m: string) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`;

export interface ChatTurn { role: 'user' | 'mentor'; text: string }
export interface ChatResult { text: string; usedEngine: boolean; source: 'gemini' | 'local' | 'support' }

export const chatEnabled = !!KEY;

// ── Gemini tool (adapts the engine's neutral schema to Gemini's function format) ──
const geminiTool = {
  functionDeclarations: [{
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
  }],
};

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

function softenDoom(text: string): string {
  return checkNoDoom(text).ok ? text : localReplyFromText(text);
}
function localReplyFromText(_t: string): string {
  return 'Let’s keep this grounded and kind. Tell me the area that’s heaviest right now — your relationships, work, money, health, or just you — and I’ll read what’s moving through it.';
}

async function callGemini(body: unknown): Promise<any> {
  const res = await fetch(ENDPOINT(MODEL), {
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
  if (!KEY) {
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  }

  // 3) Gemini forced function-call → engine → narrate.
  try {
    const contents = [
      ...history.map((t) => ({ role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];
    const first = await callGemini({
      systemInstruction: { parts: [{ text: MENTOR_SYSTEM_PROMPT }] },
      tools: [geminiTool],
      toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['query_energy'] } },
      contents,
    });
    const call = first?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
    if (!call) {
      // Model answered directly — guard + return, or fall back to engine.
      const direct = first?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(' ');
      if (direct) return { text: softenDoom(direct), usedEngine: false, source: 'gemini' };
      const intent = extractIntent(message);
      return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
    }

    const focus = (call.args?.focus ?? extractIntent(message).focus) as LifeArea;
    const timeframe = (call.args?.timeframe ?? 'now') as Timeframe;
    const answer = aura.mentorAnswer(chart, { focus, timeframe }, now);

    const second = await callGemini({
      systemInstruction: { parts: [{ text: MENTOR_SYSTEM_PROMPT }] },
      tools: [geminiTool],
      toolConfig: { functionCallingConfig: { mode: 'NONE' } },
      contents: [
        ...contents,
        { role: 'model', parts: [{ functionCall: call }] },
        { role: 'user', parts: [{ functionResponse: { name: 'query_energy', response: { result: answer } } }] },
      ],
    });
    const text = second?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(' ')?.trim();
    if (text) return { text: softenDoom(text), usedEngine: true, source: 'gemini' };
    return { text: localReply(answer), usedEngine: true, source: 'local' };
  } catch {
    // Network/API failure → deterministic engine reply (never leave the user stuck).
    const intent = extractIntent(message);
    return { text: localReply(aura.mentorAnswer(chart, intent, now)), usedEngine: true, source: 'local' };
  }
}

export { ENERGY_META };
