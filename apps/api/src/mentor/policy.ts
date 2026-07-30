// ─────────────────────────────────────────────────────────────────────────────
// Mentor model policy and token budget (§4.7).
//
// Two rules from the spec drive this file:
//
//   "Pin exact model IDs in config, never hardcode; route via a MentorModelPolicy table
//    so you can shift tiers without a deploy."
//
//   "Per-user token budget with a soft cap -> degrade to [the cheap model], hard cap ->
//    paywall."
//
// So the model IDs live in a database table, seeded from environment variables, seeded in
// turn from the defaults below. Changing which model answers is an UPDATE, not a release.
// That matters more than it sounds: model IDs from the 4.6 generation onward are fixed
// snapshots rather than evergreen pointers, so an upgrade is a deliberate act that wants a
// prompt-regression run behind it — not something to discover in a diff.
// ─────────────────────────────────────────────────────────────────────────────

import { getDb } from '../db.js';

/**
 * Why a request is being routed, rather than which model it lands on. The caller picks an
 * intent; the table picks the model. Nothing outside this file names a model.
 */
export type MentorTier = 'default' | 'deep' | 'premium' | 'utility';

/**
 * Defaults, overridable by env and then by the table.
 *
 * DEVIATION FROM THE SPEC, on purpose: §4.7's table puts `claude-sonnet-5` on the default
 * conversation tier for cost, and `claude-opus-5` only on deep readings. This build runs
 * Opus on both. The spec was sizing for many users on a metered budget; this is a
 * single-profile local build where answer quality on the *ordinary* question is the whole
 * point, and the Mentor's ordinary question ("what is my Prime Minister doing to my work")
 * is a multi-tool reasoning task, not a lookup. `MENTOR_MODEL_DEFAULT=claude-sonnet-5`
 * restores the spec exactly, with no code change — which is the reason this table exists.
 */
const DEFAULT_MODELS: Record<MentorTier, string> = {
  // The 80% case: several tool calls, then a reading that has to hold five nested periods
  // and their relationships in mind at once.
  default: 'claude-opus-5',
  // Multi-step readings and plan reasoning.
  deep: 'claude-opus-5',
  // Optional maximum-capability tier. Not wired to a paywall yet (M6).
  premium: 'claude-fable-5',
  // Thread titling, intent classification, the safety pre-check: cheap, fast, high volume.
  utility: 'claude-haiku-4-5',
};

const ENV_KEY: Record<MentorTier, string> = {
  default: 'MENTOR_MODEL_DEFAULT',
  deep: 'MENTOR_MODEL_DEEP',
  premium: 'MENTOR_MODEL_PREMIUM',
  utility: 'MENTOR_MODEL_UTILITY',
};

const TIERS: MentorTier[] = ['default', 'deep', 'premium', 'utility'];

/**
 * Daily per-user token budget, counting input + output across every tier.
 *
 * The soft cap does not refuse — it drops to the utility model and says so. A slower,
 * cheaper answer with the same tool results behind it is still a true answer; silence is
 * not. The hard cap refuses in plain words rather than truncating mid-reading.
 */
export interface Budget { soft: number; hard: number }

const envInt = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const budget = (): Budget => ({
  soft: envInt('MENTOR_BUDGET_SOFT', 250_000),
  hard: envInt('MENTOR_BUDGET_HARD', 600_000),
});

/**
 * Seed the policy table. Idempotent: an existing row is left alone, because it may have
 * been changed deliberately at runtime and a restart must not silently revert that.
 * Delete the row to fall back to env/defaults.
 */
export function seedModelPolicy(): void {
  const db = getDb();
  const insert = db.prepare(
    'INSERT INTO mentor_model_policy (tier, model_id) VALUES (?, ?) ON CONFLICT(tier) DO NOTHING',
  );
  for (const tier of TIERS) {
    insert.run(tier, process.env[ENV_KEY[tier]]?.trim() || DEFAULT_MODELS[tier]);
  }
}

/** The model ID currently serving a tier. Falls through table -> env -> default. */
export function modelFor(tier: MentorTier): string {
  const row = getDb()
    .prepare('SELECT model_id FROM mentor_model_policy WHERE tier = ?')
    .get(tier) as { model_id: string } | undefined;
  return row?.model_id || process.env[ENV_KEY[tier]]?.trim() || DEFAULT_MODELS[tier];
}

/** The whole table, for the account screen and for support triage. */
export function modelPolicy(): Record<MentorTier, string> {
  return Object.fromEntries(TIERS.map((t) => [t, modelFor(t)])) as Record<MentorTier, string>;
}

/** Point a tier at a different model without a deploy. Returns the value now in force. */
export function setModelFor(tier: MentorTier, modelId: string): string {
  const id = modelId.trim();
  if (!id) throw new Error('A model ID is required.');
  getDb()
    .prepare(
      `INSERT INTO mentor_model_policy (tier, model_id, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(tier) DO UPDATE SET model_id = excluded.model_id, updated_at = datetime('now')`,
    )
    .run(tier, id);
  return modelFor(tier);
}

/**
 * Which tier should serve this turn, given the day's spend so far.
 *
 * `requested` is what the caller wants; the budget can only ever downgrade it. There is no
 * path here that upgrades a tier, so a client cannot spend its way to Fable by asking.
 */
export function tierUnderBudget(
  requested: MentorTier,
  spentToday: number,
  b: Budget = budget(),
): { tier: MentorTier; degraded: boolean; blocked: boolean } {
  if (spentToday >= b.hard) return { tier: 'utility', degraded: true, blocked: true };
  if (spentToday >= b.soft && requested !== 'utility') {
    return { tier: 'utility', degraded: true, blocked: false };
  }
  return { tier: requested, degraded: false, blocked: false };
}
