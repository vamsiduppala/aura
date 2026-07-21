# Review guide — aura (autonomous build, 2026-07-21)

Hi vamsi — you asked me to work autonomously until your 1pm review and take every decision
myself. Here's the fast path to reviewing what got built. Everything is committed + pushed to
`github.com/vamsiduppala/cosmicmentor` (private).

## TL;DR
**All 5 build phases are complete.** A real, tested Vedic engine (51 unit tests, typecheck clean)
drives a working 7-screen app, verified end-to-end with screenshots. Zero jargon reaches the UI,
every reading is honest (gift + trap), nothing predicts doom, crisis text routes to support, and
birth data stays on-device with one-tap delete.

## See it in 60 seconds
- **Screenshots:** `docs/screens/` — all 7 screens + settings + the crisis-support screen, each
  rendered with real engine data.
- **Run it:** `npm install && npm --workspace @aura/web run dev` → http://localhost:5173
- **Engine tests:** `npm test` (51 pass).

## What to look at (in priority order)
1. **`docs/screens/03-reading.png`** — the core five-beat reading. Note the *move* is
   goal-specialized ("do the numbers once" because the goal was Wealth). This is the product.
2. **`docs/screens/02-today.png`** — the signature two-tone aura orb, live.
3. **`docs/screens/09-crisis-support.png`** — type a self-harm phrase in onboarding and it refuses
   to "read" you, showing help instead. The safety spine works.
4. **`packages/engine/`** — the actual engine. `dasha/vimshottari.ts` (the spine),
   `lattice/compute.ts` (the 108), `synthesis/reading.ts` (the beats), `content/templates.ts`
   (the voice). All tested.

## Decisions I made that you might want to change (full list in DECISIONS.md)
- **D-01/D-09 — Web app, not Expo mobile (yet).** I built the UI as a Vite/React web app because
  I can actually *verify* it renders (screenshot it) autonomously; an Expo build needs a simulator
  I can't drive here. It also de-risked bundling the astronomy library. The components + engine
  API port straight to React Native when you want the mobile target. **This is the biggest call —
  revert-worthy if you specifically want Expo now.**
- **D-02 — Moshier-class ephemeris (astronomia lib), not Swiss Ephemeris.** Avoids the AGPL/license
  question for v1 (your Q-02). Accurate enough — validated below. Swappable behind an interface.
- **D-07 — Lattice scores intensity separately from quality** (so neutral-dignity planets don't
  vanish). Minor, documented.

## Things that need YOU (in QUESTIONS.md)
- **Q-10 ⚠️ — the auto-resume schedule needs one command from you.** I was (correctly) blocked from
  registering an unattended CLI task and from a cloud routine (no repo access). To arm it:
  `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\register-resume-task.ps1`
  (the scripts are on disk, gitignored). If you didn't run it, no harm — all work is in git.
- **Q-02 — Swiss Ephemeris licensing** if you want max precision later.
- **Q-04 — real geocoder** (the web demo uses a preset city list; no DST-historical lookup yet).
- **Q-09 — the streak counter** (mockup shows 🔥7; I kept it gentle/non-punitive per §11.5).

## How correct is the engine, really?
- **Dasha arithmetic:** exact (hand-computed golden tests, not just "within a day").
- **External golden:** the Einstein chart matches published Jyotish sources on all six discrete
  facts — Moon Scorpio/Jyeshtha, Sun Pisces, Gemini lagna, Mars exalted in the 8th, and the
  Jupiter↔Saturn 9th/10th-lord exchange. (Q-08 resolved.)
- **Calendar anchors:** the ayanamsa+Sun+time pipeline is pinned to Makara/Meena Sankranti.

## What I'd do next (not done, by design / budget)
1. **Expo mobile app** — port the 7 web screens to React Native (the real ship target).
2. **Deeper content** — 3+ variants per beat for even less repetition across weeks.
3. **Per-day reading cache** + notification (single calm daily nudge, opt-in).
4. **Real geocoding** + historical-DST timezone resolution in onboarding.
5. **Wire the optional LLM polish** (guardrail prompt + adapter already built, off by default).

Nothing here is blocked on a question — I made a default for everything and logged it. Revert
anything freely; the decisions are all reversible and documented with how.
