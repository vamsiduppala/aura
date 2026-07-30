// ─────────────────────────────────────────────────────────────────────────────
// The date-hallucination validator (§4.7).
//
//   "The model never states a date or duration it didn't get from a tool call. Enforced
//    in the prompt *and* checked post-hoc by a validator that flags date-like tokens in
//    responses with no preceding tool result. Log violations; they're your
//    prompt-regression signal."
//
// Why this is the single most important guardrail in the product: the app's entire claim
// is that its dates are computed. A model that invents one plausible date does more damage
// than one that refuses ten questions, because the user cannot tell the difference — and
// this app's dates are checkable against a certificate, so being wrong is discoverable.
//
// The rule, stated precisely
// ──────────────────────────
// A date or duration in the assistant's reply is GROUNDED if the same value appears in
// something *we* put in the context this turn: the system prompt, the live state block, or
// a tool result. Otherwise it came from the model, and the model does not know this chart.
//
// Note what is deliberately grounded by the system prompt: the generic ranges ("a King
// reigns 6 to 20 years") are ours, so repeating them is fine. That falls out of the rule
// rather than needing an allowlist, which is why the rule is defined over "text we
// supplied" rather than over tool results alone.
//
// The user's own message is NOT grounding. If someone asks "what about 15 August" and the
// reply asserts something about 15 August, the date is the user's, not the engine's — a
// weaker problem than invention but still not a computed fact, so it gets its own severity
// and stays visible instead of being waved through.
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_ALT = `${MONTHS.join('|')}|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec`;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const monthIndex = (name: string): number => {
  const n = name.toLowerCase();
  const i = MONTHS.findIndex((m) => m.startsWith(n.slice(0, 3)));
  return i;
};
const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Every date-ish token we can recognise, with the canonical keys it could match on.
 *
 * A token carries MORE THAN ONE key on purpose. "14 August" has no year, so it can only
 * ever be compared month-and-day; "2026-08-14" can be compared in full. Comparing at the
 * most specific shared precision is what stops "August 2026" from being called a lie
 * because the grounded value was the 14th of that month.
 */
interface DateToken {
  text: string;
  /** `YYYY-MM-DD`, `MM-DD`, `YYYY-MM`, or `weekday:name`. First match wins. */
  keys: string[];
}

const DATE_PATTERNS: { re: RegExp; keys: (m: RegExpMatchArray) => string[] }[] = [
  // 2026-08-14 / 2026-08-14T09:00:00Z
  {
    re: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    keys: (m) => [`${m[1]}-${m[2]}-${m[3]}`, `${m[2]}-${m[3]}`, `${m[1]}-${m[2]}`],
  },
  // 14 August 2026 / 14th Aug 2026
  {
    re: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})\\.?,?\\s+(\\d{4})\\b`, 'gi'),
    keys: (m) => {
      const mo = pad(monthIndex(m[2]!) + 1);
      return [`${m[3]}-${mo}-${pad(Number(m[1]))}`, `${mo}-${pad(Number(m[1]))}`, `${m[3]}-${mo}`];
    },
  },
  // August 14, 2026 / Aug 14 2026
  {
    re: new RegExp(`\\b(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'gi'),
    keys: (m) => {
      const mo = pad(monthIndex(m[1]!) + 1);
      return [`${m[3]}-${mo}-${pad(Number(m[2]))}`, `${mo}-${pad(Number(m[2]))}`, `${m[3]}-${mo}`];
    },
  },
  // 14 August / August 14 (no year) — month-and-day precision only
  {
    re: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})\\.?\\b(?!\\s*,?\\s*\\d{4})`, 'gi'),
    keys: (m) => [`${pad(monthIndex(m[2]!) + 1)}-${pad(Number(m[1]))}`],
  },
  {
    re: new RegExp(`\\b(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\s*,?\\s*\\d{4})`, 'gi'),
    keys: (m) => [`${pad(monthIndex(m[1]!) + 1)}-${pad(Number(m[2]))}`],
  },
  // August 2026 — month precision only
  {
    re: new RegExp(`\\b(${MONTH_ALT})\\.?\\s+(\\d{4})\\b`, 'gi'),
    keys: (m) => [`${m[2]}-${pad(monthIndex(m[1]!) + 1)}`],
  },
  // 14/08/2026 — ambiguous order, so BOTH readings count as a match. A validator that
  // guessed the locale would flag correct output half the time.
  {
    re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
    keys: (m) => [
      `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`,
      `${m[3]}-${pad(Number(m[1]))}-${pad(Number(m[2]))}`,
    ],
  },
  // Bare weekday: "your Governor changes on Tuesday".
  {
    re: new RegExp(`\\b(${WEEKDAYS.join('|')})\\b`, 'gi'),
    keys: (m) => [`weekday:${m[1]!.toLowerCase()}`],
  },
];

/** Pull every recognisable date token out of a string. */
export function dateTokens(text: string): DateToken[] {
  const out: DateToken[] = [];
  const claimed: [number, number][] = [];
  for (const { re, keys } of DATE_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      // Patterns are ordered most-specific first; skip anything already covered so
      // "14 August 2026" is one token, not also a bare "14 August" and "August 2026".
      if (claimed.some(([s, e]) => start < e && end > s)) continue;
      claimed.push([start, end]);
      out.push({ text: m[0], keys: keys(m) });
    }
  }
  return out;
}

/**
 * The canonical keys a body of grounding text vouches for.
 *
 * An ISO date also vouches for its weekday and its month, because a model quite reasonably
 * renders `2026-08-14` as "Friday" or "August 2026" and that is a faithful restatement of
 * data it was given, not a new claim.
 */
export function groundedKeys(text: string): Set<string> {
  const keys = new Set<string>();
  for (const t of dateTokens(text)) for (const k of t.keys) keys.add(k);
  // Weekday + month expansion for anything we can resolve to a real day.
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) {
      keys.add(`weekday:${WEEKDAYS[d.getUTCDay()]}`);
      keys.add(`${m[1]}-${m[2]}`);
      keys.add(`${m[2]}-${m[3]}`);
    }
  }
  return keys;
}

/** Numbers attached to a time unit: "7 days", "three months", "18 months left". */
const DURATION_RE =
  /\b(\d+(?:\.\d+)?)\s*(year|yr|month|mo|week|wk|day|hour|hr|minute|min)s?\b/gi;

export function durationTokens(text: string): { text: string; value: number; unit: string }[] {
  const out: { text: string; value: number; unit: string }[] = [];
  for (const m of text.matchAll(DURATION_RE)) {
    out.push({ text: m[0], value: Number(m[1]), unit: m[2]!.toLowerCase() });
  }
  return out;
}

export type ViolationKind = 'invented_date' | 'echoed_date' | 'invented_duration';

export interface Violation {
  kind: ViolationKind;
  /** The offending text, as written. */
  token: string;
  /** Plain-language explanation, for the log line and the regression report. */
  why: string;
}

export interface ValidationInput {
  /** What the assistant said. */
  reply: string;
  /**
   * Everything WE supplied this turn: system prompt, live state block, and every tool
   * result. Order and formatting are irrelevant — only the values matter.
   */
  grounding: string[];
  /** The user's own words this turn. Grounds nothing; only softens the severity. */
  userText?: string;
  /** How many tools actually ran. Zero + a date is the unambiguous failure. */
  toolCalls: number;
}

export interface ValidationResult {
  ok: boolean;
  violations: Violation[];
  /** Counts for the regression signal, whether or not anything failed. */
  stats: { dates: number; durations: number; toolCalls: number };
}

/**
 * Check a finished reply against what the model was actually given.
 *
 * This never rewrites or blocks the reply — by the time it runs the text has already been
 * streamed to the user, and silently swallowing a streamed answer is its own kind of lie.
 * It produces the signal. The caller decides what to do with it (log it, flag the message
 * in the UI, fail a prompt-regression run).
 */
export function validateReply(input: ValidationInput): ValidationResult {
  const { reply, grounding, userText = '', toolCalls } = input;
  const grounded = groundedKeys(grounding.join('\n'));
  const echoed = groundedKeys(userText);

  const violations: Violation[] = [];
  const dates = dateTokens(reply);
  for (const t of dates) {
    if (t.keys.some((k) => grounded.has(k))) continue;
    if (t.keys.some((k) => echoed.has(k))) {
      violations.push({
        kind: 'echoed_date',
        token: t.text,
        why: toolCalls === 0
          ? `"${t.text}" came from the user's message and no tool ran, so nothing computed it.`
          : `"${t.text}" came from the user's message rather than from a tool result.`,
      });
      continue;
    }
    violations.push({
      kind: 'invented_date',
      token: t.text,
      why: toolCalls === 0
        ? `"${t.text}" appears in a reply that made no tool calls at all.`
        : `"${t.text}" is in none of the ${toolCalls} tool result(s) it was given.`,
    });
  }

  // Durations are checked on the number alone. A duration is a restatement of a boundary
  // ("7 days left" from an end timestamp), so demanding an exact string match would flag
  // every correct answer; demanding the NUMBER appear somewhere we supplied it catches
  // invention while tolerating rounding and phrasing.
  const groundingText = grounding.join('\n');
  const durations = durationTokens(reply);
  for (const d of durations) {
    const n = String(d.value);
    if (groundingText.includes(n)) continue;
    // Round-trip tolerance: "about 3 weeks" against a grounded 21 days, and the reverse.
    if (nearbyForms(d.value, d.unit).some((alt) => groundingText.includes(alt))) continue;
    violations.push({
      kind: 'invented_duration',
      token: d.text,
      why: `the number in "${d.text}" appears nowhere in what the model was given.`,
    });
  }

  return {
    ok: violations.length === 0,
    violations,
    stats: { dates: dates.length, durations: durations.length, toolCalls },
  };
}

/**
 * Other numbers that would legitimately produce this duration — so "3 weeks" is accepted
 * when the grounding says 21 days, and "2 months" when it says 61. Conversions are
 * deliberately generous (a month is 28–31 days) because the failure we are hunting is
 * invention, not arithmetic sloppiness, and a false positive here trains people to ignore
 * the log.
 */
function nearbyForms(value: number, unit: string): string[] {
  const perUnit: Record<string, number[]> = {
    year: [365, 366, 12, 52], yr: [365, 366, 12, 52],
    month: [28, 29, 30, 31, 4], mo: [28, 29, 30, 31, 4],
    week: [7], wk: [7],
    day: [24], hour: [60], hr: [60], minute: [60], min: [60],
  };
  const factors = perUnit[unit] ?? [];
  const out: string[] = [];
  for (const f of factors) {
    const n = value * f;
    out.push(String(n));
    if (!Number.isInteger(n)) out.push(String(Math.round(n)));
    out.push(String(Math.floor(n)), String(Math.ceil(n)));
  }
  return out;
}

/** One log line per violating reply — the prompt-regression signal, greppable. */
export function violationLogLine(
  r: ValidationResult, ctx: { threadId: string; messageId: string; model: string },
): string {
  const list = r.violations.map((v) => `${v.kind}:${JSON.stringify(v.token)}`).join(' ');
  return `mentor.ungrounded thread=${ctx.threadId} message=${ctx.messageId} `
    + `model=${ctx.model} tools=${r.stats.toolCalls} count=${r.violations.length} ${list}`;
}
