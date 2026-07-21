# Progress tracker — aura

Source of truth for "what's done / what's next". Update after every unit of work.
Resuming agents: read this first, then continue the first unchecked task.

**Legend:** [x] done+tested · [~] in progress · [ ] not started

Last updated: 2026-07-21 ~04:10 CDT (session 1)

---

## Phase 0 — Scaffolding & handoff
- [x] git init, dir structure
- [x] AGENT_HANDOFF.md, docs/SPEC.md, DECISIONS.md, QUESTIONS.md, PROGRESS.md
- [x] npm workspaces root + engine package + tsconfig + vitest
- [x] GitHub private remote + first push (github.com/vamsiduppala/cosmicmentor)
- [~] Auto-resume schedule — scripts written; needs 1 owner command to arm (see QUESTIONS Q-10).
      Both cloud + local auto-registration were guarded/blocked; enabler script ready.

## Phase 1 — Engine core (Tiers 0–2)  ← CURRENT
- [ ] `types.ts` — full data model (SPEC §7)
- [ ] Constants: grahas, energies, nakshatras, dignities, Vimshottari order/years
- [ ] Astronomy utils: sidereal helpers, Lahiri ayanamsa, JD from datetime+offset
- [ ] `Ephemeris` interface + Moshier impl (or self-contained) + accuracy check
- [ ] Chart construction: Lagna, whole-sign houses, nakshatra+pada, dignity, aspects, polarity
- [ ] Vimshottari 5-level dasha engine: getStack, getTransitions, precomputed tree
- [ ] Transit/gochara: daily positions, Sade Sati phase, Jupiter house, transiting Moon
- [ ] TESTS: dasha arithmetic goldens (hand-computed) — exact
- [ ] TESTS: nakshatra/pada + whole-sign house vs known values
- [ ] TESTS: dasha timelines vs ≥3 reference charts within a day
- [ ] **Phase 1 acceptance met**

## Phase 2 — Lattice + synthesis (Tiers 3–5)
- [ ] 108 Signal Lattice (9×12), static cell scoring
- [ ] Temporal modulation (dasha + transit + check-in weights)
- [ ] Aggregation → energyScore, houseScore, major/passing, dominantAreas
- [ ] `computeReading(chart, date, checkin?) → ReadingInput`
- [ ] Five-beat generator + template bank (skeleton for all 9 energies)
- [ ] Forecast builder (daily/weekly/monthly/custom) + pinned maha flip
- [ ] Blueprint deriver (standing energies)
- [ ] TESTS: two charts differ; same chart different days differ; snapshot beats
- [ ] no-jargon lint test over content
- [ ] **Phase 2 acceptance met**

## Phase 3 — UI (Tier 7)
- [ ] Static HTML mockup of 7 screens (quick visual review) — docs/mockups/
- [ ] Expo app scaffold + design tokens + fonts
- [ ] Aura orb component (two-tone, reduced-motion)
- [ ] Screens: Onboarding, Today, Reading, Check-in, Forecast, Expanded, Blueprint
- [ ] Navigation + per-day reading cache + local storage
- [ ] **Phase 3 acceptance met**

## Phase 4 — Content depth & check-in
- [ ] Fill template bank (9 energies × 5 beats × life-area specializations)
- [ ] Wire daily check-in modulation
- [ ] Remedy library complete + rotation
- [ ] **Phase 4 acceptance met**

## Phase 5 — Safety, privacy, polish
- [ ] Disclaimers (onboarding + settings)
- [ ] Crisis/self-harm guardrail + resources
- [ ] Encryption at rest + one-tap delete
- [ ] Optional guarded LLM polish (off by default) + guardrail prompt
- [ ] no-doom content guard
- [ ] **Phase 5 acceptance met**

---

## Session log
- **S1 2026-07-21 04:01 CDT:** Env check, scaffolding, handoff docs, decisions/questions.
  Building engine core next. Token budget: working until exhaustion; cloud resume scheduled.
