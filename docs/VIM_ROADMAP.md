# Vimshottari — implementation list

The single work queue for `apps/vim` and the parts of `apps/api` it needs. Both agents work
from this file; progress notes go in `GEMINI.md` §4, not here. Check items off as they land.

Legend: **[x]** done · **[~]** partially done, see note · **[ ]** not started

---

## M1 · Engine + foundation

- [x] `getCourtAt()` / `nextPeriodAt()` in `packages/engine` — the five nested periods with
      real boundaries, which a progress ring needs and `getStackAt` didn't give. 7 tests.
- [x] `apps/vim` scaffold: React 18 + Vite + TS, port 5174, `viewport-fit=cover`.
- [x] Design tokens (`theme/tokens.ts`) and the neumorphic CSS system (`theme/app.css`,
      `theme/components.css`). Surfaces, ink, brass, radii, raised/inset recipes, type scale.
- [x] `core/court.ts` — confidence gate, `birthInstantUTC`, `courtAt`, `nextTurn`,
      `periodsBetween`, `chooseCutLevel`.
- [x] `core/time.ts` — duration humanising, countdown parts, date ranges.
- [x] `hooks/useNow` (visibility-aware, two cadences), `hooks/useReducedMotion`.
- [x] Tests: confidence gate table, monotonic degradation, real-chart court, time formatting,
      **and the no-mock-data guard** (fails if any src file gains a hardcoded birth date,
      a `SAMPLE_*` fixture, a banned word, or a superseded vocabulary term).

## M2 · Onboarding + Timeline — a complete, shippable app on its own

- [x] `components/Wheel.tsx` — five SVG arcs, round caps, tapered strokes, same-lord gap +
      85% opacity, staggered outward-in load, nearest-ring-centre hit-testing, per-ring
      `aria-label`, reduced-motion snap.
- [x] Welcome (no signup yet — chart before account).
- [x] Onboarding: name → date (13+ gate, 120-year bound) → time + **confidence selector with
      the live consequence line** → place (real geocoder, historical UTC offset shown) →
      reveal. Every field starts empty and gates Continue.
- [x] Timeline: Wheel + centre readout, Your Court table (fastest first, brass time pills,
      approximate rows routing to the birth-time fix), Biggest Change Ahead with the live
      segmented countdown and the handover rail.
- [x] Daśā detail (`OfficeDetail`): hierarchy crumb, dates, progress, **In the Kingdom**,
      Advantage/Obstacle tabs, and easier/rougher sub-windows graded by the classical
      natural-relations rule.
- [x] `content/court.ts` — authored per-planet blocks × per-office timescale framing.
- [x] Sign in / register / continue-on-device, with honest degradation when the API is down.
- [x] You: birth details, confidence + drift table, chart facts, display prefs, account,
      server address, delete everything.
- [x] PWA manifest + service worker precache; generated icon set; Capacitor config for
      Android and iOS.
- [ ] **Turn while the app is open** — detect a boundary crossing on the 60s tick and play the
      900ms colour bleed. Values must never change silently.
- [ ] Saturn starfield / Rāhu counter-drift motion signatures (R16: identity is never hue
      alone). Currently hue + name only.
- [ ] Long-press a ring → floating chip (`Governor · Mercury · 22d left`), dimming the others.
- [ ] First-run Wheel tooltip, once only.
- [ ] Scrubber (`◀1y ◀1m NOW 1m▶ 1y▶` + Jump to date) with the persistent
      "Viewing 12 Mar 2029 — Return to now" pill. Spec defers this to v1.1.
- [x] Verify in a real browser: measure for clipping/overflow, drive the flow with JS.
      Done against a real profile; found and fixed the rAF bug and a 46x28 tap target.

## M2b · Engine hardening (new-structure.md §3) — Part 2, done

- [x] Integer microsecond arithmetic. Was float ms; `DashaPeriod` now carries `startUs`/`endUs`.
- [x] Half-open `[start, end)` with children summing to the parent exactly — boundaries derived
      from cumulative year totals, so the last child closes on the parent by construction.
- [x] No clock inside the engine, enforced by a test that greps the source.
- [x] Ayanāṁśa is a stored parameter (`chart.ayanamsaSystem`), not a constant.
- [x] `ENGINE_VERSION` stamped on every chart + `boundaryDrift()` for the M19 recompute-and-diff
      path, 6-hour notify threshold.
- [x] `boundaryUncertaintyMs` / `boundaryConfidence` — the §1.1 drift table as arithmetic,
      asserted against every published row.
- [x] `packages/vectors` — 41 golden fixtures, language-agnostic JSON, run in CI.
- [x] Property tests (M14b): exact sums, half-open resolution, monotonicity, idempotence.
- [ ] Rectification lane (§4.1): accept a time range, search a ± window for the birth time whose
      boundaries best fit 3–5 dated life events. The honest premium feature.

## M3 · Content depth

- [~] Layer (a): generic per planet × office. **Done** as one authored block per planet plus an
      office timescale frame — real copy, no placeholders.
- [ ] Deepen to 45 bespoke blocks (9 planets × 5 offices) where the office genuinely changes
      the content, not just the timescale.
- [ ] Health-category extra line wherever the body is mentioned.

## M4 · Planner

- [x] Plan model stored as **inputs only** (category, situation, horizon) — never computed
      dates, so an engine fix can't leave stale rows.
- [x] New-plan questionnaire: category chips → situation chips + free text → horizon
      (with the "that's a fast one" push-back) → reminders.
- [x] Stage cutting via `chooseCutLevel` + `periodsBetween`. **2–9 stages, never padded.**
      Exactly 1 period → a single card, no pipeline.
- [x] Stage headings from per-planet verb families × category. Never "Phase 1".
- [x] The pipeline: nodes, connectors, three stage states, breathing halo on the current
      stage, crawling dashed connector, checkmark draw-in.
- [x] Plan detail wheel + task detail with Advantage/Obstacle and a real checklist.
- [ ] Course Correct + **the diff view** — never rewrite a plan silently.
- [ ] Archive / delete with named confirms.

## M5 · Mentor

- [~] Live state block computed locally and **shown to the user**, plus the honest
      "deepest level I'll answer at" line. Done.
- [ ] Threads: list, grouping by recency, rename/pin/delete, search.
- [ ] Streaming answers; tool-calling over the engine (`get_current_court`,
      `get_ruler_at`, `get_next_turns`, `list_plans`, `search_content`).
- [ ] Source disclosure chip showing which values were actually read.
- [ ] Safety pre-check before the main model; crisis input bypasses the astrology answer.
- [ ] Refuse Magistrate/Messenger-level answers at low confidence, offer the PM level.
- [ ] "Continue in a new thread from here" fork.
- [ ] Honest degradation with no model configured: answer from the engine, say so.

## M6 · Account, identity & commerce

Full detail in **`docs/ACCOUNT_AND_COMMERCE.md`**. Ordered by severity, not by ease.

- [ ] **S1-1/2/9** Session hardening: store `token_hash` not the token, `expires_at`,
      `last_seen_at`, device label, `GET`/`DELETE /auth/sessions`.
- [ ] **S1-3** Login protection: failed-attempt counter, lockout, per-IP + per-account limits.
- [ ] **S1-4/5** Email verification and password reset via a hashed, single-use `auth_codes`.
- [ ] **S1-6** Re-auth elevation for delete / export / email change.
- [ ] **S2-7** Password policy beyond length: common-list rejection, optional breach check.
- [ ] **S2-8** Account states + 30-day soft delete with an undo path.
- [ ] **S2-10** Audit log on every auth path. Never contains birth data.
- [ ] **S2-11** Phone + OTP (primary for the India-first audience), then Apple, then Google.
      Apple becomes mandatory the moment Google ships.
- [ ] **S3-14** Multi-chart: `charts` table, migration from `profiles`, switcher, Y1.
- [ ] **S3-16** Account header with the **derived monogram avatar tinted by the current
      King's colour** — no upload, no moderation, and it changes when the King changes.
- [ ] **S3-15** Entitlements: server-authoritative table, free-tier enforcement, the Y6
      comparison screen.
- [ ] Store integration: StoreKit 2, Play Billing, Stripe. Idempotent webhooks. Restore.
- [ ] **Birth-time rectification** — the honest premium feature, and the only one that
      actually fixes the drift the confidence gate exists because of.
- [ ] **S3-22** Passkeys, which retires most of the password surface.
- [ ] Export (JSON + PDF), notification preferences, locale (hi/te/ta), legal acceptance
      record, support context endpoint.

## M7 · Platform

- [x] Website + PWA + Android + iOS from one build (`cap:sync`).
- [ ] `npx cap add android` / `add ios` run once and committed.
- [ ] Notifications scheduled **server-side** — local notifications break the moment the user
      changes timezone or doesn't open the app for a week.
- [ ] Deep links: `vim://plan/{id}/stage/{n}`, `vim://timeline/office/{level}`, and the
      web `#/office/{level}` equivalent. Cold launch must route correctly.
- [~] `#/office/{level}` handled. Native scheme + plan links outstanding.
- [ ] Home screen widget (current court) and iOS Live Activity for the handover countdown —
      the best retention feature available here, and roughly three days of work.
- [ ] Airplane-mode pass before any release.

## Standing quality gates

Every chunk, before commit:

- [ ] `npm run typecheck` clean across all five workspaces.
- [ ] `npm test` green (currently 400 tests: engine 175, knowledge 124, vim 52, web 29,
      api 20).
- [ ] `npm run check:generated` clean — tokens/dist and vectors.json are not stale.
- [ ] No mock/static/demo data on any user-facing path — the guard test enforces it.
- [ ] New calculations verified against a worked example, cited in the test name.
- [ ] `GEMINI.md` §4 updated with what was done, learned, and left.
