# Account, identity & commerce — the gap analysis

The product spec in `ideafiles/` covers onboarding (A1–A15) and a settings list (Y0–Y9), but it
stops at *screens*. This document covers what an app that holds birth data and takes money
actually needs underneath: identity, session security, account state, entitlements, and the
legal surface. It is the implementation list for that half of the app.

**Why this is not optional here.** Birth date + time + place is, in some jurisdictions,
effectively identifying data — closer to a national ID than to a preference. An account that
can be taken over exposes something the user cannot rotate. That raises the bar above
"email and password work".

---

## 1. Where we actually are

`apps/api/src/auth.ts` + `db.ts`, honestly assessed:

| Present | Quality |
|---|---|
| scrypt password hashing, 16-byte per-user salt, `timingSafeEqual` comparison | **Good.** Correct primitive, correct comparison. |
| Opaque 32-byte random session tokens | **Good entropy**, but see gaps below. |
| Change password re-checks the current one and invalidates other sessions | **Good.** The right behaviour. |
| Hard account deletion (profile + sessions + user) | Works, but no grace period and no audit trail. |
| Birth-time confidence persisted with a conservative default | Added this session. |

### Gaps, by severity

**S1 — exploitable today**

| # | Gap | Consequence |
|---|---|---|
| 1 | **Session tokens stored in plaintext** in `sessions.token` | A read of the DB file (backup, stolen laptop, misconfigured volume) is a full account takeover for every user, no cracking required. Passwords are hashed; sessions are not, so the weaker link is the one that matters. |
| 2 | **Sessions never expire** and are never rotated | A token captured once is valid forever. There is no `expires_at`, no idle timeout, no rotation on password change for the calling device. |
| 3 | **No rate limiting or lockout** on `/auth/login` | Unbounded online password guessing against an 8-character minimum. |
| 4 | **No email verification** | Anyone can register with someone else's address; that address then receives the app's mail and can be used for a reset. |
| 5 | **No password reset** | A forgotten password is a permanently lost account — including the birth chart. |
| 6 | **No re-authentication for sensitive actions** | A live session can delete the account or change the email with no password prompt. |

**S2 — needed before anyone but you uses it**

| # | Gap | Consequence |
|---|---|---|
| 7 | Password policy is length-only | "password" passes. No breach check, no common-list rejection. |
| 8 | No account states | No representation of unverified / locked / soft-deleted / banned. Deletion is immediate and irreversible with no confirmation window. |
| 9 | No session/device inventory | The user cannot see or revoke where they are signed in. Required by the settings list (Y8) and by every credible privacy policy. |
| 10 | No audit log | A takeover cannot be investigated. No record of sign-ins, password changes, email changes or exports. |
| 11 | Email is the only identifier | India-first audience: **phone + OTP is the primary method** people expect. Apple sign-in is *mandatory* if Google is offered (App Store 4.8). |
| 12 | No idempotency on mutating endpoints | A retried `PUT /profile` on a flaky mobile connection can race itself. |
| 13 | No CSRF consideration | Bearer-token-only today, which is fine — but this must stay a deliberate decision, not an accident, if a cookie is ever added. |

**S3 — product-shaped, not yet built at all**

| # | Gap |
|---|---|
| 14 | **Multiple charts** (self, spouse, child, parent) + a chart switcher + a primary chart. The single cheapest paid tier in this product. |
| 15 | **Subscription and entitlements.** No tiers, no receipt validation, no restore, no paywall. |
| 16 | **Account identity surface**: avatar / monogram, display name, joined date. |
| 17 | **Data export** (JSON + PDF) — an App Store and DPDP/GDPR expectation. |
| 18 | **Notification preferences**: channels, quiet hours, per-plan overrides. |
| 19 | **Locale**: Hindi / Telugu / Tamil are the market, and the court metaphor translates well. |
| 20 | **Legal acceptance record**: which terms version was accepted, and when. |
| 21 | **Support surface** that attaches chart id + engine version + app version. Without those three, a timing complaint is not debuggable. |
| 22 | **Passkeys (WebAuthn)** — the modern answer to 1–7 in one move, and a good fit for a phone-first app. |

---

## 2. Target data model

Additions to `apps/api`. Existing tables keep their shape; everything below is additive so
current databases migrate forward (the `PRAGMA table_info` pattern already in `db.ts`).

### `users` — extend

```
email_verified_at    TEXT NULL
phone                TEXT NULL UNIQUE      -- E.164, primary identifier for India-first
phone_verified_at    TEXT NULL
status               TEXT NOT NULL DEFAULT 'active'
                     -- active | unverified | locked | soft_deleted | banned
locked_until         TEXT NULL             -- lockout after repeated failures
failed_attempts      INTEGER NOT NULL DEFAULT 0
deleted_at           TEXT NULL             -- 30-day soft delete, then hard purge
locale               TEXT NOT NULL DEFAULT 'en'
terms_version        TEXT NULL
terms_accepted_at    TEXT NULL
```

### `sessions` — replace token storage

```
id             TEXT PRIMARY KEY          -- public session id, safe to log
token_hash     TEXT NOT NULL UNIQUE      -- SHA-256 of the bearer token; the token itself
                                         -- is never stored, exactly like a password
user_id        INTEGER NOT NULL
created_at     TEXT NOT NULL
last_seen_at   TEXT NOT NULL
expires_at     TEXT NOT NULL             -- absolute cap (e.g. 90 days)
device_label   TEXT                      -- "iPhone · Safari", derived from User-Agent
ip_hash        TEXT                      -- hashed, never raw — see R22
revoked_at     TEXT NULL
```

Lookup becomes: hash the incoming bearer, match `token_hash`, check `revoked_at IS NULL`
and `expires_at > now`, then bump `last_seen_at`. Same cost, no plaintext credential at rest.

### `auth_codes` — OTP and reset tokens, one table

```
id           TEXT PRIMARY KEY
user_id      INTEGER NULL       -- null for sign-up OTP to an unknown number
purpose      TEXT NOT NULL      -- signup_otp | login_otp | password_reset | email_verify
target       TEXT NOT NULL      -- phone or email the code was sent to
code_hash    TEXT NOT NULL      -- hashed; a leaked table must not be usable
expires_at   TEXT NOT NULL      -- 10 min for OTP, 15 min for reset
consumed_at  TEXT NULL          -- single use, enforced
attempts     INTEGER NOT NULL DEFAULT 0
created_at   TEXT NOT NULL
```

### `charts` — the multi-chart change

Today the profile *is* the chart, one per user. This splits them, which is also what makes
a paid tier possible.

```
id                    TEXT PRIMARY KEY
user_id               INTEGER NOT NULL
label                 TEXT NOT NULL        -- "Me", "Priya", "Dad"
relation              TEXT                 -- self | partner | child | parent | other
birth_date            TEXT NOT NULL
birth_time            TEXT NULL
unknown_time          INTEGER NOT NULL
birth_time_confidence TEXT NOT NULL
place, lat, lng, tz_id, tz_offset
ayanamsa              TEXT NOT NULL DEFAULT 'lahiri'
engine_version        TEXT NOT NULL        -- which ephemeris produced cached values
is_primary            INTEGER NOT NULL DEFAULT 0
created_at, updated_at
```

`profiles` stays as the v1 single-chart row and is migrated into `charts` on first read, so
nothing breaks while both exist.

### `entitlements` — one row per user, server-authoritative

```
user_id          INTEGER PRIMARY KEY
tier             TEXT NOT NULL DEFAULT 'free'   -- free | plus
source           TEXT                            -- app_store | play | stripe | promo
status           TEXT                            -- active | grace | expired | refunded
current_period_end TEXT
store_txn_id     TEXT                            -- for idempotent webhook replay
updated_at       TEXT NOT NULL
```

**The client never decides what the user paid for.** It reads the entitlement; it does not
compute it from a receipt. Three stores means three receipt formats and one truth.

### `audit_log`

```
id, user_id, event, at, session_id, ip_hash, meta_json
-- event: signin_ok | signin_fail | signup | password_change | email_change
--        session_revoke | export_request | delete_request | entitlement_change
```

Never contains birth date, time or place (R22).

---

## 3. Endpoint surface

```
POST   /auth/otp/start          { phone | email, purpose }  → 202, rate-limited
POST   /auth/otp/verify         { target, code }            → session
POST   /auth/register           email + password             (exists; add verification)
POST   /auth/login              email + password             (exists; add lockout)
POST   /auth/oauth/apple        identity token → session     (private-relay email handled)
POST   /auth/oauth/google       id token → session
POST   /auth/passkey/register   WebAuthn attestation
POST   /auth/passkey/assert     WebAuthn assertion → session
POST   /auth/password/forgot    { email } → 202 (never reveals whether it exists)
POST   /auth/password/reset     { token, newPassword }
POST   /auth/password           current + new                (exists)
POST   /auth/reauth             password | passkey → short-lived elevation token
GET    /auth/me                                              (exists)
GET    /auth/sessions           list devices
DELETE /auth/sessions/:id       revoke one
DELETE /auth/sessions           revoke all others

GET    /charts                  list
POST   /charts                  create (gated by entitlement: free = 1)
PATCH  /charts/:id              edit → destructive-confirm on the client
DELETE /charts/:id
POST   /charts/:id/primary

GET    /entitlement
POST   /billing/validate        { store, receipt } → entitlement
POST   /billing/webhook/:store  store-signed, idempotent on store_txn_id
POST   /billing/restore         re-validate from the store

POST   /account/export          → emailed JSON + PDF, requires reauth
DELETE /account                 → soft delete, requires reauth   (exists as hard delete)
POST   /account/undelete        within the 30-day window
GET    /support/context         chart id + engine version + app version, no birth data
```

---

## 4. The account screens

What "You" actually contains, replacing the current single flat list.

### Y0 · Account header
- **Monogram avatar, not an upload.** A circle carrying the person's initials, tinted with
  **their current King's planet colour** and drawn with the neumorphic raised recipe. It is
  derived, always present, needs no storage, no CDN, no moderation queue, and it changes
  when their King changes — which quietly teaches the core idea. An optional photo upload can
  come later; it is a moderation and privacy cost, not a feature.
- Display name, and the identifier actually used to sign in (phone or email).
- Tier badge (`FREE` / `PLUS`) — the one place commerce is visible outside the paywall.
- **Chart switcher**: horizontal row of monograms, one per chart, plus `+`. Switching
  re-renders the whole app against that chart.

### Y1 · Charts
List with label, relation, birth summary, `PRIMARY` tag. Add / edit / delete. Free tier shows
one row plus a locked row explaining the limit — locked, not hidden, so the value is legible.

### Y2 · Birth details *(per chart)*
Date, time, place, and the **birth-time confidence selector** with the drift table. Any edit
raises a destructive confirm naming the consequence: *"This rebuilds this chart and re-times
its 2 plans. Past dates will move."*

### Y3 · Calculation *(per chart)*
Ayanāṁśa (default Lahiri), house system, `engine_version` shown read-only. Changing ayanāṁśa
is destructive and confirms with the real magnitude: *up to a year of movement.*

### Y4 · Sign-in & security
- Method(s) in use; add a passkey; add a phone; add a password.
- Change password (requires current).
- **Active sessions**: device label, last seen, this-device marker, revoke, revoke-all.
- Recent security activity, from `audit_log` — sign-ins, changes, exports.

### Y5 · Notifications
Channels (push / email / SMS), day-before toggle, **quiet hours in the user's current
timezone**, per-plan overrides. SMS carries "carrier rates apply" and a `PLUS` tag.

### Y6 · Subscription — the buy surface
- Current tier, renewal date, and **where it was bought** (App Store / Play / web), because
  that decides where it can be cancelled.
- `Manage` deep-links to the correct store's subscription page.
- **`Restore purchases`** — an App Store requirement, not a nicety.
- Free → Plus comparison, honest about what Plus is *for*:

| | Free | Plus |
|---|---|---|
| Charts | 1 | 5 |
| Timeline, court, all five rings | ✓ | ✓ |
| Plans | 1 active | unlimited |
| Mentor messages | daily cap | higher cap |
| **Birth-time rectification** | — | ✓ |
| SMS shift alerts | — | ✓ |
| Export (JSON + PDF) | ✓ | ✓ |

**Rectification is the honest premium feature.** It is the only thing that actually fixes the
drift problem the whole gate exists because of: confirm 3–5 dated life events, search a ±
window of birth times for the one whose boundaries best align. Everything else is a quota.

- Paywall placement: **at the second chart**, and at the rectification entry point. Never at
  first launch, never in front of the Timeline.
- Price in local currency; India needs its own price point, not a converted one.
- GST invoice available for Indian purchases.

### Y7 · Display
Show Sanskrit terms, theme, language (en / hi / te / ta), reduce motion (mirrors the OS).

### Y8 · Data & privacy
Export everything, delete account (typed confirmation, 30-day window, undo path), what is
collected and what is never sent (birth data excluded from analytics and crash reports).

### Y9 · About & support
App version, engine version, terms + privacy with the accepted version and date, and a
support route that attaches chart id + engine version + app version and nothing else.

---

## 5. Implementation order

Each step is shippable and leaves the app working.

1. **Session hardening** — `token_hash`, `expires_at`, `last_seen_at`, device label,
   `GET/DELETE /auth/sessions`. Closes gaps 1, 2, 9. No UI change required beyond Y4.
2. **Login protection** — failed-attempt counter, lockout window, per-IP and per-account rate
   limits on `/auth/login` and `/auth/otp/start`. Closes gap 3.
3. **Password reset + email verification** via `auth_codes`. Closes gaps 4, 5. Requires an
   outbound mail path — until one exists, the code is surfaced through the API in development
   only and never in a production build.
4. **Re-auth elevation** for delete / export / email change. Closes gap 6.
5. **Password policy** — length + common-password rejection + optional breach check by
   k-anonymity range query. Closes gap 7.
6. **Account states + soft delete** with the 30-day window and `POST /account/undelete`.
   Closes gap 8.
7. **Audit log**, written by every auth path. Closes gap 10.
8. **Phone + OTP**, then Apple, then Google. Closes gap 11. Apple is mandatory once Google
   ships.
9. **Multi-chart** — `charts` table, migration from `profiles`, switcher, Y1. Gap 14.
10. **Entitlements** — table, `GET /entitlement`, free-tier enforcement at chart 2 and plan 2,
    the Y6 comparison screen with no purchase path yet. Gap 15.
11. **Store integration** — StoreKit 2, Play Billing, Stripe; webhook idempotency; restore.
12. **Passkeys**, which retires most of the password surface. Gap 22.
13. **Export, notification preferences, locale, legal record, support context.** Gaps 17–21.

**Not doing, deliberately:** photo avatar upload (moderation + storage cost for no product
gain over the monogram); SMS as a free channel (expensive, muted, and it trains people to
ignore the alerts that matter); social login beyond Apple and Google; any client-side
entitlement decision.
