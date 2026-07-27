// Streaming for the Cosmic Mentor.
//
// Why this matters more than it looks: a 15-second wait on a blank screen reads as broken, while
// the same 15 seconds with text arriving from second one reads as thoughtful. Perceived
// performance is dominated by time-to-first-token, not total time — which is why every serious
// AI product (ChatGPT, Claude, Perplexity) streams.
//
// Gemini's streamGenerateContent returns newline-delimited JSON when called with alt=sse. We parse
// incrementally and emit text as it arrives, while still surfacing tool calls, because the mentor
// has to run real chart tools before it can say anything true.

/** A failure the caller can actually act on, rather than a generic Error. */
export class MentorApiError extends Error {
  constructor(readonly status: number, readonly retryAfterMs: number | null, message: string) {
    super(message);
    this.name = 'MentorApiError';
  }
  /** Rate limited — the answer is fine, we just asked too often. */
  get isQuota(): boolean { return this.status === 429; }
  /** The key itself is wrong or disabled. */
  get isAuth(): boolean { return this.status === 401 || this.status === 403; }
}

export interface StreamEvent {
  /** Text to append to the visible answer. */
  delta?: string;
  /** The model wants to run tools; nothing is shown to the user for this event. */
  toolCalls?: { name: string; args?: Record<string, unknown> }[];
}

interface GeminiPart { text?: string; functionCall?: { name: string; args?: Record<string, unknown> } }

/**
 * POST to Gemini's streaming endpoint and yield events as they arrive.
 * Any parse hiccup on a partial chunk is skipped rather than thrown — the next chunk usually
 * completes it, and a malformed frame should never kill a live answer.
 */
export async function* streamGemini(
  model: string, key: string, body: unknown, signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    // Read the error body so a quota stall can be told apart from a bad key, and so we can
    // honour the server's own "retry in Ns" hint rather than guessing.
    let detail = '';
    let retryMs: number | null = null;
    try {
      const body = await res.text();
      detail = body.slice(0, 300);
      const m = /retry in ([0-9.]+)s/i.exec(body);
      if (m) retryMs = Math.ceil(parseFloat(m[1]!) * 1000);
    } catch { /* body already consumed or empty */ }
    throw new MentorApiError(res.status, retryMs, `Gemini ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by blank lines; each data: line holds one JSON object.
    const frames = buffer.split('\n');
    buffer = frames.pop() ?? '';
    for (const raw of frames) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      let parsed: { candidates?: { content?: { parts?: GeminiPart[] } }[] };
      try { parsed = JSON.parse(payload); } catch { continue; } // partial frame — next chunk finishes it
      const parts = parsed.candidates?.[0]?.content?.parts ?? [];
      const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall!);
      if (calls.length) yield { toolCalls: calls };
      const text = parts.map((p) => p.text).filter(Boolean).join('');
      if (text) yield { delta: text };
    }
  }
}

/** Human-readable label for each tool, shown live so the user can see the reasoning happen. */
export const TOOL_LABELS: Record<string, string> = {
  get_chart_overview: 'Reading your whole chart',
  get_life_area: 'Looking at that area of your life',
  get_timing: 'Checking your current timing',
  get_personality_read: 'Reading your temperament',
  get_advanced_chart_data: 'Going deeper into the chart',
  lookup_concept: 'Looking it up in the classical text',
  score_life_area: 'Scoring your chances',
  get_daily_reading: 'Reading today',
};
