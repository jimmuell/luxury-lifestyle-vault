# LLV — Environment Config & Production Cutover (external integrations)

**Living reference.** Last updated: 2026-06-06.
**Purpose:** Track which external-service settings are **trial/test** today vs. what must change for **production**, so nothing is missed at launch. Switching environments is almost all **config (env vars), not code** — the code reads env values.

**How environments map:** local `.env` = your machine · Vercel env vars = deployed app (Preview and **Production** are separate scopes in Vercel) · production Supabase/Stripe/Twilio/Sentry are distinct from test.

---

## Twilio (SMS) — TRIAL today ⚠️
**Current state (2026-06-06):**
- Account is on **Trial** ("My first Twilio account").
- **Trial toll-free number** `(833) 756-798x` claimed — expires ~30 days.
- **Toll-free Verification** submitted (use case = Account Notifications; opt-in = Web Form; proof-of-consent = public Drive doc; sample/HELP copy from `src/lib/sms/consent.ts`).
- Outbound to real handsets is **blocked until verification is approved** (error `30032`). Testing now via **Virtual Phone** + **inbound STOP** (inbound isn't gated by verification).
- Env vars (local `.env`, and Vercel as you test): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (= trial toll-free).

**At production cutover:**
- [ ] Decide the **final sender**: verified **toll-free** (keep this number) OR **10DLC A2P Standard Brand** (needs the **EIN**; higher trust/throughput). Plan currently favors Standard Brand for launch.
- [ ] **Upgrade Twilio out of trial** (add billing) so the number isn't reclaimed and you can message non-verified recipients.
- [ ] Complete the chosen registration (toll-free verification approved, or A2P brand + campaign approved).
- [ ] Set production `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` in the **Vercel Production** scope.
- [ ] Point the number's inbound **"A message comes in"** webhook at `https://luxurylifestylevault.com/api/webhooks/twilio`.
- [ ] Re-test STOP/HELP + a real outbound text on production.

## Resend (email) — apex live ✅ (verify prod env)
**Current:** sending domain switched to **apex** `luxurylifestylevault.com` (verified). New API key "Luxury-Lifestyle-Vault." Local `.env`: `RESEND_API_KEY` (new key) + `RESEND_FROM_EMAIL=noreply@luxurylifestylevault.com`. Code fallback also apex.

**At production cutover:**
- [ ] Confirm `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set in **Vercel Production** (not just local/preview).
- [ ] Consider a least-privilege **Sending-only** key for prod instead of the full-access key.
- [ ] Confirm a **DMARC** record on the root domain.

## Sentry (errors) — code shipped, not yet active
**Current:** `@sentry/nextjs` shipped; no DSN set → safely no-ops.

**At production cutover:**
- [ ] Create the Sentry project; set `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` (+ optional `SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT`) in **Vercel Production**.
- [ ] Add a production alert rule. (Full steps: `llv_founder_step_2026-06-06_sentry_activation.md`.)
- [ ] `/api/_sentry-test` 404s in prod via `SEED_TOOLS_ENABLED` being unset — fine to leave, or have Code remove it.

## App URL & seed guard
- [ ] `NEXT_PUBLIC_APP_URL` = the **production domain** in the prod scope (drives email links + redirects).
- [ ] `SEED_TOOLS_ENABLED` **UNSET** in production (seed pages 404, seed/reset actions throw). Set only on local + test.

## Legal pages & entity
- [x] `/terms` + `/privacy` **live and public** ✅ (prompt `06` shipped 2026-06-06, commits `e48f390..f354aab`; verified reachable logged-out). Pages currently render `[PLACEHOLDERS]`.
- [ ] Replace `[PLACEHOLDERS]` in the ToS/Privacy drafts (`docs/legal/`) with the formed **entity name/address** once the WI LLC exists.

## Stripe (separate gate, for completeness)
- [ ] Swap Stripe test keys → **live** keys in Vercel Production; update webhook endpoint + signing secret. (Tracked separately.)

---

### One-glance production cutover checklist
- [ ] Twilio out of trial + final number registered (TF verified **or** 10DLC A2P Standard Brand via EIN)
- [ ] `TWILIO_*` in Vercel Production; inbound webhook → prod domain
- [ ] Resend key + apex from-address in Vercel Production; DMARC set
- [ ] Sentry DSN + alert rule in Vercel Production
- [ ] `NEXT_PUBLIC_APP_URL` = prod domain; `SEED_TOOLS_ENABLED` unset in prod
- [ ] `/terms` + `/privacy` live with finalized entity details
- [ ] Stripe live keys + webhook
