# Code Prompt — Complete Resend email coverage (Tracker 1.3)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Tracker:** 1.3 Verify Resend email completeness · Phase 1 — Engineering · Priority Medium

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder will exercise the running app. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Context — what's already wired vs. missing

The email infrastructure is solid and **partially** wired. Audit confirmed:

**Already firing** (via `email/send` Inngest event → `src/lib/inngest/functions/send-email.ts` → `sendEmail()` in `src/lib/resend/send.ts`):
- `order_confirmation` — on order create (`src/actions/orders.ts` ~line 298).
- `order_status_changed` — on status change (`src/actions/orders.ts` ~lines 324 and 508).

**Templates that exist but are NEVER sent** (functions defined in `src/lib/resend/emails/`, imported nowhere that fires):
- `paymentReceiptEmail` / `paymentFailedEmail` (`payment-receipt.ts`) — the **Stripe webhook handler** (`src/app/api/webhooks/stripe/route.ts`) currently emits **no** email events at all.
- `seasonalRotationReminderEmail` (`seasonal-rotation-reminder.ts`) — the seasonal reminder Inngest function creates an in-app notification but does not send the email.

**No template / not sent at all:**
- **Welcome email** on onboarding completion.
- **Provider assignment** email — `notify-provider-assignment.ts` only creates an in-app notification.

**Bug to fix:** `src/actions/orders.ts:~509` passes `template: 'order-status-changed'` (hyphens). The `EmailTemplate` union and `TEMPLATE_PREFERENCE_MAP` in `src/lib/resend/send.ts` use `'order_status_changed'` (underscores), so this value silently bypasses the unsubscribe-preference check. Change it to underscores.

## Goal

Every lifecycle/billing event fires the correct branded email exactly once, recipient preferences/unsubscribe are honored, and no template variables leak. Close the gaps above.

## Scope

**1. Fix the template-name bug** at `orders.ts:~509` → `'order_status_changed'`.

**2. Wire payment emails in the Stripe webhook** (`src/app/api/webhooks/stripe/route.ts`):
- On successful payment (e.g. `invoice.paid` / `payment_intent.succeeded` / the charge events the app relies on for membership activation and per-request billing): build `paymentReceiptEmail({...})` and emit `email/send` with `template: 'payment_receipt'`.
- On failed payment (e.g. `invoice.payment_failed` / `payment_intent.payment_failed`): build `paymentFailedEmail({...})` and emit `email/send` with `template: 'payment_failed'`.
- Resolve recipient email + `recipientProfileId` from the Stripe customer → `client_profiles.stripe_customer_id` → `profile_id` → `profiles.email`. These two templates are transactional (`null` in `TEMPLATE_PREFERENCE_MAP`) so they always send.
- Keep it idempotent: the handler already dedupes by event ID via `stripe_webhook_events` — emit the email **after** the dedupe check so retries don't double-send.

**3. Send the seasonal reminder email** from the seasonal reminder Inngest function (`src/lib/inngest/functions/seasonal-rotation-reminders.ts`): in addition to the in-app notification, build `seasonalRotationReminderEmail({...})` and emit `email/send` with `template: 'seasonal_rotation_reminder'` (preference key `seasonal_reminders`, so it respects opt-out).

**4. Add a Welcome email:**
- New template `src/lib/resend/emails/welcome.ts` → `welcomeEmail({ clientName, appUrl, unsubscribeToken? })` using the shared `emailLayout` + helpers (`h1`, `para`, `ctaButton`) for visual consistency.
- Add `'welcome'` to the `EmailTemplate` union and to `TEMPLATE_PREFERENCE_MAP` as `null` (transactional onboarding confirmation).
- Fire it when onboarding completes — `src/actions/profile.ts` (`completeOnboarding`, where `profile/created` is already emitted), or co-locate with that event.

**5. Add a Provider-assignment email:**
- New template `src/lib/resend/emails/provider-assignment.ts` → `providerAssignmentEmail({ providerName, orderId, appUrl })`.
- In `src/lib/inngest/functions/notify-provider-assignment.ts`, after the in-app notification, look up the provider's email (`providers.profile_id` → `profiles.email`) and emit `email/send` with a new template key `'provider_assignment'` (add to the union + map as `null`).
- (This is the same event the SMS prompt may also hook; email and SMS are independent and both fine.)

**6. Audit pass — confirm one email per event, no leaks:** grep for every `email/send` emission and every order/payment status transition; ensure each lifecycle/billing event has exactly one corresponding send and that all `appUrl` values use `process.env.NEXT_PUBLIC_APP_URL` (not the unused `NEXT_PUBLIC_SITE_URL`).

## Acceptance criteria
- `npm run verify` (ESLint + tsc) is clean; new templates typecheck and `EmailTemplate` union + `TEMPLATE_PREFERENCE_MAP` stay in sync (map must cover every union member).
- Payment success and payment failure each send their branded email once (verifiable in the `email_sends` table / dev inbox), driven by the Stripe webhook and idempotent on retry.
- Seasonal reminder, welcome, and provider-assignment emails send at their events.
- Unsubscribe/preference logic still honored for non-transactional templates; transactional ones always send.
- No raw `${...}` template variables in any rendered output.

## Conventions (from CLAUDE.md)
- Reuse `src/lib/resend/` (`getResend`, `FROM_EMAIL`, `FROM_NAME`, `emailLayout`); never create a second Resend client.
- Trigger sends via `inngest.send({ name: 'email/send', data: {...} })` — never call Resend inline in a request path.
- `createAdminClient()` for webhook/background lookups that bypass RLS.

## Report back
Files changed, the `npm run verify` result, and a table of every lifecycle/billing event → which template now fires. Founder manual-check ties into the QA-gate doc (`docs/testing/llv_dashboard_qa_verification_checklist.md`, section 2): walking an order through its lifecycle + a membership activation should now produce confirmed/shipped/delivered/payment emails in Resend.
