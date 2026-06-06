# Code Prompt — SMS opt-in consent flow (A2P 10DLC prerequisite)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Relates to:** Tracker 1.2 (Twilio SMS) and "Twilio production number + A2P 10DLC registration." Carriers require a documented opt-in flow + STOP handling before approving the campaign.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder exercises the running app. Run under Node 20.19.5; never hand-edit `node_modules`.

> **Apply this BEFORE the Twilio SMS prompt (1.2).** It creates the `sms_consent` field that 1.2's send-gate depends on.

---

## Why

A2P 10DLC carrier vetting requires: explicit opt-in capture, clear disclosure (purpose, message frequency, "msg & data rates may apply"), links to Terms + Privacy, and working **STOP** (opt-out) / **HELP** handling. Today the onboarding flow captures phone + a `preferred_contact` choice (which includes "Text / SMS") but **no explicit SMS consent and no opt-out path**. Selecting "Text / SMS" as a contact preference is **not** valid express consent on its own.

## Current state (for reference)
- `profiles.phone` exists (migration `002`).
- `client_profiles` already has `email_notifications` (jsonb) and `preferred_contact`.
- Onboarding UI: `src/components/client/onboarding-flow.tsx`, step 0 "Profile" collects name/phone/preferred contact; `CONTACT_METHODS` includes `sms`. Profile writes go through `src/actions/profile.ts`.

## Scope

**1. Schema** — new migration adding to `client_profiles`:
- `sms_consent boolean not null default false`
- `sms_consent_at timestamptz` (set when consent is granted; null otherwise)
- (optional) `sms_consent_source text` — e.g. `'onboarding'`, `'settings'` — for audit.
Regenerate types: `npx supabase gen types typescript --linked > src/types/database.ts` (keep `Relationships: []` on every table).

**2. Onboarding consent UI** (`onboarding-flow.tsx`, Profile step, near the phone field):
- An **unchecked-by-default** checkbox: *"Send me order updates by text message."*
- Directly below, the **disclosure copy** (verbatim — this is the A2P opt-in language; keep it as a single source-of-truth constant, e.g. `SMS_CONSENT_DISCLOSURE`):

  > By checking this box, I agree to receive order and account text messages from Luxury Lifestyle Vault at the phone number provided. Message frequency varies by account activity. Message and data rates may apply. Reply STOP to opt out or HELP for help. See our [Terms of Service](/terms) and [Privacy Policy](/privacy).

- The checkbox must be **independent** of the "Text / SMS" preferred-contact option — consent is its own explicit action.
- If the consent box is checked, require a phone number (validate E.164-ish) before the step can advance.
- Use Lucide icons only (no emoji), Shadcn-on-Base-UI components, the Obsidian & Ivory styling already in this file.

**3. Persist consent** — extend the profile server action (`src/actions/profile.ts`) so completing the Profile step writes `sms_consent`, `sms_consent_at` (now() when true, null when false), and `sms_consent_source = 'onboarding'`. Re-verify session; derive ids from `user.id`, never from form data.

**4. Client settings — opt-out/opt-in any time** (in the existing client settings/notifications area; check `src/app/(client)/.../settings` and `migration 015_client_settings`):
- A toggle to enable/disable SMS updates that updates the same columns (`sms_consent_source = 'settings'`).
- Disabling here is a valid opt-out and must immediately stop SMS (the 1.2 send-gate reads `sms_consent`).

**5. STOP / HELP inbound handling** — Twilio inbound webhook `src/app/api/webhooks/twilio/route.ts`:
- Public route (add to the proxy/middleware public-route allowlist in `src/proxy.ts`, like the other `/api/webhooks/*`).
- Validate the request is from Twilio (`twilio.validateRequest` with `TWILIO_AUTH_TOKEN`).
- On inbound **STOP / STOPALL / UNSUBSCRIBE / CANCEL / END / QUIT**: find the `client_profiles` row by phone and set `sms_consent = false`, `sms_consent_at = null`. (Twilio also auto-suppresses at the carrier level; we mirror it in our DB so the app stops trying.)
- On **START / UNSTOP**: re-enable. On **HELP**: respond with a brief help message (TwiML or let Twilio's default Advanced Opt-Out handle it — document which).
- Return valid TwiML / 204 as appropriate.

## Canonical opt-in copy (also for the founder's A2P submission)
Keep these strings in one module and reuse:
- **Opt-in disclosure:** the block quoted in step 2 above.
- **HELP reply:** `Luxury Lifestyle Vault: For help, email concierge@luxurylifestylevault.com. Msg & data rates may apply. Reply STOP to opt out.`
- **STOP confirmation:** Twilio sends the standard opt-out confirmation; no custom copy needed unless Advanced Opt-Out is customized.

## Acceptance criteria
- `npm run verify` clean; migration applies; types regenerated.
- A new client can complete onboarding **without** opting in (box unchecked → `sms_consent = false`); checking it (with a valid phone) sets `sms_consent = true` + timestamp.
- The disclosure text with STOP/HELP + Terms/Privacy links renders at the point of opt-in.
- Client settings can toggle consent off/on and it persists.
- Inbound **STOP** flips `sms_consent` to false in the DB; the webhook validates Twilio signatures and is a public route.

## Conventions (from CLAUDE.md)
- Server actions re-verify session; return `{ error }` / `{ success }`.
- `/api/webhooks/twilio` added to the public-route allowlist in `src/proxy.ts`.
- Lucide icons only; `useConfirm()` / `sonner` (no `confirm`/`alert`); `createAdminClient()` for the webhook's cross-RLS write.

## Report back
Files changed, migration number, `npm run verify` result, and founder steps: complete onboarding both with and without the box checked and confirm the `sms_consent` column reflects each; text STOP from a consented number and confirm consent flips off. Also hand the founder the canonical opt-in disclosure string to paste into the A2P campaign submission.
