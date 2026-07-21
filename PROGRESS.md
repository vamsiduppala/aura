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
- [~] External golden vs a trusted Jyotish source's dasha table — FOLLOW-UP (see Q-08 / D-06;
      needs owner-provided reference to avoid locking in a wrong source). Internal validation
      is rigorous; this is belt-and-suspenders.
- [x] **Phase 1 acceptance met** (with the documented follow-up above)

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
