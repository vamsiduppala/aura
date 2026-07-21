// ─────────────────────────────────────────────────────────────────────────────
// Safety guardrails (Tier 8, SPEC §11). Two jobs:
//  1. Crisis detection — if a user's free text signals self-harm/crisis, the app
//     must NOT "read" it. It surfaces support + resources instead (§11.3).
//  2. No-doom content guard — content must never predict death/illness/disaster or
//     dated catastrophe (§11.2). Used by the no-doom lint over the template bank.
// These are conservative, transparent, keyword-based checks — not a diagnosis.
// ─────────────────────────────────────────────────────────────────────────────

/** Phrases that indicate possible crisis / self-harm. Specific to avoid false hits. */
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)?\s+(myself|me)\b/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\b(want|going|plan)\w*\s+to\s+die\b/i,
  /\b(don['’]?t|do not|no reason to)\s+(want\s+to\s+)?(live|be here|go on)\b/i,
  /\bsuicid\w*/i,
  /\bself[-\s]?harm\b/i,
  /\b(hurt|harm|cut)\w*\s+(myself|me)\b/i,
  /\bwish(ed)?\s+i\s+(was|were)\s+dead\b/i,
  /\bno\s+point\s+(in\s+)?(living|going on)\b/i,
];

/** True if `text` shows crisis signals. Never used to diagnose — only to route to help. */
export function detectCrisis(text: string | undefined | null): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export interface SupportResource { region: string; label: string; contact: string; }

/** Region-appropriate help. Kept generic + expandable; not exhaustive. */
export const SUPPORT_RESOURCES: SupportResource[] = [
  { region: 'US', label: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988' },
  { region: 'UK & ROI', label: 'Samaritans', contact: 'Call 116 123' },
  { region: 'India', label: 'KIRAN Mental Health Helpline', contact: 'Call 1800-599-0019' },
  { region: 'International', label: 'Find a helpline', contact: 'findahelpline.com' },
];

export const SUPPORT_MESSAGE =
  'It sounds like you’re carrying something really heavy right now. The stars aren’t the ' +
  'right place to take this — a person is. You deserve real support, and it’s available. ' +
  'Please reach out to someone below. You matter, and this can get lighter.';

// ── No-doom content guard (§11.2) ────────────────────────────────────────────

/** Deterministic-doom / catastrophe phrasings that must never appear in content. */
const DOOM_PATTERNS: RegExp[] = [
  /\b(you will|you'?ll|going to|will surely|destined to)\s+(die|fail|lose everything|be ruined|suffer)\b/i,
  /\b(death|dying|fatal|terminal illness|disease|cancer|tumou?r)\b/i,
  /\b(disaster|catastrophe|doom(ed)?|tragedy|calamity|ruin(ed)?)\b/i,
  /\b(divorce|bankrupt(cy)?|fired|accident|hospital)\s+(is coming|awaits|guaranteed|certain)\b/i,
  /\bcursed\b/i,
];

export interface DoomCheck { ok: boolean; matches: string[]; }

/** Returns ok=false + the offending fragments if `text` contains doom phrasing. */
export function checkNoDoom(text: string): DoomCheck {
  const matches: string[] = [];
  for (const re of DOOM_PATTERNS) {
    const m = text.match(re);
    if (m) matches.push(m[0]);
  }
  return { ok: matches.length === 0, matches };
}

/** The reflection/entertainment disclaimer shown in onboarding + settings (§11.1). */
export const DISCLAIMER =
  'aura is for reflection and self-understanding — not medical, psychological, financial, ' +
  'or legal advice. Your energies are prompts to think with, never predictions or directives. ' +
  'You’re always the one steering.';
