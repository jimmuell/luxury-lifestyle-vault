# SMS Opt-In Consent Flow — Design Spec

**Date:** 2026-06-06
**Tracker:** 1.2 (Twilio SMS) prerequisite — A2P 10DLC carrier compliance
**Status:** Approved for implementation

---

## Problem

Carriers require documented express written consent before A2P 10DLC campaign approval. The current onboarding captures phone + a "Text / SMS" preferred-contact choice, but that is not valid express consent. There is no opt-out path in the app, and no inbound STOP handling.

---

## Scope

Five discrete deliverables:

1. **Migration** — add consent columns to `client_profiles`
2. **Onboarding UI** — explicit consent checkbox with A2P disclosure copy
3. **Server action** — `updateSmsConsent` writes consent state
4. **Settings toggle** — `SmsConsentCard` in notifications settings
5. **Twilio inbound webhook** — handles STOP / START / HELP keywords

---

## 1. Schema

**Migration:** `029_sms_consent.sql`

```sql
ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS sms_consent         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source  text;
```

- `sms_consent`: master gate; `false` = no SMS may be sent regardless of `preferred_channel`
- `sms_consent_at`: `now()` when set to true, `null` when revoked
- `sms_consent_source`: `'onboarding'` | `'settings'` | `'inbound_start'` — audit trail for A2P submission

After migration: regenerate `src/types/database.ts` via `npx supabase gen types typescript --linked`. Every table must keep `Relationships: []`.

No new RLS policies needed — existing `client_profiles` RLS scopes reads/writes to the owning client. The Twilio webhook uses `createAdminClient()` to write across RLS (same pattern as Stripe webhook).

---

## 2. Canonical Copy Module

**New file:** `src/lib/sms/consent.ts`

Single source of truth for A2P strings. Import into onboarding UI, settings card, and webhook handler.

```typescript
export const SMS_CONSENT_DISCLOSURE = `By checking this box, I agree to receive order and account text messages from Luxury Lifestyle Vault at the phone number provided. Message frequency varies by account activity. Message and data rates may apply. Reply STOP to opt out or HELP for help. See our Terms of Service and Privacy Policy.`

export const SMS_HELP_REPLY = `Luxury Lifestyle Vault: For help, email concierge@luxurylifestylevault.com. Msg & data rates may apply. Reply STOP to opt out.`
```

The disclosure rendered in the UI links "Terms of Service" to `/terms` and "Privacy Policy" to `/privacy`.

---

## 3. Server Action

**File:** `src/actions/settings.ts` — add `updateSmsConsent`

```typescript
export async function updateSmsConsent(
  enabled: boolean,
  source: 'onboarding' | 'settings'
): Promise<{ success: true } | { error: string }> {
  const { user, supabase } = await requireClient()
  const { error } = await supabase
    .from('client_profiles')
    .update({
      sms_consent: enabled,
      sms_consent_at: enabled ? new Date().toISOString() : null,
      sms_consent_source: enabled ? source : null,
    })
    .eq('profile_id', user.id)
  if (error) return { error: error.message }
  return { success: true }
}
```

Returns `{ error }` on failure, `{ success: true }` on success — consistent with Server Action convention.

---

## 4. Onboarding UI

**File:** `src/components/client/onboarding-flow.tsx`

Changes to Step 0 (Profile):

- Add `smsConsent` boolean state (default `false`)
- Add a Shadcn `Checkbox` component import
- Below the phone field, render:
  - Unchecked-by-default checkbox: "Send me order updates by text message"
  - Directly below (always visible when checkbox is checked, or as fine print): the disclosure paragraph with links to `/terms` and `/privacy`, styled `text-xs text-muted-foreground`
- Phone required when consent checked: Continue button disabled when `smsConsent && !phone`
- `handleStep0` adds `updateSmsConsent(smsConsent, 'onboarding')` to the existing `Promise.all`

Import `updateSmsConsent` from `@/actions/settings`. Import `SMS_CONSENT_DISCLOSURE` from `@/lib/sms/consent`.

The disclosure text is always shown (not only when checked) so the user sees what they're agreeing to before checking. This is the A2P-compliant presentation: disclosure at the point of opt-in.

---

## 5. Settings — SMS Consent Card

**New file:** `src/components/client/sms-consent-card.tsx`

- Client component; receives `initialConsent: boolean`
- Renders a card beneath `<NotificationPrefsForm>` with heading "Text message updates"
- Single toggle row: label + description on left, `Toggle` on right (same `Toggle` component from `notification-prefs-form.tsx`)
- On toggle: calls `updateSmsConsent(next, 'settings')` in `useTransition`, shows `toast.success` / `toast.error`
- When enabled (or on re-enable), shows the disclosure paragraph beneath the toggle row (`text-xs text-muted-foreground`) so re-consent context is clear

**Notifications settings page** (`src/app/(client)/client/settings/notifications/page.tsx`):

- Add `sms_consent` to the existing `.select()` query on `client_profiles`
- Pass `sms_consent` as `initialConsent` prop to `<SmsConsentCard>`
- Render `<SmsConsentCard>` below `<NotificationPrefsForm>`

---

## 6. Twilio Inbound Webhook

**New file:** `src/app/api/webhooks/twilio/route.ts`

**Public route:** Already covered — `proxy.ts` has `/api/webhooks` in `PUBLIC_PREFIXES`. No proxy change needed.

**Request validation:** Twilio sends form-encoded POST. Parse body as `URLSearchParams`. Validate with `twilio.validateRequest(authToken, twilioSig, fullUrl, params)` where `fullUrl = NEXT_PUBLIC_APP_URL + '/api/webhooks/twilio'`. Return `403` on invalid signature.

**Keyword dispatch** (normalize `Body` trim + uppercase):

| Keyword | Action | Response |
|---|---|---|
| STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT | Set `sms_consent = false`, `sms_consent_at = null`, `sms_consent_source = null` | `204` |
| START, UNSTOP | Set `sms_consent = true`, `sms_consent_at = now()`, `sms_consent_source = 'inbound_start'` | `204` |
| HELP | No DB write; respond with `SMS_HELP_REPLY` as TwiML `<Response><Message>` | `200 text/xml` |
| anything else | No-op | `204` |

**Phone lookup:** query `profiles` by `phone = From` using `createAdminClient()`, get `profile_id`, update `client_profiles` where `profile_id = id`. Twilio sends `From` as E.164 (e.g. `+14805551234`); `profiles.phone` stores user-typed strings, so the query must also try stripping/reformatting common variants (digits-only match as fallback). If no matching profile found, still return `204` (number not in system — Twilio handles carrier-level suppression independently).

**Twilio also auto-suppresses** at the carrier level on STOP; our DB write mirrors that state so the send-gate in the SMS dispatch function (Tracker 1.2) can read `sms_consent` directly without calling the Twilio opt-out lookup API.

---

## File Inventory

| File | Change |
|---|---|
| `supabase/migrations/029_sms_consent.sql` | New |
| `src/types/database.ts` | Regenerated |
| `src/lib/sms/consent.ts` | New — canonical copy module |
| `src/actions/settings.ts` | Add `updateSmsConsent` |
| `src/components/client/onboarding-flow.tsx` | Add consent checkbox + `smsConsent` state |
| `src/components/client/sms-consent-card.tsx` | New — settings toggle card |
| `src/app/(client)/client/settings/notifications/page.tsx` | Add `sms_consent` to query + render card |
| `src/app/api/webhooks/twilio/route.ts` | New — inbound webhook handler |

---

## Acceptance Criteria

- `npm run verify` clean
- New client completes onboarding without opting in → `sms_consent = false`
- New client checks the box with valid phone → `sms_consent = true` + `sms_consent_at` set
- Disclosure text with STOP/HELP + Terms/Privacy links renders at point of opt-in
- Settings toggle persists consent changes; disabling sets `sms_consent = false`
- Inbound STOP flips `sms_consent = false` in DB; webhook validates Twilio signature
- `/api/webhooks/twilio` returns 403 on invalid signature, 204/200 on valid

---

## A2P Submission Copy

Paste this into the Twilio A2P campaign opt-in description:

> By checking this box, I agree to receive order and account text messages from Luxury Lifestyle Vault at the phone number provided. Message frequency varies by account activity. Message and data rates may apply. Reply STOP to opt out or HELP for help. See our Terms of Service and Privacy Policy.

Opt-out method: Reply STOP. Help method: Reply HELP (custom TwiML response).
