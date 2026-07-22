# aura

A mobile astrology app that runs on a real **Vedic (Jyotish) prediction engine** but never
shows the user a single planet name, chart, or piece of jargon. The surface is dead simple —
a handful of screens, one honest reading a day, one thing to actually do. The engine underneath
is deep, deterministic, and tested.

> **Status (2026-07-21):** Engine fully built + tested (**75 unit tests**, typecheck clean).
> Responsive web app (`apps/web`, no phone frame) with **9 screens** incl. a "Prove It"
> retrospective onboarding and a **Cosmic Mentor chat**. Native iOS/Android skeletons +
> a shared design system in `docs/`. Built autonomously across sessions — see `DECISIONS.md`
> for every choice and `QUESTIONS.md` (all resolved by the owner).
>
> **Accuracy:** beyond dashas/108-lattice, the engine computes Navamsa (D9), a Shadbala-style
> strength, Ashtakavarga (BAV/SAV, 337-invariant verified), and classical Yogas.
> **Retention pivot:** the retrospective proves the engine on your *past* before predicting;
> the Trap beat names your specific unconscious loop + the strength to break it; the Mentor
> chat is an LLM narration layer forced (via function-calling) to read the real engine first.

## See it

```bash
npm install                    # from the repo root (installs all workspaces)
npm --workspace @aura/web run dev
# open http://localhost:5173 — enter a birth date/time/place, tap "Read my energy"
```

Or just look at `docs/screens/` — every screen, rendered with real engine data:
onboarding → today (the signature aura orb) → reading → check-in → forecast → expanded → blueprint,
plus settings and the crisis-support screen.

## What the user sees: 9 energies, never jargon

| Energy | Means | (internally) |
|---|---|---|
| Main Character | being seen, identity | Sun |
| Big Feelings | feelings, comfort, moods | Moon |
| Fired Up | drive, courage, action | Mars |
| Busy Mind | thinking, talking, deals | Mercury |
| Green Light | lucky growth, opportunity | Jupiter |
| Soft Spot | love, charm, beauty | Venus |
| Heavy Lifting | discipline, the long build | Saturn |
| Never Enough | restless hunger, craving | Rahu |
| Letting Go | detachment, release | Ketu |

At any moment you're a **blend of two energies**: a *major* (your multi-year season = the
Mahadasha lord) and a *passing* one (weeks–months = the Antardasha lord). The aura orb is the
gradient between their two colors.

## Architecture

TypeScript-first monorepo (npm workspaces). Fully offline / on-device; no backend required.

```
packages/engine/   # the whole prediction engine — pure TS, no UI deps, 75 tests
  src/aura.ts      # the Aura facade — one DI service the UI/apps call
  src/astro/       # Tier 0: ephemeris (astronomia), ayanamsa, ascendant, time
  src/chart/       # Tier 1: chart, whole-sign houses, dignity, aspects, varga (D9/D10),
  #                          shadbala strength, ashtakavarga (BAV/SAV), yogas
  src/dasha/       # Tier 2: exact Vimshottari 5-level dasha engine
  src/transit/     # Tier 2: daily gochara, Sade Sati
  src/lattice/     # Tier 3–4: the 108 signal lattice + aggregation
  src/synthesis/   # Tier 5: five-beat readings, forecasts, blueprint, retrospective
  src/mentor/      # Cosmic Mentor: engine query + LLM guardrail prompt/tool schema
  src/content/     # Tier 6: template bank + optional guarded LLM polish (off)
  src/safety/      # Tier 8: crisis detection, no-doom guard, disclaimer
apps/web/          # Vite + React, responsive (no phone frame), shadcn/Radix primitives
  src/services/    # storage + Gemini chat (function-calling over the engine)
apps/ios/          # SwiftUI structural skeleton (docs/PLATFORMS.md)
apps/android/      # Jetpack Compose structural skeleton
docs/              # SPEC.md, DESIGN_SYSTEM.md, PLATFORMS.md, mockups/, screens/
```

**Screens (apps/web):** Onboarding → **Audit (Prove It)** → Today → Reading → Check-in →
Forecast → Expanded → Blueprint (+ Born gifts) → **Cosmic Mentor** → Settings/Support.

The heart is the **108-Layer Signal Lattice**: every one of the 9 energies evaluated against
every one of the 12 life-houses (9 × 12 = 108). Those collapse into 9 energy scores + 12
life-area scores + the current two-energy blend that drives everything the user sees.

## Principles it's built on (see `docs/SPEC.md` §1, §11)

- **Simple surface, deep core.** No planets/houses/Sanskrit ever reach the UI (enforced by a
  no-jargon lint test).
- **Honest, not flattering.** Every reading pairs a *gift* with a real *trap*.
- **Agency, never doom.** No death/illness/disaster/dated-catastrophe — enforced by a no-doom
  guard + lint. Crisis free-text routes to support, never a "reading".
- **Healthy remedies only.** Free, behavioral, good-for-you. Never purchases/medical/fear.
- **Privacy first.** Birth data stays on device; one-tap delete.

## Develop

```bash
npm test                       # run the engine test suite (vitest)
npm --workspace @aura/engine run typecheck
npm --workspace @aura/web run build
```

## Key docs

- `docs/SPEC.md` — the full product + engineering brief (source of truth).
- `DECISIONS.md` — every autonomous decision + how to undo it.
- `QUESTIONS.md` — open questions, each with a chosen default to revert if wrong.
- `PROGRESS.md` — phase-by-phase status.
- `AGENT_HANDOFF.md` — how a resuming agent continues the build.
