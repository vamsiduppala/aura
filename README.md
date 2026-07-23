# aura

A mobile astrology app that runs on a real **Vedic (Jyotish) prediction engine** but never
shows the user a single planet name, chart, or piece of jargon. The surface is dead simple —
a handful of screens, one honest reading a day, one thing to actually do. The engine underneath
is deep, deterministic, and tested.

> **Status:** A real login-gated **local full-stack app**, built autonomously across many
> sessions. Four parts, all tested + typecheck-clean (**~200 tests**):
> - **`packages/engine`** — the deterministic Jyotish engine (chart, Vimshottari, 108-lattice,
>   Navamsa, Shadbala-style strength, Ashtakavarga 337-invariant, yogas, transits, and the
>   Tajaka **solar-return** chart). *93 tests.*
> - **`packages/knowledge`** — the **entire book** *Vedic Astrology: An Integrated Approach*
>   encoded as **36 data + calculation modules** (all 20 vargas, 9 dasha systems + the Tajaka
>   annual dasas, arudhas, aspects/argalas, ashtakavarga incl. sodhana + sodhya pindas, raaja/
>   vipareeta yogas, upagrahas, special lagnas, panchanga, longevity, avasthas, taras, the full
>   Tajaka suite, 28 sahams, muhurta, …) — every computation verified against the book's worked
>   examples. *112 tests.*
> - **`apps/api`** — a local Fastify server exposing **91 routes**: the whole knowledge base
>   **plus** accounts (register/login, scrypt + tokens) and birth-profile persistence in a
>   local **SQLite** DB (`node:sqlite`, no native build). *6 tests.*
> - **`apps/web`** — the responsive web app (`no phone frame`): login/register + guest mode,
>   9 screens incl. a "Prove It" retrospective onboarding, a **Cosmic Mentor** chat (grounded
>   via the API), and a **deep chart** (house-by-house kundali, current dasha across systems,
>   a Tajaka "year ahead"). *10 tests.*
>
> See `docs/PHASE2.md` (login/DB/wiring), `docs/KNOWLEDGE_PROGRESS.md` (the book→backend map),
> and `DECISIONS.md` / `QUESTIONS.md` for the autonomous build history.

## Run it locally

```bash
npm install          # from the repo root (installs all workspaces)
npm run dev          # runs the API (:8787) + the web app (:5173) together
# open http://localhost:5173 — create an account (or "continue on this device"),
# enter a birth date/time/place, and get one honest reading a day.
```

`npm run dev` starts both processes via `concurrently`. To run them separately use
`npm run dev:api` and `npm run dev:web`. See `docs/PHASE2.md` for details.

**Config is optional.** It runs out of the box on defaults. To customise, copy the example
env files and edit them — `cp apps/web/.env.example apps/web/.env.local` (API URL, and a Gemini
key to switch the mentor from its deterministic fallback to the live LLM) and, if you want a
non-default port or DB path, `cp apps/api/.env.example apps/api/.env.local`. Both `.env.example`
files list every supported variable with its default.

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
