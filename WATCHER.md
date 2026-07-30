# WATCHER — the running progress journal

**Append-only. Newest at the bottom. Never edit or delete an existing entry.**

This file exists so that an agent arriving with **zero context — a brand new session, no
memory of anything** — can be productive within one read. It is written *during* the work,
not after it, so a session that dies mid-task still leaves a usable trail.

Entries are appended by `scripts/watch.mjs`, which captures the repo's **actual** state
(HEAD, dirty files, which parts are done, and optionally whether it typechecks and passes)
rather than whatever the author believed at the time.

---

## ▶ BOOT SEQUENCE — do this before touching anything

You are picking up a project mid-flight. Work through these in order. It takes about ten
minutes and it will save you a day.

**1. Read `GEMINI.md` in full.** All of it, including §2 (the 30+ numbered rules) and §5
(CURRENT STATE). It is the operating manual and the contract between agents. In particular:

- **R1: no mock, static, demo or placeholder data. Anywhere. Ever.** This is the user's
  standing instruction and there is a test that enforces it.
- **§1 tells you the source of truth changed.** `new-structure.md` supersedes the older specs
  in `ideafiles/`.
- **§5 tells you which of the four Parts is in progress and what the next action is.**

**2. Read `new-structure.md`.** The architecture plan. You do not need to memorise §6–§11 yet,
but you must read §0 (the one principle everything follows from) and the sections for the Part
you are about to work on.

**3. Read the last three entries in this file, bottom-up.** That is where the work actually
is. §5 of GEMINI.md is a snapshot; this is the trail.

**4. Establish ground truth yourself. Do not trust any file, including this one:**

```bash
git log --oneline -5          # where are we really
git status --short            # is anything half-finished
npm run check:generated       # are tokens/dist and vectors.json stale
npm run typecheck             # all five workspaces
npm test                      # expected counts are in GEMINI.md §5
```

If any of those disagree with what this file says, **this file is out of date and the repo
wins**. Append an entry saying so, then carry on from what you found.

**5. Install the hook and start journalling.**

```bash
npm run watch:install                      # once per clone — .git/hooks is not committed
npm run watch -- "picked up, starting X"   # then after every meaningful step
```

Set `VIM_AGENT=Gemini` in your environment so entries are attributed to you, not to Claude.

**6. Work in the order §5 gives you.** Do not start a later Part before the earlier one is
committed and verified.

### The rhythm

| When | Do |
|---|---|
| Picked up the repo | `npm run watch -- "picked up: <what you plan to do>"` |
| Finished a file or a decision | `npm run watch -- "<what and why>"` |
| Hit something surprising | `npm run watch -- "TRAP: <what bit you>"` and add it to `GEMINI.md` §3 |
| About to commit | `npm run watch -- --full "pre-commit verify"` |
| Committed | automatic, if the hook is installed |
| Stopping for any reason | `npm run watch -- "STOPPING: <exact next action>"` **and** overwrite `GEMINI.md` §5 |

**The last entry before you stop is the most important thing you will write.** Say what the
next concrete action is, not "continue Part 3".

### Reading the state line

```
- Parts: 1:done · 2:done · 3:in-progress · 4:todo
```
Read out of `GEMINI.md`'s own parts table, so if it drifts from reality that is itself a bug.

---

## Journal

<!-- Appended by scripts/watch.mjs. Do not hand-edit above this line. -->

### 2026-07-29 · Claude Opus 5 · backfill: Parts 1 and 2, before the watcher existed

This entry is written by hand because the watcher did not exist while Parts 1 and 2 were
built. Everything after this line is machine-captured.

**Part 1** — `24b2b0e`. Design token pipeline (`packages/tokens`: one JSON → CSS + TS + Dart),
the §5.1 web design system, the responsive shell (one `<nav>` reshaped by CSS from a bottom bar
into a left rail at 1280px, two-pane Timeline at 1024px, card grids), the §4.2 ring geometry
(360 canvas, uniform 22 stroke, radii 158/130/102/74/46, track at 12% of the ring's own
colour), the 3-item nav with Account behind a King-tinted monogram avatar, and the M9
non-colour identity channels (glyph tick + one of nine stroke textures per planet).

Measured in a same-origin iframe at 394 / 814 / 1260 / 1686: nav flips to a sidebar at 1280,
wheel scales 307 → 440px, panes go 1 → 2 at 1024, and at no width is there horizontal scroll,
clipped text, an element past the viewport, or a tap target under 44px.

**Part 2** — `67dfacb`. All five `new-structure.md` §3 engine rules made true: integer
microsecond arithmetic (was float ms), sub-period boundaries derived from cumulative year
totals so children close on the parent exactly, a test that greps the engine for clock access,
ayanāṁśa as a stored parameter, and `ENGINE_VERSION` stamped on every chart with
`boundaryDrift()` for the M19 recompute-and-diff path. Plus the §3 uncertainty envelope, whose
formula reproduces the plan's §1.1 drift table on all five rows and both columns, and
`packages/vectors` — 41 golden fixtures run in CI.

400 tests green. Verified no regression in the running app: the same real profile still
resolves to Jupiter King / Saturn PM, and the King's ring still reads 22.31%, confirming
boundaries moved by under a millisecond.

**Next:** Part 3 — Plan Composer as versioned rules (§4.5) and composable interpretation
(§4.6). Briefed in detail in `GEMINI.md` §5.

### 2026-07-30 01:25 · Claude Opus 5
**watcher installed; starting Part 3 (Plan Composer §4.5 + composable interpretation §4.6)**

- HEAD: `` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: 3 file(s)
  - `M package.json`
  - `?? WATCHER.md`
  - `?? scripts/`
- Verify: _not run (use `--full`)_

### 2026-07-30 01:26 · Claude Opus 5
**fixed the watcher's blank-HEAD bug (unquoted git --pretty format); GEMINI.md now boots from WATCHER.md**

- HEAD: `77fda5c Handoff: Part 2 done, Part 3 briefed` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: 4 file(s)
  - `M GEMINI.md`
  - ` M package.json`
  - `?? WATCHER.md`
  - `?? scripts/`
- Verify: _not run (use `--full`)_

### 2026-07-30 01:30 · Claude Opus 5
**TRAP: naturalRelation() is asymmetric (Mars->Mercury enemy, Mercury->Mars neutral). Composer reads PARENT->CHILD deliberately; pinned by a test**

- HEAD: `77fda5c Handoff: Part 2 done, Part 3 briefed` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: 6 file(s)
  - `M GEMINI.md`
  - ` M package-lock.json`
  - ` M package.json`
  - `?? WATCHER.md`
  - `?? packages/rules/`
  - `?? scripts/`
- Verify: _not run (use `--full`)_

### 2026-07-30 04:38 · Claude Opus 5
**composer wired into the app: PUSH/BUILD/HOLD replaces push/pause, rulesVersion on every derived plan, 'why this stage' disclosure added**

- HEAD: `77fda5c Handoff: Part 2 done, Part 3 briefed` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: 13 file(s)
  - `M GEMINI.md`
  - ` M apps/vim/package.json`
  - ` M apps/vim/src/core/plan.ts`
  - ` M apps/vim/src/screens/PlanDetail.tsx`
  - ` M apps/vim/src/screens/Planner.tsx`
  - ` M apps/vim/src/screens/StageDetail.tsx`
  - ` M apps/vim/src/test/plan.test.ts`
  - ` M apps/vim/src/theme/components.css`
  - ` M package-lock.json`
  - ` M package.json`
  - `?? WATCHER.md`
  - `?? packages/rules/`
  - `?? scripts/`
- Verify: _not run (use `--full`)_

### 2026-07-30 04:43 · Claude Opus 5
**pre-commit verify: composer half of Part 3**

- HEAD: `77fda5c Handoff: Part 2 done, Part 3 briefed` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: 17 file(s)
  - `M GEMINI.md`
  - ` M apps/vim/package.json`
  - ` M apps/vim/src/App.tsx`
  - ` M apps/vim/src/core/plan.ts`
  - ` M apps/vim/src/screens/Mentor.tsx`
  - ` M apps/vim/src/screens/PlanDetail.tsx`
  - ` M apps/vim/src/screens/Planner.tsx`
  - ` M apps/vim/src/screens/StageDetail.tsx`
  - ` M apps/vim/src/screens/Timeline.tsx`
  - ` M apps/vim/src/screens/You.tsx`
  - ` M apps/vim/src/test/plan.test.ts`
  - ` M apps/vim/src/theme/components.css`
  - ` M package-lock.json`
  - ` M package.json`
  - `?? WATCHER.md`
  - `?? packages/rules/`
  - `?? scripts/`
- Verify: typecheck clean · tests 0 passed

### 2026-07-30 04:47 · commit · commit
**Part 3a: the Plan Composer, as scored rules over versioned data**

- HEAD: `cc06c0b Part 3a: the Plan Composer, as scored rules over versioned data` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: nothing — tree clean
- Verify: _not run (use `--full`)_

### 2026-07-30 04:55 · commit · commit
**Part 3b: composable interpretation — 93 fragments covering 59,049 combinations**

- HEAD: `536b8bc Part 3b: composable interpretation — 93 fragments covering 59,049 combinations` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: nothing — tree clean
- Verify: _not run (use `--full`)_

### 2026-07-30 04:56 · Claude Opus 5
**Part 3 complete and committed. Next: Part 4 (Mentor gateway §4.7, notifications M5, auth/entitlements M1/M6, privacy M7)**

- HEAD: `536b8bc Part 3b: composable interpretation — 93 fragments covering 59,049 combinations` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: 1 file(s)
  - `M WATCHER.md`
- Verify: _not run (use `--full`)_

### 2026-07-30 04:56 · commit · commit
**docs: Part 3 done, Part 4 next**

- HEAD: `366dc7d docs: Part 3 done, Part 4 next` on `main`
- Parts: 1:done · 2:done · 3:todo · 4:todo
- Uncommitted: nothing — tree clean
- Verify: _not run (use `--full`)_

### 2026-07-30 04:57 · commit · commit
**docs: mark Part 3 done in both parts tables and the roadmap**

- HEAD: `9ec2b39 docs: mark Part 3 done in both parts tables and the roadmap` on `main`
- Parts: 1:done · 2:done · 3:done · 4:in-progress
- Uncommitted: nothing — tree clean
- Verify: _not run (use `--full`)_

### 2026-07-30 04:57 · Claude Opus 5
**verified parts tables now read 3:done 4:next**

- HEAD: `9ec2b39 docs: mark Part 3 done in both parts tables and the roadmap` on `main`
- Parts: 1:done · 2:done · 3:done · 4:in-progress
- Uncommitted: 1 file(s)
  - `M WATCHER.md`
- Verify: _not run (use `--full`)_
