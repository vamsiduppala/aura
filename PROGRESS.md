# Progress tracker — aura

Source of truth for "what's done / what's next". Update after every unit of work.
Resuming agents: read this first, then continue the first unchecked task.

**Legend:** [x] done+tested · [~] in progress · [ ] not started

Last updated: 2026-07-21 ~11:20 CDT (session 1). Phases 1–5 complete; 52 engine tests green.

---

## Phase 0 — Scaffolding & handoff
- [x] git init, dir structure
- [x] AGENT_HANDOFF.md, docs/SPEC.md, DECISIONS.md, QUESTIONS.md, PROGRESS.md
- [x] npm workspaces root + engine package + tsconfig + vitest
- [x] GitHub private remote + first push (github.com/vamsiduppala/cosmicmentor)
- [~] Auto-resume schedule — scripts written; needs 1 owner command to arm (see QUESTIONS Q-10).
      Both cloud + local auto-registration were guarded/blocked; enabler script ready.

## Phase 1 — Engine core (Tiers 0–2)  ✅ COMPLETE (29 tests, typecheck clean)
- [x] `types.ts` — full data model (SPEC §7)
- [x] Constants: grahas, energies, nakshatras, dignities, Vimshottari order/years
- [x] Astronomy utils: sidereal helpers, Lahiri ayanamsa, JD from datetime+offset
- [x] `Ephemeris` interface + astronomia impl + FixedEphemeris (test double)
- [x] Chart construction: Lagna, whole-sign houses, nakshatra+pada, dignity, aspects, polarity
- [x] Vimshottari 5-level dasha engine: getStackAt, getPeriodsAt, buildDashaTree
- [x] Transit/gochara: daily positions, Sade Sati phase, Jupiter house, transiting Moon
- [x] TESTS: dasha arithmetic goldens (hand-computed) — EXACT (stronger than "within a day")
- [x] TESTS: nakshatra/pada + whole-sign house invariant
- [x] TESTS: pipeline validated via external calendar anchors (Makara/Meena Sankranti),
      ascendant trig anchors, exaltation sanity (Mars/Venus exalted in Einstein chart)
- [x] External golden DONE: cross-checked Einstein's chart vs multiple established Jyotish
      sources (astrosage, astro-seek, vedicmarga, ganeshaspeaks). Engine reproduces ALL six
      discrete facts — Moon Scorpio/Jyeshtha, Sun Pisces, Gemini lagna, Mars exalted in the 8th,
      and the Jupiter↔Saturn 9th/10th-lord exchange. Locked as 4 tests.
- [x] **Phase 1 acceptance met** (with the documented follow-up above)

## Phase 2 — Lattice + synthesis (Tiers 3–5)  ✅ COMPLETE (40 tests total, typecheck clean)
- [x] 108 Signal Lattice (9×12), static cell scoring (magnitude/quality split, D-07)
- [x] Temporal modulation (dasha + transit + check-in weights)
- [x] Aggregation → energyScore, houseScore, major/passing, dominantAreas
- [x] `computeReadingInput(chart, date, ephem, {checkin, goalArea}) → ReadingInput`
- [x] Five-beat generator + template bank (all 9 energies × 5 beats × area specializations)
- [x] Forecast builder (daily/weekly/monthly/custom) + pinned maha flip
- [x] Blueprint deriver (standing energies, 4 distinct roles)
- [x] TESTS: two charts differ; same chart across 21 days differs; dasha moves over a year
- [x] no-jargon lint test over content + generated readings (daily/expanded/blueprint/forecast)
- [x] **Phase 2 acceptance met** (eyeballed: readings are coherent, honest, non-doom, jargon-free)
- NOTE: dasha now spans 2 Vimshottari cycles (240y) so old charts / long forecasts don't fall off.

## Phase 3 — UI (Tier 7)  ✅ COMPLETE (apps/web, all 7 screens visually verified)
- [x] Real mockup vendored (docs/mockups/) — visual source of truth
- [x] Web app scaffold (Vite+React+TS, D-09) + design tokens + fonts + ported CSS
- [x] Aura orb component (two-tone gradient, reduced-motion) — the signature, verified
- [x] Screens: Onboarding, Today, Reading, Check-in, Forecast, Expanded, Blueprint — all wired to engine
- [x] Navigation (Today/Forecast/Blueprint + pushed Reading/Checkin/Expanded)
- [x] Builds clean (vite build), typecheck clean, rendered + screenshotted (docs/screens/)
- [x] **Phase 3 acceptance met** — real birth date flows onboarding→today→reading→forecast→
      expanded→blueprint end-to-end, no jargon, goal-specialized moves, fixed "Turns →" bug.
- NOTE (D-09): built as a Vite web app (verifiable + de-risks astronomia bundling) rather than
  Expo mobile. Expo mobile app = follow-up; components/CSS translate. Bundle is 1.3MB (VSOP87
  data) — code-split/lazy-load the ephemeris for production (tracked, non-blocking).
- Per-day reading cache + encrypted local storage: deferred to Phase 5 (privacy).

## Phase 4 — Content depth & check-in  ✅ SUBSTANTIALLY COMPLETE
- [x] Template bank for all 9 energies × 5 beats + life-area specializations (career/money/etc.)
- [x] Check-in modulation wired (mood→energy nudges, focus→life-area house lift) in the lattice
- [x] Remedy library complete (App E) + deterministic rotation
- [x] Freshness verified (21-day distinct-readings test) + goal specialization verified in UI
- [~] MORE variants would deepen non-repetition further (3+ per beat) — nice-to-have, non-blocking
- [x] **Phase 4 acceptance met** (readings specific + non-repeating across a week)

## Phase 5 — Safety, privacy, polish  ✅ COMPLETE (52 engine tests, all screens verified)
- [x] Disclaimers — onboarding + Settings screen (reflection/entertainment, §11.1)
- [x] Crisis/self-harm guardrail + region resources (§11.3) — VERIFIED in UI (screenshot 09)
- [x] No-doom content guard + lint over bank & generated readings (§11.2)
- [x] Privacy + one-tap delete (localStorage persistence + Delete-everything, §11.6);
      web uses localStorage, mobile will use encrypted secure-store (documented in Settings)
- [x] Anti-dark-pattern by design: one reading/day, gentle non-punitive streak, no manipulative push (§11.5)
- [x] Remedy safety: behavioral-only library, guarded (§11.4)
- [x] Optional guarded LLM polish (OFF by default) + strict guardrail prompt + doom-fallback (§11.7)
- [x] **Phase 5 acceptance met**
- FOLLOW-UP: at-rest encryption is real only in the mobile build (secure-store); the web preview's
  localStorage is documented as such in-app. No PII ever leaves the device (no analytics on birth data).

---

## Session 2 (owner active, ~11:30 CDT) — new directives
- [x] Q-09: dropped streak → non-resetting "Total readings".
- [x] **Accuracy (dir 2):** Navamsa (D9) + vargottama, Shadbala-inspired strength (D1+D9
      dignity, dig/cheshta/naisargika/paksha), Ashtakavarga (BAV+SAV, 337 invariant). All wired
      into the lattice + tested. 66 engine tests.
- [x] **Enterprise arch (dir 1):** `Aura` engine facade (DI) + web storage service; App is a thin
      router. (Zustand store = optional next step; facade+service already separate concerns.)
- [x] **Responsive redesign (dir: 4 platforms):** removed the fake phone frame; `apps/web` is now
      fluid — desktop sidebar + wide layout, mobile top/bottom nav, modal expanded reading.
- [x] Design system abstracted → `docs/DESIGN_SYSTEM.md`; 4-platform strategy → `docs/PLATFORMS.md`.
- [x] Native skeletons: `apps/ios/Aura/AuraApp.swift` (SwiftUI), `apps/android/aura/AuraApp.kt`
      (Compose) — design system translated + native nav; compile against a ported engine core.
- [x] Live HMR dev server at :5173 (dir 4) so the owner watches changes land.
- [ ] shadcn adoption (dir 3): pending — see notes. Recommended incremental path documented.

## Session 3 (strategic pivot: retention + trust) — DONE
- [x] **Feature 1 — "Prove It" retrospective:** engine run backwards ~18mo → 3 distinct past
      shifts, past-tense "what happened" copy, biased to focus area. New Audit screen between
      onboarding and Today. (synthesis/retrospective.ts, screens/Audit.tsx)
- [x] **Feature 2 — sharper Trap:** each energy gets a pointed behavioral call-out (the text
      message, isolating under pressure, smoothing-over vs the honest sentence, the highlight
      reel), framed as a temporary loop with the way out. Passes no-jargon + no-doom.
- [x] **Feature 3 — Cosmic Mentor chat (8th screen):** Gemini forced function-calling over the
      real engine; LLM narrates only. Deterministic fallback so it works offline. Crisis + no-doom
      guarded. (mentor/query.ts, mentor/prompt.ts, services/chat.ts, screens/Chat.tsx). Nav updated.
- Deepening (same session): retrospective variety (2 variants/energy, seeded); classical **Yogas**
  → "Born gifts" on the Blueprint; the Mentor now offers the user's REAL born-gift strength as the
  way out; **web integration smoke tests** (jsdom) driving the whole flow + crisis routing; users
  can paste their own **Gemini key in Settings**; app state centralized in a **Zustand store**
  (App = thin router). Engine 75 tests + web 2 tests, all green; both typechecks clean.
- Key stored in apps/web/.env.local (gitignored, verified untracked). See D-10, D-11.
- NOTE: chat renders the deterministic fallback (Gemini free-tier quota exhausted); LLM narration
  turns on automatically when quota resets or a fresh key is set in Settings.

## Session log
- **S1 2026-07-21 04:01 CDT:** Env check, scaffolding, handoff docs, decisions/questions.
  Building engine core next. Token budget: working until exhaustion; cloud resume scheduled.
- **S2 2026-07-21 ~11:30 CDT:** Owner returned early, answered all questions + 4 new directives.
  Accuracy techniques, enterprise facade/service, responsive redesign (no phone frame), design
  system + native skeletons. Engine 66 tests green; web builds + HMR live.
