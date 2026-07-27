# Working on aura — read this first

This file is the operating manual for anyone (human or model) picking up this repo. It exists so
you can act **without re-deriving context** and without going back and forth over the same files.
Follow it and a full feature lands in a handful of tool calls instead of fifty.

---

## 1. What this project is

A local-first Vedic-astrology app: **one honest reading a day**, computed from a real ephemeris,
grounded in an encoded classical text.

```
packages/engine      ephemeris + chart + dashas + reading synthesis (the maths & the voice)
packages/knowledge   the BOOK encoded as typed rule data (36 modules) — no prose copied
apps/api             Fastify + node:sqlite: accounts, profiles, and ~104 knowledge routes
apps/web             React + Zustand + Vite — also the Android/iOS app via Capacitor
```

**Source of truth for the astrology:** `vedic-astrology-an-integrated-approach2.md` (~21k lines).
**Progress ledger:** `docs/KNOWLEDGE_PROGRESS.md` — chapter-by-chapter, with line ranges.

Data flow: `birth details → engine.chart() → daily/forecast/blueprint`, with `apps/api` holding
accounts + profiles and serving knowledge lookups. The app is **offline-first**: every server
call has an on-device fallback, so it works with the API down.

---

## 2. The non-negotiables

1. **`tsc` is the only typecheck.** `vitest` does **not** type-check. Always run
   `npx tsc -p <pkg> --noEmit` for every package you touched.
2. **Never copy the book's prose.** Encode *rules* in your own concise words. No Devanagari
   mantras. Behavioural remedies only — never gemstones, fasting or rituals.
3. **Verify every calculation against a worked example from the book**, and cite it in the test
   name. If the book has no example, say so in the comment rather than inventing a rule.
4. **No mock/demo data in user-facing paths.** A pre-filled birth date once meant a new user could
   silently get a stranger's chart. Inputs start empty and gate the submit button.
5. **Safety rails hold**: never predict death or doom; crisis input routes to support
   (`detectCrisis`), and every generated line passes `checkNoDoom`.
6. **Commit per logical chunk**, with the trailer:
   `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` and the `Claude-Session:` line.

---

## 3. The method: plan once, batch everything

The expensive mistake is *round-tripping* — reading a file, editing it, re-reading it, running one
test, fixing one thing. Instead:

**Step 0 — Locate everything before changing anything.** One `grep` with alternation beats six
greps. Pull every passage/definition you'll need in a single call:

```bash
grep -nE "rudra|trishoola|maheswara|lajjita|garvita" vedic-astrology-an-integrated-approach2.md | head -20
```

**Step 1 — Read in batches.** `sed -n 'A,Bp' file` several times inside one Bash call, separated
by `echo` markers. Don't open a file you only need three lines of.

**Step 2 — Write in batches.** Multiple `cat >> file <<'EOF'` heredocs, or one Python script doing
several `str.replace()` edits across several files, in a single call. Use `Edit` for surgical
single-spot changes; use a Python batch when touching 3+ files the same way.

**Step 3 — Verify once, at the end.** Typecheck + tests for everything you touched, in one call:

```bash
for p in packages/knowledge apps/api apps/web; do npx tsc -p $p --noEmit; done; npx vitest run
```

**Step 4 — Commit with a message that explains *why*,** including what you deliberately did not do.

### Concretely, the shapes that work

| Task | Do this |
|---|---|
| Find where something lives | one `grep -rnE "a\|b\|c" --include=*.ts` |
| Read several regions | one Bash call, several `sed -n`, `echo` between |
| Edit 3+ files the same way | one Python heredoc with `str.replace()` + asserts |
| Add a knowledge rule | data module → `index.ts` export → test → API route → tracker, **all in one pass** |
| Check the UI really works | drive it in the browser with JS, not screenshots (see §5) |

---

## 4. Adding a book rule (the well-trodden path)

1. `grep` the book for the rule; read the passage.
2. Add the function to the right `packages/knowledge/src/data/*.ts` (create a module only for a
   genuinely new topic). Document the rule in the JSDoc, and note any exceptions you did *not*
   implement and why.
3. Export it from `packages/knowledge/src/index.ts`.
4. Add a test in `packages/knowledge/test/knowledge.test.ts` asserting the **book's own numbers**.
5. Expose an API route in `apps/api/src/server.ts` (validate inputs → `400`, never a garbage 200).
6. Update `docs/KNOWLEDGE_PROGRESS.md`.
7. Typecheck knowledge + api, run tests, commit.

**When a rule is not encodable** (needs a figure, or the book puts it out of scope) — say so
explicitly in the tracker and the code comment. Do **not** invent it. Shadbala, Vimsopaka and the
Sarvatobhadra/Kota chakra grids are the standing examples.

---

## 5. Verifying the UI without burning tokens

Screenshots are slow, huge, and this browser is zoom-locked. **Drive the app with JavaScript and
assert on values instead.** React inputs need the native setter or they won't register:

```js
const setVal = (el, v) => {
  const s = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
  s.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const click = re => [...document.querySelectorAll('button')]
  .find(b => re.test(b.textContent.trim()))?.click();
```

Ref-based clicks from `read_page` are unreliable here; text-matched `click()` is not. Keep each
`javascript_tool` call under ~40s (it times out) — split long flows into two calls.

**Find layout bugs by measuring, not looking.** Compare `scrollWidth > clientWidth` (clipped
text), rects against `innerWidth` (overflow), and scan text for `undefined|NaN|null`. That is how
the Blueprint bug below was caught — three numbers, no screenshot.

---

## 6. Known traps (each cost real time once)

- **`node:sqlite` needs Node 22.5+.** `db.ts` throws a clear message if not.
- **Vitest can't resolve `node:sqlite`** → it's loaded via `createRequire`. Don't "fix" that.
- **`node:sqlite` rejects unknown named params** — `upsertProfile` must not pass `updated_at`.
- **A class in JSX with no CSS rule silently does nothing.** `bp-wide` capped the Blueprint at
  560px for weeks. If a layout looks wrong, check the class actually exists in `styles.css`.
- **`API_BASE` must be read at runtime** (`apiBase()`), never baked in — phones can't use
  `localhost`.
- **Native apps bundle a built copy**: after web changes run `npm run cap:sync`.
- **The tests own the demo data.** Removing pre-filled onboarding values broke tests that relied
  on them; tests must fill inputs like a real user.
- Root `npx vitest` needs `vitest.workspace.ts` to pick up per-project environments (web = jsdom).

---

## 7. Commands worth memorising

```bash
npm run dev                      # API :8787 + web :5173
npm test                         # all four workspaces
npm run typecheck                # real tsc everywhere
npx vitest run --root packages/knowledge      # just the book tests
cd apps/web && npm run cap:sync               # push web build into android/ + ios/
```

Ports: web **5173**, API **8787**. DB: `apps/api/data/aura.db` (gitignored).

---

## 8. Definition of done

- [ ] `tsc` clean for every touched package
- [ ] All tests green (`npx vitest run`)
- [ ] New calculations verified against the book's worked examples
- [ ] Tracker / docs updated, including what was deliberately left out
- [ ] Committed with the required trailer
