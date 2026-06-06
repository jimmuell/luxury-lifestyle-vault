# SMS Opt-In Consent Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add A2P 10DLC-compliant SMS opt-in consent to onboarding and settings, plus an inbound Twilio webhook for STOP/START/HELP handling.

**Architecture:** A single `updateSmsConsent(enabled, source)` server action writes three new columns on `client_profiles` (`sms_consent`, `sms_consent_at`, `sms_consent_source`). The onboarding Profile step gains an unchecked-by-default checkbox with the required A2P disclosure; client settings gains a standalone SMS card below the existing notification grid. A new Twilio inbound webhook at `/api/webhooks/twilio` mirrors carrier-level opt-out into the DB.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), Twilio SDK `^6.0.2`, TypeScript, Tailwind CSS v4, Shadcn/Base UI

---

## File Map

| File | Action |
|---|---|
| `supabase/migrations/029_sms_consent.sql` | Create — migration adds 3 columns to `client_profiles` |
| `src/types/database.ts` | Modify — add 3 new columns to `client_profiles` Row/Insert/Update |
| `src/lib/sms/consent.ts` | Create — canonical A2P copy strings |
| `src/actions/settings.ts` | Modify — add `updateSmsConsent` action |
| `src/components/client/onboarding-flow.tsx` | Modify — add consent checkbox + disclosure to Step 0 |
| `src/components/client/sms-consent-card.tsx` | Create — settings toggle card |
| `src/app/(client)/client/settings/notifications/page.tsx` | Modify — add `sms_consent` to query + render card |
| `src/app/api/webhooks/twilio/route.ts` | Create — inbound STOP/START/HELP webhook |

---

### Task 1: Migration and DB Types

**Files:**
- Create: `supabase/migrations/029_sms_consent.sql`
- Modify: `src/types/database.ts` (lines 369–435 — `client_profiles` Row/Insert/Update)

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/029_sms_consent.sql` with exactly this content:

```sql
-- A2P 10DLC: explicit SMS consent columns on client_profiles

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS sms_consent         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS sms_consent_source  text;
```

- [ ] **Step 2: Push the migration**

```bash
npx supabase db push
```

Expected: migration applies cleanly with no errors. If it says "already applied", the column was added another way — verify with `npx supabase db diff`.

- [ ] **Step 3: Regenerate TypeScript types**

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

Expected: `src/types/database.ts` is overwritten. If the command fails (no linked project or auth issue), manually add the three columns in the next step instead of running this command.

- [ ] **Step 4: Verify / manually add columns to database.ts**

Open `src/types/database.ts`. Find the `client_profiles` section (around line 368). Confirm — or manually add — these entries so that `Row`, `Insert`, and `Update` all include the three new columns. The `Relationships` array must remain intact (not be deleted by the gen command).

**Row** block — add after `email_notifications_admin_override`:
```typescript
sms_consent: boolean
sms_consent_at: string | null
sms_consent_source: string | null
```

**Insert** block — add after `email_notifications_admin_override`:
```typescript
sms_consent?: boolean
sms_consent_at?: string | null
sms_consent_source?: string | null
```

**Update** block — add after `email_notifications_admin_override`:
```typescript
sms_consent?: boolean
sms_consent_at?: string | null
sms_consent_source?: string | null
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run verify
```

Expected: `0 errors`. If there are errors about `client_profiles` missing properties, the manual edits in Step 4 are incomplete.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/029_sms_consent.sql src/types/database.ts
git commit -m "feat(schema): add sms_consent columns to client_profiles"
```

---

### Task 2: Canonical Copy Module

**Files:**
- Create: `src/lib/sms/consent.ts`

- [ ] **Step 1: Create the module**

Create `src/lib/sms/consent.ts`:

```typescript
export const SMS_CONSENT_DISCLOSURE =
  'By checking this box, I agree to receive order and account text messages from Luxury Lifestyle Vault at the phone number provided. Message frequency varies by account activity. Message and data rates may apply. Reply STOP to opt out or HELP for help. See our Terms of Service and Privacy Policy.'

export const SMS_HELP_REPLY =
  'Luxury Lifestyle Vault: For help, email concierge@luxurylifestylevault.com. Msg & data rates may apply. Reply STOP to opt out.'
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sms/consent.ts
git commit -m "feat(sms): add canonical A2P copy module"
```

---

### Task 3: updateSmsConsent Server Action

**Files:**
- Modify: `src/actions/settings.ts`

- [ ] **Step 1: Add the action**

Open `src/actions/settings.ts`. After the closing brace of `updatePreferredChannel`, add:

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

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/actions/settings.ts
git commit -m "feat(sms): add updateSmsConsent server action"
```

---

### Task 4: Onboarding UI — Consent Checkbox

**Files:**
- Modify: `src/components/client/onboarding-flow.tsx`

- [ ] **Step 1: Add imports**

In `src/components/client/onboarding-flow.tsx`, update the import block at the top:

```typescript
import { updateProfile, completeOnboarding, updatePreferredContact } from '@/actions/profile'
import { updateSmsConsent } from '@/actions/settings'
```

(Keep all existing imports; add `updateSmsConsent` import shown above.)

- [ ] **Step 2: Add smsConsent state**

In the "Step 0 state" block (around line 153), add one line after the `contactMethod` state:

```typescript
const [smsConsent, setSmsConsent] = useState(false)
```

- [ ] **Step 3: Update handleStep0 to include consent**

Replace the entire `handleStep0` function (lines 189–202) with:

```typescript
async function handleStep0() {
  const formData = new FormData()
  formData.set('full_name', fullName)
  formData.set('phone', phone)
  startTransition(async () => {
    const [profileResult, contactResult, consentResult] = await Promise.all([
      updateProfile(formData),
      updatePreferredContact(contactMethod),
      updateSmsConsent(smsConsent, 'onboarding'),
    ])
    if ('error' in profileResult) { toast.error(profileResult.error); return }
    if ('error' in contactResult) { toast.error(contactResult.error); return }
    if ('error' in consentResult) { toast.error(consentResult.error); return }
    setStep(1)
  })
}
```

- [ ] **Step 4: Add consent UI to Step 0**

In the Step 0 JSX, find the space-y-4 div containing the phone field (around line 307). After the closing `</div>` of the phone field block and before the preferred-contact div, add the consent section:

```tsx
<div className="space-y-3 pt-1">
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={smsConsent}
      onChange={e => setSmsConsent(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded border border-border accent-foreground cursor-pointer flex-shrink-0"
    />
    <span className="text-sm">Send me order updates by text message</span>
  </label>
  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
    By checking this box, I agree to receive order and account text messages from Luxury Lifestyle
    Vault at the phone number provided. Message frequency varies by account activity. Message and data
    rates may apply. Reply STOP to opt out or HELP for help. See our{' '}
    <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
    {' '}and{' '}
    <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
  </p>
</div>
```

- [ ] **Step 5: Update Continue button disabled condition**

Find the Continue button at the bottom of Step 0 (line ~334):

```tsx
<Button className="w-full" onClick={handleStep0} disabled={!fullName || pending}>
```

Replace with:

```tsx
<Button className="w-full" onClick={handleStep0} disabled={!fullName || (smsConsent && !phone) || pending}>
```

- [ ] **Step 6: Verify**

```bash
npm run verify
```

Expected: `0 errors`. If you see an error about `React.ReactNode`, ensure React is in scope — Next.js App Router with `'use client'` has React in scope automatically.

- [ ] **Step 7: Commit**

```bash
git add src/components/client/onboarding-flow.tsx
git commit -m "feat(onboarding): add SMS opt-in consent checkbox with A2P disclosure"
```

---

### Task 5: SmsConsentCard Settings Component

**Files:**
- Create: `src/components/client/sms-consent-card.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/client/sms-consent-card.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateSmsConsent } from '@/actions/settings'
import { SMS_CONSENT_DISCLOSURE } from '@/lib/sms/consent'

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none disabled:opacity-50 ${checked ? 'bg-foreground' : 'bg-border'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-1'}`}
      />
    </button>
  )
}

interface SmsConsentCardProps {
  initialConsent: boolean
}

export function SmsConsentCard({ initialConsent }: SmsConsentCardProps) {
  const [enabled, setEnabled] = useState(initialConsent)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await updateSmsConsent(next, 'settings')
      if ('error' in result) {
        setEnabled(!next)
        toast.error('Could not save SMS preference')
      } else {
        toast.success(next ? 'SMS updates enabled' : 'SMS updates disabled')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden mt-4">
      <div className="px-5 py-3 bg-muted/40 border-b border-border">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Text messages</span>
      </div>
      <div className="bg-card px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium">Text message updates</p>
            <p className="text-xs text-muted-foreground mt-0.5">Order and account updates sent by SMS</p>
          </div>
          <div className="flex-shrink-0">
            <Toggle checked={enabled} onChange={handleToggle} disabled={isPending} />
          </div>
        </div>
        {enabled && (
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
            {SMS_CONSENT_DISCLOSURE} Reply STOP at any time to opt out.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/components/client/sms-consent-card.tsx
git commit -m "feat(settings): add SmsConsentCard component for SMS opt-in toggle"
```

---

### Task 6: Notifications Settings Page Update

**Files:**
- Modify: `src/app/(client)/client/settings/notifications/page.tsx`

- [ ] **Step 1: Update the page**

Replace the entire content of `src/app/(client)/client/settings/notifications/page.tsx` with:

```tsx
import { createClient } from '@/lib/supabase/server'
import { NotificationPrefsForm } from '@/components/client/notification-prefs-form'
import { SmsConsentCard } from '@/components/client/sms-consent-card'

export default async function NotificationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cp } = await supabase
    .from('client_profiles')
    .select('email_notifications, in_app_notification_prefs, sms_consent')
    .eq('profile_id', user!.id)
    .single()

  const defaultPrefs = { order_updates: true, delivery_notices: true, payment: true, seasonal_reminders: true }
  const defaultInApp = { order_updates: true, delivery_notices: true, payment: true, seasonal_reminders: false }

  const emailPrefs = (cp?.email_notifications as Record<string, boolean>) ?? defaultPrefs
  const inAppPrefs = (cp?.in_app_notification_prefs as Record<string, boolean>) ?? defaultInApp

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose how you receive updates about your wardrobe and orders.
      </p>
      <NotificationPrefsForm emailPrefs={emailPrefs} inAppPrefs={inAppPrefs} />
      <SmsConsentCard initialConsent={cp?.sms_consent ?? false} />
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/app/(client)/client/settings/notifications/page.tsx
git commit -m "feat(settings): add SMS consent card to notifications settings page"
```

---

### Task 7: Twilio Inbound Webhook

**Files:**
- Create: `src/app/api/webhooks/twilio/route.ts`

**Note:** `/api/webhooks` is already in `proxy.ts`'s `PUBLIC_PREFIXES` array — no proxy change needed.

- [ ] **Step 1: Create the webhook handler**

Create `src/app/api/webhooks/twilio/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'
import { SMS_HELP_REPLY } from '@/lib/sms/consent'

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const START_KEYWORDS = new Set(['START', 'UNSTOP'])

async function findProfileByPhone(phone: string): Promise<string | null> {
  const adminSupabase = createAdminClient()

  // Try exact match first (E.164 as stored)
  const { data: exact } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (exact) return exact.id

  // Try normalised E.164: strip non-digits, take last 10, prefix +1
  const digits = phone.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  if (last10.length < 10) return null

  const e164 = `+1${last10}`
  if (e164 === phone) return null // already tried this

  const { data: normalised } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('phone', e164)
    .maybeSingle()

  return normalised?.id ?? null
}

async function setConsent(profileId: string, enabled: boolean) {
  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('client_profiles')
    .update({
      sms_consent: enabled,
      sms_consent_at: enabled ? new Date().toISOString() : null,
      sms_consent_source: enabled ? 'inbound_start' : null,
    })
    .eq('profile_id', profileId)
}

export async function POST(req: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    return new NextResponse(null, { status: 500 })
  }

  // Twilio sends form-encoded bodies
  const rawBody = await req.text()
  const params = Object.fromEntries(new URLSearchParams(rawBody))

  // Validate Twilio signature
  const sig = req.headers.get('x-twilio-signature') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const webhookUrl = new URL('/api/webhooks/twilio', appUrl).toString()

  const isValid = twilio.validateRequest(authToken, sig, webhookUrl, params)
  if (!isValid) {
    return new NextResponse(null, { status: 403 })
  }

  const from: string = params['From'] ?? ''
  const body: string = (params['Body'] ?? '').trim().toUpperCase()

  if (STOP_KEYWORDS.has(body)) {
    const profileId = await findProfileByPhone(from)
    if (profileId) await setConsent(profileId, false)
    return new NextResponse(null, { status: 204 })
  }

  if (START_KEYWORDS.has(body)) {
    const profileId = await findProfileByPhone(from)
    if (profileId) await setConsent(profileId, true)
    return new NextResponse(null, { status: 204 })
  }

  if (body === 'HELP') {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${SMS_HELP_REPLY}</Message></Response>`
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: `0 errors`. If TypeScript complains about the `twilio` default import, change to:

```typescript
import { validateRequest } from 'twilio'
// and later:
const isValid = validateRequest(authToken, sig, webhookUrl, params)
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/twilio/route.ts
git commit -m "feat(sms): add Twilio inbound webhook for STOP/START/HELP handling"
```

---

## Founder Verification Steps

After all tasks complete and `npm run verify` is clean:

1. **Onboarding without consent:** Complete onboarding with the SMS box unchecked → confirm `sms_consent = false` in `client_profiles`
2. **Onboarding with consent:** Complete onboarding with box checked + valid phone → confirm `sms_consent = true`, `sms_consent_at` is set, `sms_consent_source = 'onboarding'`
3. **Settings toggle:** Open `/client/settings/notifications`, toggle SMS on → confirm `sms_consent = true, sms_consent_source = 'settings'`; toggle off → `sms_consent = false`
4. **STOP webhook:** With Twilio webhook pointed at your app URL (ngrok in dev or production domain), text STOP from a consented number → confirm `sms_consent` flips to false in DB

## A2P Campaign Submission Copy

Paste into the Twilio A2P "Opt-in description" field:

> By checking this box, I agree to receive order and account text messages from Luxury Lifestyle Vault at the phone number provided. Message frequency varies by account activity. Message and data rates may apply. Reply STOP to opt out or HELP for help. See our Terms of Service and Privacy Policy.
