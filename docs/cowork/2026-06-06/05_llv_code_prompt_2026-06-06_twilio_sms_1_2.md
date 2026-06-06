# Code Prompt — Wire Twilio SMS for high-signal events (Tracker 1.2)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Tracker:** 1.2 Wire Twilio SMS (high-signal events) · Phase 1 — Engineering · Priority High

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder will exercise the running app. Run under Node 20.19.5; never hand-edit `node_modules`.

> **Dependency — do this prompt SECOND.** SMS may only be sent to clients who gave explicit opt-in consent. The consent field + onboarding capture is added by the **SMS consent flow** prompt (`04_llv_code_prompt_2026-06-06_sms_consent_flow.md`). Apply that one first so the `sms_consent` column exists. If it is not yet applied, still build everything here but gate sends on `client_profiles.sms_consent === true` (the column will exist once the consent prompt lands).

---

## Goal

Twilio is installed (`twilio` 6.0.2) and the env vars exist (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) but nothing sends SMS. Wire SMS for **high-signal lifecycle events only**, mirroring the existing Inngest email architecture, and **strictly respecting opt-in consent**. Production sending later depends on A2P 10DLC registration (founder task) — this prompt is the code half.

## Architecture — mirror the email pattern exactly

The email system is the template to copy:
- `src/actions/orders.ts` emits an `email/send` Inngest event at lifecycle points.
- `src/lib/inngest/functions/send-email.ts` handles `email/send` → calls `sendEmail()` in `src/lib/resend/send.ts`.

Build the SMS equivalent the same way so the two stay symmetric.

### 1. Twilio client — `src/lib/twilio/client.ts`
- Lazy singleton, like `getResend()` in `src/lib/resend/client.ts`.
- Export `getTwilio()`, `TWILIO_FROM` (= `process.env.TWILIO_PHONE_NUMBER`), and `isSmsConfigured` (boolean: all three env vars present).
- Optional `isSmsDevMode` (e.g. `TWILIO_DEV_MODE === 'true'`) mirroring `isDevMode` in Resend, to write to a dev table instead of sending.

### 2. Send helper — `src/lib/twilio/send.ts`
Export `sendSms({ recipientProfileId, to, template, body })`:
- `template` is a union type like the email `EmailTemplate`: `'order_confirmation' | 'order_shipped' | 'order_delivered' | 'condition_issue'`.
- **Consent + reachability gate (hard requirement):** before sending, load the recipient's `client_profiles` row and send **only if** `sms_consent === true` **and** a non-empty E.164 `phone` exists. Otherwise return silently (no error, no record-as-sent).
- If `!isSmsConfigured`: log and return gracefully (do not throw) — keeps dev/CI green before Twilio creds are set.
- Persist an audit row (create a small `sms_sends` table mirroring `email_sends`: `recipient_profile_id`, `template_name`, `to_number`, `status` queued/sent/failed, `twilio_sid`, `error_message`, `sent_at`). Add a migration for it.
- In dev mode, insert into a `dev_sms_outbox` table instead of calling Twilio (mirror `dev_email_inbox`).
- On real send: `getTwilio().messages.create({ from: TWILIO_FROM, to, body })`, store the returned `sid`, update status.

### 3. Inngest function — `src/lib/inngest/functions/send-sms.ts`
- Mirror `send-email.ts`: `id: 'send-sms'`, trigger `{ event: 'sms/send' }`, `retries: 3`, body calls `sendSms(event.data)`.
- Register it in `src/app/api/inngest/route.ts` alongside the existing six functions.

### 4. SMS copy — `src/lib/twilio/messages.ts`
Short, plain-text, branded. Keep each under ~320 chars. Include the brand name and a STOP notice on the first/opt-in-relevant message for A2P compliance. Examples:
- `order_confirmation`: `Luxury Lifestyle Vault: your {typeLabel} is confirmed. Track it in your member portal. Reply STOP to opt out, HELP for help.`
- `order_shipped`: `Luxury Lifestyle Vault: your items are on their way. {trackingLine}`
- `order_delivered`: `Luxury Lifestyle Vault: your items have been delivered. We hope everything arrived in perfect condition.`
- `condition_issue`: `Luxury Lifestyle Vault: your concierge flagged a condition note on a returned item and will be in touch. View details in your portal.`

### 5. Emit `sms/send` at the high-signal points (alongside existing `email/send`)
In `src/actions/orders.ts`, at each place that already emits `email/send`, also emit `sms/send` for the matching high-signal events:
- **Order confirmed** (~line 298 area) → `order_confirmation`.
- **Status → shipped** and **status → delivered** (the status-change sends ~lines 324 and 508) → `order_shipped` / `order_delivered`. Only these two statuses get SMS; do not text on every status (in_preparation, dispatched, etc. stay email-only).
- **Condition/damage issue** → `condition_issue` at the point a damaged/condition note is recorded for a client-visible item (find the condition-logging path; if it isn't a clean single point, leave a clearly-commented TODO and email Cowork rather than guessing).

Pass `recipientProfileId` (the client_id) and `to: profile.phone`. The consent/phone gate in `sendSms` is the real guard — emitting the event for a non-consented client is fine because the handler no-ops.

> **Also fix while here (small, related):** `src/actions/orders.ts:~509` passes `template: 'order-status-changed'` (hyphens) to `email/send`, but the `EmailTemplate` union and `TEMPLATE_PREFERENCE_MAP` use `'order_status_changed'` (underscores). This bypasses the preference check. Correct it to underscores. (Also addressed in the Resend wiring prompt — whichever lands first should make the fix; the other can skip it.)

## Acceptance criteria
- `npm run verify` (ESLint + tsc) is clean.
- With Twilio creds **absent**, nothing throws and no SMS is attempted (graceful no-op, logged).
- An SMS is sent **only** when the client has `sms_consent === true` and a valid phone; a consented client with a phone receives order-confirmed, shipped, and delivered texts; a non-consented client receives **none**.
- Each attempt is recorded in `sms_sends` with status + Twilio SID (or error); dev mode writes to `dev_sms_outbox` and sends nothing.
- The `send-sms` function is registered and visible in the Inngest dashboard.
- Email behavior is unchanged (SMS is additive).

## Conventions (from CLAUDE.md)
- Reuse the Inngest + admin-client patterns; `createAdminClient()` for cross-RLS writes.
- New migration follows the numbered convention in `supabase/migrations/`; regenerate types: `npx supabase gen types typescript --linked > src/types/database.ts` (every table needs `Relationships: []`).
- Don't await long work inline in actions — fire via `inngest.send(...)`.
- Server actions return `{ error }` / `{ success }`; throw only for auth violations.

## Report back
Files changed, the migration number added, `npm run verify` result, and founder manual-check steps: with a consented test client + phone, walk an order confirm → ship → deliver and confirm three texts arrive (or appear in `dev_sms_outbox`); confirm a non-consented client gets none.
