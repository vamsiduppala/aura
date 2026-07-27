# Putting aura on Replit (for family testing)

The whole app runs from **one URL and one port**: the backend serves the built web app *and* the
API, so there is no second address to configure and nothing to point at localhost.

---

## The minimum steps

**1. Import the repo**

In Replit: *Create Repl → Import from GitHub →* `https://github.com/vamsiduppala/aura.git`

**2. Add your Gemini key** (optional — the Mentor works without it, just less conversational)

Replit sidebar → **Secrets** (🔒) → add:

| Key | Value |
|---|---|
| `VITE_GEMINI_API_KEY` | your key |
| `VITE_GEMINI_MODEL` | `gemini-2.5-flash` |

**3. Press Run.**

That's it. `npm start` builds the web app and serves everything on Replit's public URL. Share
that URL with your family — each person creates their own account and their own chart.

---

## Two things worth knowing

**The key is baked into the browser bundle.** Anything prefixed `VITE_` ends up in the JavaScript
your family downloads, so treat that key as public. Fine for the throwaway key you're using; before
any real launch, move the Gemini call behind the API so the key stays on the server.

**The database is a file** (`apps/api/data/aura.db`). On Replit that persists in the workspace, but
a Deployment gets a fresh filesystem — so accounts created on the deployed version can disappear on
redeploy. For family testing that's usually fine. If you want it durable, switch the DB to Replit's
Postgres or mount a volume.

---

## If something looks wrong

| Symptom | Fix |
|---|---|
| Blank page | Check the console — usually the build didn't finish. Run `npm run build` in the shell. |
| "Can't reach your local aura server" | Only happens if `VITE_API_URL` is set to something wrong. Delete that secret; same-origin is automatic. |
| Mentor gives short, non-conversational answers | No key set, or the key is out of quota. It still answers from the real chart — that's the deterministic fallback. |
| `node:sqlite` error | Replit is on Node < 22.5. The `.replit` file pins `nodejs-24`; make sure it wasn't overridden. |
| Changes not showing | Stop and Run again — `npm start` rebuilds each time. |

---

## Running it locally instead

```bash
npm install
npm run dev     # API :8787 + web :5173 with hot reload
```

Local dev keeps the two servers separate (that's what hot reload needs). `npm start` is the
single-port production mode. See `INSTALL.md` for the Android/iOS builds.
