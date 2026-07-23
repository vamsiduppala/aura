# Phase 2 — login, local database, backend wiring

Turns aura into a production-style **local** app: real accounts, a local database, and the
web app talking to `apps/api` instead of only browser storage. No cloud, no secrets required.

## Run it locally (two terminals)

```bash
# 1) the local backend (Fastify + node:sqlite) on http://localhost:8787
npm --workspace @aura/api run start

# 2) the web app (Vite) on http://localhost:5173
npm --workspace @aura/web run dev
```

Open the web app. You'll land on a **sign-in / create-account** screen:

- **Create account / Sign in** → the birth profile is saved to the local API + SQLite DB and
  syncs whenever you sign in on this machine.
- **Continue on this device only** → guest mode; everything stays in browser storage (works
  even if the API isn't running).

The web app finds the API at `http://localhost:8787` by default; override with
`VITE_API_URL` in `apps/web/.env.local`.

## What's stored where

- **`apps/api`** uses Node 24's built-in `node:sqlite` (no native build). The DB file lives at
  `apps/api/data/aura.db` (gitignored). Tables: `users` (email + scrypt-hashed password),
  `sessions` (bearer tokens), `profiles` (one birth profile per user).
- Passwords are hashed with scrypt + a per-user salt; login returns a random 32-byte token
  the web client stores and sends as `Authorization: Bearer <token>`.

## API surface (Phase 2 additions)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/auth/register` | – | create account → `{ token, user }` |
| POST | `/auth/login` | – | sign in → `{ token, user }` |
| GET | `/auth/me` | Bearer | current user + saved profile |
| GET | `/profile` | Bearer | load the birth profile |
| PUT | `/profile` | Bearer | save/update the birth profile |

All the Phase-1 knowledge routes (`/grahas`, `/dasha/*`, `/tajaka/*`, `/varga`, …) remain
available on the same server for the Cosmic Mentor and future live-data wiring.

**Blueprint kundali via the API:** `POST /kundali` takes computed positions
(`{ lagnaSign, planets: { sun:{sign,house,longitude,retrograde?,combust?}, … all 9 } }`) and
returns the whole house-by-house reading — each house's occupants with dignity + a plain-language
placement interpretation, the lagna lord's reading, the Jaimini karakas (AK/AmK/DK), the chart's
Naabhasa shape, and any raaja / vipareeta yogas. It's the authoritative server-side chart reading;
the web still computes the same thing on-device to stay offline-first, so the round-trip is opt-in.

## Status

- [x] Local SQLite DB + auth (register/login) + profile save/load — `apps/api` (8 tests)
- [x] `POST /kundali` — the full blueprint chart reading served from the backend (composes the
      knowledge layer into houses + occupant interpretations + karakas + shape + raaja/vipareeta)
- [x] Web register/login screen + guest mode; profile persists to the API when signed in
- [x] Settings shows account + sign-out; App gates on auth state
- [x] Blueprint "Your timing clocks" — Vimshottari/Ashtottari/Narayana pulled from the API
      (`/dasha/*`) when the server is up, computed on-device otherwise (`services/liveData.ts`,
      shows a live/on-device badge).
- [x] Cosmic Mentor concept lookups grounded via the live API (`/search`) with an on-device
      fallback (`lookupAstrologyLive`); real-chart placements stay client-side.
- [x] Settings shows the local-server connection status; full auth→profile→dasha flow
      verified end-to-end over HTTP.
- [x] Editable profile: Settings → "Edit birth details" re-opens onboarding pre-filled with
      the saved chart; saving recomputes everything and re-persists (local + API when signed in).
- [x] Time-progressed "current period" per dasha system + a Tajaka "year ahead" view (Blueprint).
