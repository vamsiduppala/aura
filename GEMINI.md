# GEMINI.md — the handoff contract

**Gemini: read this whole file before you touch anything. Then read `CLAUDE.md`.**

This file is auto-loaded by Gemini CLI from the repo root, so you already have it. It is the
shared operating manual between two agents working the same repo across sessions:

- **Claude** (Opus 5) does the primary build.
- **You (Gemini)** take over when Claude runs out of tokens.
- Claude resumes from **§4 HANDOFF LOG** at the bottom of this file. That log is the only
  memory that survives between us. If you don't write it down there, it did not happen.

Everything here is a conclusion already reached. Do not relitigate it, do not ask the user to
re-decide it, do not "improve" it because a different approach occurred to you.

---

## 1 — What is being built

**Vimshottari** — a Vedic *daśā timing* app. Not a horoscope: it answers "who is ruling my
chart right now, and for how long," using the royal-court metaphor. Four tabs: **Planner**,
**Timeline**, **Mentor**, **You**. Dark **neumorphic** UI. The five-ring Wheel is the product.

Ships on **four surfaces from one codebase**: responsive **website**, installable **PWA**,
**Android** and **iOS** (both via Capacitor wrapping the same build).

```
apps/vim            THE NEW APP. React + Vite + Zustand. Website + PWA + Android + iOS.
apps/web            the older "aura" app. Still builds, still green. DO NOT BREAK IT.
apps/api            Fastify + node:sqlite — accounts, profiles, ~104 knowledge routes.
packages/engine     ephemeris, chart, dashas, synthesis. The real maths. Golden-tested.
packages/knowledge  the classical text encoded as typed rule data (36 modules).
ideafiles/          THE SPEC for the new app. Read these before designing anything:
  _extract/vimshottari_app/docs/build-spec.md    screen-by-screen behaviour + data origins
  _extract/vimshottari_app/docs/copy-spec.md     every user-facing string
  _extract/vimshottari_app/lib/theme/tokens.dart the reconciled design tokens
  _extract/vimshottari_app/CLAUDE.md             the reference project's own rules
LIQUID_GLASS_BUILD_PROMPT.md   an alternative visual direction. NOT in use — we are
                               neumorphic, not liquid glass. Ignore unless told otherwise.
```

### THE SOURCE OF TRUTH CHANGED — read this before anything else

**`new-structure.md` at the repo root is now the engineering source of truth.** It says so in
its own status line, and it **supersedes `ideafiles/**/copy-spec.md`, `build-spec.md` and
`tokens.dart`**. Where the old specs and `new-structure.md` disagree, new-structure wins.
`ideafiles/` is still the best source for *copy* and product intent; it is no longer the
source for architecture, geometry or layout.

**How we are adapting its stack, and why.** `new-structure.md` specifies Flutter + Next.js +
NestJS + Postgres + Temporal + Ory Kratos + RevenueCat — a greenfield stack. This repo already
has a working, golden-tested TypeScript engine, a Fastify API and a shipped React app. The
standing decision, agreed with the user:

> **Adopt every decision that is about WHAT THE PRODUCT IS. Adapt the ones that are purely
> WHICH VENDOR.** Never silently rewrite a working, tested engine to match a vendor choice.

| new-structure says | We do | Why |
|---|---|---|
| Flutter for mobile | React + Capacitor (`apps/vim`) | The engine is TypeScript and golden-tested. A Dart port is a Part-5+ decision, not a Part-1 one. The token pipeline already emits `tokens.dart` so that port stays cheap. |
| Next.js for web | Vite + React (`apps/vim`) | SSR matters for the §5.1 share/SEO pages, which are Part 3+. Migrating the shell to Next later is a routing change, not a rewrite — keep components framework-agnostic. |
| NestJS BFF | Fastify (`apps/api`) | Same shape, already working. |
| Postgres + Temporal | `node:sqlite` today | Real constraint: `EXCLUDE USING gist` and `tstzrange` (§7) have no SQLite equivalent. **Flagged as a Part-4 migration, not silently dropped.** |
| Dart engine + `dart compile js` | `packages/engine` (TS) | It is already the library-not-a-service the plan asks for, and already shipped in the client. |
| Style Dictionary | 150-line generator in `packages/tokens/build.mjs` | Zero deps, committed output, our naming. `tokens.json` is the contract; swapping in Style Dictionary replaces one file. |
| RevenueCat / Ory Kratos | Not yet | Part 4. Do not hand-roll what they replace; see `docs/ACCOUNT_AND_COMMERCE.md`. |

**Everything else in `new-structure.md` is adopted verbatim**, including: the §0 principle,
3-item nav + account avatar, §4.2 ring geometry, §5.1 web layout and neumorphic recipe,
§3 engine rules, §4.5 Plan Composer scoring, §4.6 composable interpretation, and M1–M21.

### THE FOUR PARTS

The user asked for the work split into four, done one at a time. **Do not start a later part
before the earlier one is committed and verified.**

| Part | Maps to | Contains | State |
|---|---|---|---|
| **1** | Phase 0 · M8 · §4.2 · §5.1 · §1 | Token pipeline, web design system, responsive shell, rings to spec, 3-item nav + avatar, M9 non-colour channels | **IN PROGRESS — see §5** |
| 2 | §3 · M14a/b · M19 | Engine: microsecond ints, half-open exact-sum property tests, injected clock, ayanāṁśa stored, `engineVersion` stamped, `/packages/vectors` golden fixtures | not started |
| 3 | §4.5 · §4.6 · M4 | Plan Composer as versioned rules (suitability × relation × house → PUSH/BUILD/HOLD), composable interpretation with cache keys, authoring shape | not started |
| 4 | §4.7 · M1 · M5 · M6 · M7 · M17 | Mentor gateway + tool use + date validator, notifications, auth/entitlements/privacy, Postgres migration | not started |

Figma: file key `mP16YA7x9BH1Ee0qPoSwDN`, page `0:1`, nine screens (`1:2` Planner,
`1:47` Timeline, `1:32` Plan Detail, `1:62` Daśā Detail, `1:77` Mentor, `12:2` Threads,
`17:2` The Court, `22:2` Task Detail, `1:17` New Plan). Read it with the Figma MCP
(`get_screenshot`, `get_metadata`). **Where Figma and `tokens.dart` disagree, tokens win
and Figma is stale.**

---

## 2 — THE RULES

Numbered so they can be cited in the log ("skipped R14 because…"). Violating one of the
first five invalidates the work.

### The five that are absolute

**R1 — NO MOCK, STATIC, DEMO, SAMPLE OR PLACEHOLDER DATA. ANYWHERE. EVER.**
The user's explicit standing instruction. They will sign up with their own birth details and
expect every number on screen to be computed from them. That means:
- No hardcoded charts, planets, dates, names, plans, threads or countdowns.
- No pre-filled birth date/time/place. Inputs start **empty** and gate the submit button.
  (This bit a previous build: a pre-filled date meant a new user silently got a stranger's
  chart.)
- No `if (!data) return SAMPLE_DATA`. An empty state is a real state — design it.
- Fixtures inside `*.test.ts` are fine and expected. Fixtures reachable from a user-facing
  code path are a defect.
- If you cannot compute a value for real yet, render the honest empty/loading/unavailable
  state and log it in §4. Never fill the hole with a plausible number.

**R2 — `tsc` is the only typecheck.** `vitest` does **not** type-check. For every package you
touch: `npx tsc -p <pkg> --noEmit`. A green test run over broken types means nothing.

**R3 — Never copy the classical text's prose.** Encode *rules* in your own concise words.
No Devanagari mantras. Behavioural remedies only — never gemstones, fasting or rituals.

**R4 — Safety rails hold.** Never predict death, doom or disaster. Crisis input routes to
support (`detectCrisis`). Every generated line passes `checkNoDoom`. No medical, legal or
financial directives — redirect to a professional and answer only the timing question.

**R5 — Birth-time confidence gates everything the app may claim.** One minute of birth-time
error offsets *every* boundary in the 120-year tree by up to five days, and the error never
shrinks. `visibilityFor()` in `apps/vim/src/core/court.ts` is the single gate — respect it in
the UI, in notifications, and in the mentor's system prompt. The **Messenger** ring is
decorative: ship it (it's the only thing that visibly moves) but never base a notification, a
plan stage or a mentor claim on it.

### Method

**R6 — Locate everything before changing anything.** One `grep` with alternation beats six
greps: `grep -rnE "rudra|trishoola|maheswara" --include=*.ts`. Pull every definition you'll
need in one call.

**R7 — Read in batches.** Several `sed -n 'A,Bp'` in one Bash call, `echo` markers between.
Don't open a 2000-line file for three lines. Prefer the dedicated Read/Grep/Glob tools over
shell `cat`/`grep`.

**R8 — Write in batches.** Multiple parallel file writes in one message, or one Python
heredoc doing several `str.replace()` edits with asserts. Use a surgical edit for a single
spot; use a batch when touching 3+ files the same way.

**R9 — Verify once, at the end**, in a single command:
`for p in packages/engine packages/knowledge apps/api apps/web apps/vim; do npx tsc -p $p --noEmit; done; npx vitest run`

**R10 — Commit per logical chunk**, with a message that says *why* and what you deliberately
did **not** do. Required trailers:
```
Co-Authored-By: Gemini <noreply@google.com>
```
(Claude uses `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` plus a `Claude-Session:`
line. Use your own attribution — never forge Claude's.)

**R11 — Finish the whole task.** If part of the scope is blocked, complete every other part in
full, then say explicitly in §4 what you left and why. Scaling the work down is the user's
call, not yours.

**R12 — When a rule is not encodable, say so.** In the tracker, in a code comment, and in §4.
Do **not** invent it. Shadbala, Vimsopaka and the Sarvatobhadra/Kota chakra grids are the
standing examples of "the book puts this out of scope."

### Product & vocabulary

**R13 — Use the court vocabulary exactly.**

| Level | Office | Sanskrit | Rules for |
|---|---|---|---|
| 1 | **King** | Mahādaśā | several years — typically 6 to 20 |
| 2 | **Prime Minister** | Antardaśā | months up to a few years — usually 1 to 3 |
| 3 | **Governor** | Pratyantardaśā | weeks to a few months |
| 4 | **Magistrate** | Sūkṣma daśā | days to a few weeks |
| 5 | **Messenger** | Prāṇa daśā | hours to a few days |

Office is primary, planet secondary, Sanskrit tertiary. Detail tabs are **Advantage** /
**Obstacle** — never Tailwind/Headwind. **Push/Pause** survives only as a state pill on a plan
card, never as a tab. The old Era/Chapter/Season/Phase/Pulse ladder is **dead** — grep for it
and delete survivors.

**R14 — Banned from the UI:** *malefic, benefic, auspicious, inauspicious, remedies, doshas,
cursed, lucky, unlucky, blessed, destiny.* Say what is happening instead: "This period resists
speed" beats "Saturn is a malefic."

**R15 — Say what the app is, once.** A quiet permanent footer on detail pages: *"This describes
conditions, not outcomes. What you do with them is yours."* No modal, no repeated disclaimers.

**R16 — Planet identity never rests on hue alone.** Saturn (`#0E0E12`) and Rāhu (`#6B6F76`) are
the same grey at a 12px stroke. Always hue **+ name + motion signature**: Saturn's stars drift
*with* the fill, Rāhu's haze drifts *against* it.

**R17 — A Turn is not an achievement.** A daśā closing is time passing, not a goal met. No
confetti, no "You did it!" — a 900ms colour bleed old→new and one line.

### Engineering

**R18 — No raw hex in components.** Colours come from `apps/vim/src/theme/tokens.ts` (what JS
computes with) or the CSS custom properties in `apps/vim/src/theme/app.css` (what CSS consumes).
If you need a new colour, add a token.

**R19 — Offline-first.** Timeline and Planner read from local cache and never block on the
network. Mentor is the only surface allowed to require connectivity. Every server call has an
on-device fallback. Test with the API stopped.

**R20 — `API_BASE` is resolved at runtime** (`apiBase()`), never baked in at build time — a
phone cannot reach `localhost`.

**R21 — All times stored and computed in UTC**; convert to local only at render. "Time left"
renders in the user's *current* timezone; the underlying boundaries never move. Resolve a
birthplace's UTC offset **on the date of birth**, not today's (India ran wartime DST 1942–45;
getting this wrong costs up to ten months of drift).

**R22 — Never log or send birth date/time/place to analytics or crash reporting.** In some
contexts it is effectively a national ID. Encrypt at rest, keep it out of every payload.

**R23 — Accessibility is not a later pass.** `aria-label` on every icon-only control; 44×44px
minimum tap target (invisible padding if the visual is smaller); visible `:focus-visible` ring;
`prefers-reduced-motion` / `prefers-contrast` / `forced-colors` all handled; layout survives
200% type; a semantics label on every ring, row and pill.

**R24 — Animate `transform` and `opacity` only.** Never `width`, `height`, `top`, `left`,
`margin` or `box-shadow` on the hot path. `100dvh`, never `100vh`. Safe-area insets on every
edge-touching element.

**R25 — Four surfaces, one codebase.** `apps/vim` must work as a responsive **website** (not a
393px phone frame stranded in the middle of a desktop window), as an installable PWA, and as
the Android/iOS app via Capacitor. After web changes that affect native, run
`npm run cap:sync` in `apps/vim`.

**R26 — Don't break `apps/web`.** The old aura app and its four test suites stay green. It is
the fallback if the new direction stalls.

### The log

**R27 — Record everything in §4 as you go**, not at the end — a session that dies mid-task must
still leave a usable trail. Every entry: what you did, what you learned, what broke, what you
deliberately skipped, and the exact next step.

**R27b — THE HANDOFF IS BIDIRECTIONAL.** Claude records for Gemini and Gemini records for
Claude, in the same §4 log and the same §5 state block. Whoever picks the repo up must be able
to answer, from this file alone and without reading any code: what the plan is, what part we
are on, which files are half-finished, what has already been tried and failed, and what the
single next action is. Concretely, before you stop for any reason:
1. Append a §4 entry (format below) — even if the work is incomplete. **Especially** then.
2. Overwrite **§5 CURRENT STATE** so it describes the repo as it actually is right now.
3. If you leave a file mid-edit, name it in §5 with what is done and what is not.
4. If you learned a trap, add it to §3 as well. A trap only in a log entry gets missed.

**R28 — Never edit or delete another agent's log entries.** Append only. If you find something
Claude wrote that turned out wrong, add a new entry correcting it and say so; leave the original.

**R29 — Add new rules here when you discover one.** If you hit a trap that cost you real time,
it becomes a numbered rule or a §3 trap so nobody pays for it twice. This file is meant to grow.

**R30 — Ask the user only when proceeding under any assumption would be unsafe or make the work
useless if wrong.** Otherwise make the routine judgement call, state the assumption in §4, and
keep building. Do not stop with nothing delivered to ask a question you could have answered.

---

## 3 — Known traps (each cost real time once)

- **`node:sqlite` needs Node 22.5+.** `apps/api/src/db.ts` throws a clear message if not.
- **Vitest can't resolve `node:sqlite`** → it's loaded via `createRequire`. Do **not** "fix" that.
- **`node:sqlite` rejects unknown named params** — `upsertProfile` must not bind `updated_at`.
- **A class in JSX with no CSS rule silently does nothing.** `bp-wide` capped a layout at 560px
  for weeks. If a layout looks wrong, confirm the class actually exists in the stylesheet.
- **The tests own the demo data.** Removing pre-filled onboarding values broke tests that relied
  on them. Tests must fill inputs like a real user would.
- **Root `npx vitest` needs `vitest.workspace.ts`** to pick up per-project environments
  (web = jsdom).
- **Native apps bundle a built copy** — web changes are invisible in Android/iOS until
  `cap:sync`.
- **`kDaysPerYear`:** the Dart reference uses `365.2425`; **this repo's engine uses `365.25`**
  and is golden-tested on it (`packages/engine/src/dasha/vimshottari.ts`). 365.25 wins here.
  Client and server must never disagree — a mismatch drifts level-1 boundaries by days.
- **Verifying UI: drive it with JavaScript and assert on values, not screenshots.** Screenshots
  are slow, huge, and the browser is zoom-locked. React inputs need the native value setter or
  they won't register:
  ```js
  const setVal = (el, v) => {
    const s = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
    s.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  ```
  Find layout bugs by **measuring**: `scrollWidth > clientWidth` (clipped text), rects against
  `innerWidth` (overflow), and scan text for `undefined|NaN|null`.
- **`requestAnimationFrame` does not fire in a background tab.** This cost real time twice in
  one session: an onboarding screen that deferred its work behind a rAF hung on "building…"
  forever, and the Wheel's arcs — whose "animate from empty" start state was flipped by a rAF
  — rendered at **0% for every ring**. Both looked like logic bugs and were neither.
  → **Rule: never let a value that carries meaning depend on a frame callback.** Make the true
  value the resting state and let animation be decoration on top. For an enter-from-empty
  sweep, use a CSS `@keyframes` with only a `from` block plus `animation-fill-mode: backwards`
  — the implicit `to` is the element's own declared value, so the arc is correct even if the
  animation never runs. See `.ring-arc` in `theme/components.css`.
- **Ring hit-testing** must resolve by *nearest ring-centre distance*, not exact hit. At 10–14px
  strokes with 5px gaps, exact testing loses about a fifth of taps.
- **`useNow` deliberately stops while `document.hidden`.** A measured "the value didn't change
  over 4 seconds" in a background tab is the power saving working, not a dead clock. Check
  `document.hidden` before chasing it.
- **PowerShell `Get-Content` / `Set-Content` round-trips corrupt UTF-8 here.** A
  `(Get-Content x) -replace ... | Set-Content -Encoding utf8 x` turned every em-dash in
  `useVim.ts` into mojibake. Recovered with `git checkout --`. **Do batch edits with a Python
  heredoc using `io.open(..., encoding='utf-8')` and `assert` on each replacement count.**
- **`content-visibility: auto` makes `innerText` return `''` for off-screen subtrees.** The
  `.deferred` class uses it, so a measurement sweep must read `textContent` there, not
  `innerText`. It is not a rendering bug.
- **The `.sr-only` node always reports `scrollWidth > clientWidth`.** That is how the clipping
  technique works — it is a false positive of the layout-measuring sweep, not a bug.
- **Adjacent rings sharing a planet** blur into one fat band: give the outer one a 2px gap and
  85% opacity.

## Commands

```bash
npm run dev                      # aura API :8787 + old web :5173
npm run dev --workspace apps/vim # the new app on :5174
npm test                         # all workspaces
npm run typecheck                # real tsc everywhere
npx vitest run --root packages/engine
cd apps/vim && npm run cap:sync  # push the web build into android/ + ios/
```
Ports: **vim 5174**, aura web 5173, API 8787. DB: `apps/api/data/aura.db` (gitignored).

---

## 4 — HANDOFF LOG

Append-only. Newest at the bottom. One entry per work chunk, not per file.

**Format:**
```
### <ISO date> · <agent> · <short title>
**Did:** …
**Learned / decided:** …
**Broke or left undone:** …
**Next step:** <the single most useful next action, concretely>
```

---

### 2026-07-29 · Claude Opus 5 · Session start — read the spec, chose the architecture

**Did:**
- Read all of `ideafiles/`: `build-spec.md`, `copy-spec.md`, `tokens.dart`, `vimshottari.dart`,
  the reference `CLAUDE.md`. Pulled the Timeline (`1:47`) and Planner (`1:2`) screens from Figma
  to calibrate the neumorphic look.
- Added `getCourtAt()` and `nextPeriodAt()` to `packages/engine/src/dasha/vimshottari.ts` +
  exports. The existing `getStackAt` answers *who* rules but not *for how long*; a progress ring
  needs each period's own start/end. 7 new tests in `packages/engine/test/dasha.test.ts` —
  **100/100 engine tests green**.
- Scaffolded `apps/vim` (React 18 + Vite + TS, port 5174): `package.json`, `tsconfig.json`,
  `vite.config.ts`, `index.html` with `viewport-fit=cover` + `interactive-widget=resizes-content`.
- `src/theme/tokens.ts` — offices, planet palettes, wheel geometry, motion, layout (ported from
  `tokens.dart`). `src/theme/app.css` — surfaces, ink, brass, radii, the neumorphic shadow
  recipes, type scale, tab bar, a11y overrides.
- `src/core/court.ts` — confidence gating (`visibilityFor`), `birthInstantUTC`, `courtAt`,
  `nextTurn`, `periodsBetween`, `chooseCutLevel`. `src/core/time.ts` — duration humanising and
  countdown parts. `src/hooks/useNow.ts` (visibility-aware clock), `useReducedMotion.ts`.
- `src/components/Wheel.tsx` — five SVG arcs, round caps, tapered strokes, same-lord gap,
  staggered outward-in load, nearest-ring-centre hit-testing, per-ring `aria-label`.

**Learned / decided:**
- **A new app, not a rewrite of `apps/web`.** `apps/vim` shares `@aura/engine`, `@aura/knowledge`
  and `apps/api`, so nothing is duplicated, and aura's four green test suites stay green (R26).
- **Stroke taper:** `tokens.dart`'s prose comment contradicts its own numbers. The numbers
  (`kWheelTimeline`: outermost 14px → innermost 10px, i.e. **outer is thicker**) match Figma, so
  the numbers win. The King is protected from reading as a hairline by the **centre readout**,
  not by stroke weight.
- **`365.25`, not `365.2425`** — see §3. This repo's engine is golden-tested on 365.25 and the
  build spec agrees; only the Dart port used 365.2425.
- Two clocks, deliberately: 60s to re-walk the daśā tree, 1s for the countdown and the Messenger
  arc (progress recomputed locally from boundaries the 60s clock already resolved). Never walk
  five levels at 1Hz.
- Birth-time confidence needs a **real column** on `profiles`, not a hijacked `goal_name`.

**Broke or left undone:** nothing broken. Not yet written: the API migration for
`birth_time_confidence`, `apps/vim` services (geo/api/storage), the Zustand store, onboarding,
the four tab screens, Capacitor config, PWA manifest, tests.

**Next step:** add the `birth_time_confidence` column + migration to `apps/api/src/db.ts` and
plumb it through `PUT /profile` and `rowToProfile` in `apps/api/src/server.ts`.

---

### 2026-07-29 · Claude Opus 5 · M1 + M2 shipped — commit `754d207`

**Did:**
- `apps/api`: `birth_time_confidence` column with the `PRAGMA table_info` migration pattern,
  defaulting to `'unknown'`; server clamps any unrecognised value to `'unknown'` so a bad
  client can't talk it into claiming precision. Plumbed through `PUT /profile` + `rowToProfile`.
- `apps/vim` complete for M1 + M2: Welcome → Onboarding (name → date → time+confidence →
  place → reveal) → Timeline (Wheel, Your Court, Biggest Change Ahead) → daśā detail → You.
  Sign-in/register/continue-on-device with honest degradation.
- `content/court.ts` — authored per-planet blocks (kingdom image, 4 advantage + 4 obstacle
  sections) × per-office timescale framing.
- Website + PWA + Android + iOS from one build: `capacitor.config.ts`, manifest, VitePWA
  precache, and `scripts/make-icons.mjs` generating a real icon set from the Wheel.
- `docs/ACCOUNT_AND_COMMERCE.md` — the enterprise gap analysis the product spec never
  covered. `docs/VIM_ROADMAP.md` — the single work queue for both of us.
- **306 tests green** (engine 100, knowledge 124, vim 33, web 29, api 20); `npm run typecheck`
  clean across all five workspaces; production build + PWA generate cleanly.

**Learned / decided:**
- **`apps/vim/tsconfig.json` must extend `tsconfig.base.json`.** My first version turned on
  `noUnusedLocals` + `exactOptionalPropertyTypes`, which dragged `packages/engine` and
  `packages/knowledge` (resolved as source TS through the workspace) into failure on
  pre-existing code this app doesn't own. Extend the base; don't hold shared packages to
  stricter rules than the repo applies. **Gemini: do not "fix" those by editing the packages.**
- `test:` in `vite.config.ts` needs `defineConfig` from **`vitest/config`**, not `vite`.
- Engine exports `SIGN_NAMES` (a string array), not `RASIS`.
- jsdom has no `matchMedia`; `src/test/setup.ts` provides a real non-matching one rather than
  letting `useReducedMotion` swallow a throw and silently disable motion in tests too.
- The **no-mock-data guard is now a test** (`src/test/no-mock-data.test.tsx`): it greps every
  `src/**/*.ts(x)` outside `test/` for hardcoded ISO dates, `SAMPLE_*`-style fixtures, banned
  interpretive words, and superseded vocabulary. It strips comments first, because the engine's
  own API names (`isBenefic`, `functionalPolarity`) are legitimately discussed in prose.
- Planner and Mentor ship as **honest empty states**, not stubs that pretend to work. Mentor
  shows the real locally-computed state block it will hand the model, plus the deepest level it
  will answer at — useful on its own, and true.

**Broke or left undone:** nothing broken. Outstanding in M2: the Turn colour bleed on a
boundary crossing, the Saturn starfield / Rāhu counter-drift motion signatures (R16 —
identity is currently hue + name only), ring long-press chip, first-run tooltip, scrubber.
Planner (M4) and Mentor (M5) are not built. No browser verification yet.

**Next step:** verify in a real browser at `:5174` — drive onboarding with the native-setter
JS from §3, then **measure** for clipping (`scrollWidth > clientWidth`), overflow against
`innerWidth`, and scan for `undefined|NaN|null` in rendered text. Then M4 Planner.

---

### 2026-07-29 · Claude Opus 5 · Browser verification — found and fixed the rAF class of bug

**Did:**
- Drove the whole real flow at `:5174` with JS (no screenshots): Welcome → name → date →
  time+confidence → place → reveal → Timeline. Confirmed inputs start empty, the 13+ gate
  fires, date bounds are 1906–2026, the real Open-Meteo geocoder returns 8 hits for
  "Hyderabad", and the historical offset resolves to **+5:30 on the birth date**.
- **Found two bugs by measuring, both the same root cause:** `requestAnimationFrame` never
  fires in a background tab. The reveal screen hung on "building…", and every wheel arc
  rendered at **0% filled**. See the new §3 entry — this is now a standing rule.
- Fixed the reveal by computing the chart synchronously in a `useMemo` (it takes ~200ms; that
  never warranted a loading screen, let alone a hangable one).
- Fixed the wheel by inverting the animation: the arc's inline `strokeDashoffset` is now
  always the true value, and the entrance sweep is a CSS `@keyframes` with only a `from`
  block. Removed the `loaded` state and the `useReducedMotion` dependency from `Wheel`
  entirely — the reduced-motion media query already handles it in CSS.
- Added `src/test/wheel.test.tsx` (5 tests) that would have caught it: arcs are non-zero and
  non-identical, each matches its seat's `progress` to 4dp, all rings advance when the clock
  does with the fastest moving most, hidden rings aren't drawn, and every ring carries a
  screen-reader label.
- **Verified live:** four independent fills against one real chart — Mars Magistrate 9.99%,
  Saturn Governor 66.4%, Jupiter PM 23.85%, Venus King 54.0%. No `undefined|NaN|null` in
  rendered text, no horizontal page scroll, no element overflowing `innerWidth`, no tap
  target under 44px.
- Cleared `localStorage` afterwards so the user's first run starts genuinely empty.

**Learned / decided:**
- The launcher icon is a static PNG **only because every platform requires one**. The in-app
  Wheel is a live graph and must never be treated as artwork — that distinction is the point
  of the product. `scripts/make-icons.mjs` derives the icon from the same geometry so they
  stay consistent.

**Broke or left undone:** M2 leftovers unchanged (Turn colour bleed, Saturn/Rāhu motion
signatures, long-press chip, first-run tooltip, scrubber).

**Next step:** M4 Planner — plan model stored as inputs only, the questionnaire, stage
cutting via `chooseCutLevel`, and the pipeline. Details in `docs/VIM_ROADMAP.md`.

---

### 2026-07-29 · Claude Opus 5 · M4 Planner + full end-to-end verification — commit `c72cc2c`

**Did:**
- Built M4: `content/plans.ts` (9 categories, situation chips, **81 stage headings** = 9
  categories x 9 planets, per-planet checklists), `core/plan.ts` (`derivePlan`, `stageMode`,
  horizon helpers), `services/plans.ts` (per-identity local storage), and the three screens —
  `Planner` (list + real empty state), `NewPlan` (4-step questionnaire), `PlanDetail` (plan
  wheel + The Path pipeline), `StageDetail` (task detail + checklist).
- Store: `plans` state, `addPlan`/`updatePlan`/`toggleCheck`/`removePlan`, and `useIdentity()`
  so the profile slot and the plans slot **always switch together** — a half-switched identity
  would put one person's plans against another person's chart.
- **Verified the whole app end to end against one real profile** (born 11 Apr 1997, 20:55,
  Visakhapatnam) with a real account on the local API. Everything in the commit message.
  Notably: the location block derives lat/lng/zone/offset from the place name alone, and the
  chart's Lahiri ayanāṁśa (23.8150° for 1997) is right to the arcminute.
- Hand-checked one suspicious-looking result and it was correct: the Governor and Magistrate
  showed the same "7d 8h left" because the Venus sūkṣma is the **last child** of the Sun
  pratyantar (46.3 x 20/120 = 7.7 days), so they genuinely share an end instant.
- Fixed the Sanskrit toggle's hit area (46x28 → 46x46 via invisible padding).
- 52 vim tests (up from 38). 325 across five workspaces. Typecheck clean.

**Learned / decided:**
- **Stage state is derived, never stored.** The only persisted per-stage value is the user's
  own checklist ticks, keyed `"<ordinal>:<itemIndex>"`. Confirmed in the browser: the stored
  plan object has exactly nine keys and none of them is `stages`.
- **Push/Pause comes from the ruling planet**, not from the category: Mars/Sun/Jupiter/
  Mercury/Rāhu push, Saturn/Venus/Moon/Ketu pause. It is a claim about which *kind of effort*
  gets traction, never about the outcome.
- A test that asserts "the running stage has progress > 0" is **wrong**: a plan created this
  instant has a running stage legitimately at 0%. Test the real property, and add a separate
  case with a past `createdAt` for genuine elapsed progress.
- Two new §3 traps: PowerShell UTF-8 corruption, and `content-visibility: auto` emptying
  `innerText`.

**Broke or left undone:** M2 leftovers still open (Turn colour bleed on a boundary crossing,
Saturn starfield / Rāhu counter-drift, ring long-press chip, first-run tooltip, scrubber).
Planner has no Course Correct / diff view and no archive action yet. Mentor (M5) is still the
honest state block only. None of M6 (account/commerce) has started.

**Next step:** M5 Mentor — threads, streaming, tool-calling over the engine, source
disclosure, safety pre-check. Or M6-1 session hardening if security should come first; that
one is a genuine S1 (tokens are stored in plaintext and never expire).

---

## 5 — CURRENT STATE (overwrite this whole section whenever you stop)

**Last updated:** 2026-07-29 by Claude Opus 5. **Part 1 is DONE and committed as `24b2b0e`.**
**Branch:** `main`. Working tree clean. **Next: Part 2.**

### Where we are

| Part | State |
|---|---|
| **1** — token pipeline, web design system, responsive shell, rings to §4.2, 3-item nav + avatar, M9 channels | **DONE** `24b2b0e` |
| **2** — engine hardening + golden vectors (§3, M14a/b, M19) | **NEXT** |
| 3 — Plan Composer + composable interpretation (§4.5, §4.6, M4) | not started |
| 4 — Mentor gateway, notifications, auth/entitlements/privacy, Postgres (§4.7, M1, M5, M6, M7, M17) | not started |

Earlier commits: `754d207` the app on the real engine, `f73d3d0` the rAF fix, `c72cc2c` the
Planner, `0c604a4` docs.

### Part 1 shipped — measured, not assumed

Responsive shell verified in a same-origin iframe. The window resize is silently ignored in
this environment (`outerWidth` reports 0), but an iframe gets its own viewport, so media
queries inside one actually respond. **Use this technique for all responsive work.**

| viewport | nav | main starts | wheel | panes |
|---|---|---|---|---|
| 394 | bottom bar 362x64 | 0 | 307px | 1 |
| 814 | bottom bar 460x64 | 0 | 340px | 1 |
| 1260 | **sidebar 264px** | **264** | 402px | **2** |
| 1686 | sidebar 264px | 264 | 440px | 2 |

At every width: no horizontal scroll, nothing clipped, nothing overflowing, no tap target
under 44px, no NaN in rendered text. Plans is a 3-column card grid at 1686; settings likewise.
The avatar renders `VA` in `#F5C518` — Jupiter, this profile's real King.

### Part 2 — what to do next, concretely

Read `new-structure.md` §3 first. Five rules to make true, in this order:

1. **Microsecond integer arithmetic.** `packages/engine/src/dasha/vimshottari.ts` works in
   float milliseconds today (`yearMs()` returns `days * 86400_000` as a float, and span
   lengths are float multiples of it). Move to integer microseconds since epoch. Float drift
   across five levels of nesting is exactly how you get an off-by-two-hours prāṇa daśā.
2. **Half-open `[start, end)` with EXACT sums.** Level n+1 children must sum to their parent to
   the microsecond, with the **last child absorbing the remainder**. `subSpans()` does not do
   this today: it walks a cursor and the final child simply inherits the accumulated float
   error instead of being pinned to the parent's end. Make it a **property test**, not a hope —
   no gaps, no overlaps, monotonic boundaries, idempotent recomputation.
3. **No clock inside the package.** Grep `packages/engine/src` for `new Date()` and
   `Date.now()`. The clock must be injected, or you can neither test deterministically nor
   render "state at date X" for the Timeline scrubber (§4.3).
4. **Ayanāṁśa is a stored parameter, not a constant.** `chart.ts` calls `lahiriAyanamsa(jde)`
   directly. Write the value *used* onto the chart record, so a future switch to Raman or KP
   cannot silently shift every existing chart.
5. **`engineVersion` semver stamped on every persisted computation**, plus the M19 path: when
   the engine changes, recompute, diff old against new boundaries, and quietly notify only
   users whose boundaries moved more than 6 hours. Invisible until the first maths fix, and
   then it is the difference between a quiet patch and a support fire.

Then **`packages/vectors`** — 40 charts as language-agnostic JSON, all five levels to the
second, covering the edge cases §3 names: born at midnight, born during a DST transition, born
in a pre-1970 offset, born at 23:59:59.9, southern hemisphere, high latitude. Run them in CI;
a vector mismatch fails the build. Also add the `boundaryUncertainty` envelope from §3 so the
UI can render `±3 days` beside a boundary instead of a false-precise timestamp.

Note: `apps/vim/src/core/court.ts` already implements the confidence *gate*
(`visibilityFor()`). Part 2 adds the *numeric* uncertainty on top — it does not replace it.

### Verified working — do not regress

- Real account, real profile: **born 11 Apr 1997, 20:55, Visakhapatnam.** Place name alone
  derived 17.680 / 83.202 / Asia/Kolkata / **+5:30 on the birth date**. Rohini pada 4, Moon in
  Taurus, Scorpio ascendant, Lahiri 23.8150°. **Jupiter King, Saturn PM.**
- One real plan: *"Get the senior title"*, Promotion, 1-year horizon → **Governor terms, 5
  stages** (computed, not padded): Sun → Moon → Mars → Rāhu → Jupiter.
- 325 tests green (engine 100, knowledge 124, vim 52, web 29, api 20); all five workspaces
  typecheck clean.
- Sign-in for that account: `vamsi.5c609ad1@vimshottari.test` / `q8YUqSBaShtCdFL` — synthetic
  `.test` TLD, local DB only.
- **Run the token build after touching `tokens.json`:** `node packages/tokens/build.mjs`.
  `npm run check --workspace @vim/tokens` fails if `dist` is stale.

### Mistakes made so far, so nobody repeats them

1. **Capped the content column at 460px and centred it.** Made the website a phone screenshot
   in a void. This is R25, and the entire reason Part 1 existed.
2. **Drove ring fill from a React state flip inside `requestAnimationFrame`.** rAF is throttled
   to zero in a background tab, so every ring rendered at 0%. Now a §3 rule: a value that
   carries meaning must never depend on a frame callback.
3. **Deferred the onboarding chart computation behind rAF plus a dynamic import.** Same cause,
   different symptom — the screen hung on "building…" forever. Now synchronous.
4. **Batch-edited through PowerShell `Get-Content`/`Set-Content`.** Corrupted every em-dash in
   `useVim.ts`; recovered with `git checkout --`. Use Python with explicit encoding. §3.
5. **Asserted "the running stage has progress > 0".** Wrong — a plan created this instant has a
   running stage legitimately at 0%. Test the real property.
6. **Measured centring against `innerWidth`.** Off by the scrollbar width; everything looked
   20px wrong and was in fact correct to 0.3px. §3.
7. **Set `noUnusedLocals` and `exactOptionalPropertyTypes` in `apps/vim/tsconfig.json`.**
   Dragged shared packages into failure on code this app does not own. Extend
   `tsconfig.base.json` instead.
8. **Built from a plan pasted mid-turn that had been corrupted in transit.** It was in
   `new-structure.md` on disk all along. **Ask for the file; never reconstruct from a paste.**
9. **A regex that replaced an opening `<div>` with `<>` and left its `</div>` behind.** Broke
   `Onboarding.tsx` with an unbalanced fragment. When a batch edit changes a tag, change both
   ends in the same rule.
10. **Inlined a long Python script into `bash -c "..."` twice.** Bash choked on quotes and
    backticks inside the body both times. **Write the script to a file and run the file.**

### How I work, so the seams don't show

- **Locate before changing.** One grep with alternation, not six greps.
- **Batch writes.** Several files in one message; a Python script with an `assert` per
  replacement when touching 3+ files the same way. Write the script to a file — see mistake 10.
- **Verify by measuring, never by looking.** Drive the app with JS and assert on numbers:
  `scrollWidth > clientWidth` for clipping, rects against `documentElement.clientWidth` for
  overflow, rendered text scanned for `undefined|NaN|null`, tap-target rects against 44px. For
  responsive work, measure inside a same-origin **iframe** — it has its own viewport.
- **When a result looks wrong, hand-check the arithmetic before "fixing" it.** The Governor and
  Magistrate both showing "7d 8h left" looked like a bug and was correct: the Venus sūkṣma is
  the last child of the Sun pratyantar, so they genuinely share an end instant.
- **Commit per logical chunk**, with a message that says *why* and what was deliberately left
  out. Then update this section.
