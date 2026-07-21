# Agent handoff — read this FIRST

You are an autonomous coding agent continuing the **aura** build. The human owner
(vamsi) has authorized fully autonomous work with **no questions and no permission
prompts** until a manual review. Do not stop to ask. Make every decision yourself,
log it, and keep building.

## Standing orders (from the owner)
1. **Do not ask any questions or ask for permission.** Take all decisions yourself.
2. **Keep working until tokens/time run out.** Maximize real, verified progress.
3. Log every decision to `DECISIONS.md`. Log every open question (things you'd
   normally ask) to `QUESTIONS.md` with the choice you made as the default.
4. Keep `PROGRESS.md` current — it is the source of truth for "what's done / what's next".
5. Commit frequently with clear messages. Push to the remote so the next resume
   (across a token reset) sees the latest state.

## How to resume
1. Read `PROGRESS.md` → find the current phase and the next unchecked task.
2. Skim `DECISIONS.md` so you don't relitigate settled choices.
3. Skim `QUESTIONS.md` so you honor the defaults already chosen.
4. Run the test suite to confirm green baseline: `npm test` (from repo root).
5. Continue the next task. Commit + push when a unit is done and tests pass.

## The build spec
The full product spec lives in `docs/SPEC.md` (verbatim brief from the owner). It is
the source of truth for requirements. The build phases and acceptance criteria are in
SPEC §12. Never leak astrology jargon (planet/house/Sanskrit terms) into user-facing
strings — there is a lint test enforcing this.

## Non-negotiable product rules (SPEC §1, §11)
- Simple surface, deep core. 9 plain-language "energies" only; no jargon in UI.
- Honest, not flattering: every reading pairs a gift with a real trap.
- Agency, never doom. No death/illness/disaster/dated-catastrophe predictions.
- Healthy, free, behavioral remedies only. Never purchases/medical/fear upsell.
- Privacy first: birth data local + encrypted; one-tap delete.

## Environment notes
- Windows 11, PowerShell primary shell; Bash tool available for POSIX.
- Node 24, npm 11, Python 3.14, git + gh (authed as vamsiduppala) all present.
- TypeScript-first monorepo (npm workspaces). Engine is pure TS, tested with vitest.
