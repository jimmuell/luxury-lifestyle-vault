# Resend Email Coverage (Tracker 1.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all gaps in Resend email coverage so every lifecycle and billing event fires exactly one branded email, recipient preferences are honored, and `npm run verify` is clean.

**Architecture:** All email sends go through the `email/send` Inngest event → `sendEmailFunction` → `sendEmail()` pipeline — never inline Resend calls. New templates follow the existing pattern: a pure function in `src/lib/resend/emails/` that returns `{ subject, html, text }` using `emailLayout` + helpers. The `EmailTemplate` union and `TEMPLATE_PREFERENCE_MAP` in `send.ts` must stay in sync (every union member needs a map entry). Payment emails originate in the Stripe webhook's invoice handler; welcome and provider-assignment emails originate in their respective actions/Inngest functions.

**Tech Stack:** Next.js 16 App Router, Inngest, Resend, Supabase Admin Client, TypeScript, ESLint + tsc via `npm run verify`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/actions/orders.ts` | Modify line ~513 | Fix hyphen→underscore template name bug |
| `src/lib/resend/send.ts` | Modify | Add `'welcome'` + `'provider_assignment'` to union + map |
| `src/lib/resend/emails/welcome.ts` | **Create** | `welcomeEmail()` template |
| `src/lib/resend/emails/provider-assignment.ts` | **Create** | `providerAssignmentEmail()` template |
| `src/actions/profile.ts` | Modify | Fire welcome email after `completeOnboarding` |
| `src/lib/stripe/webhooks/handle-invoice.ts` | Modify | Emit payment receipt / payment failed emails |
| `src/lib/inngest/functions/seasonal-rotation-reminders.ts` | Modify | Emit seasonal reminder email alongside in-app notification |
| `src/lib/inngest/functions/notify-provider-assignment.ts` | Modify | Emit provider-assignment email alongside in-app notification |

---

## Task 1: Fix the template-name typo in orders.ts

**Files:**
- Modify: `src/actions/orders.ts` (line ~513)

**Background:** `orders.ts:~513` fires an `email/send` Inngest event for the `dispatched_to_provider` status with `template: 'order-status-changed'` (hyphens). The `EmailTemplate` union in `send.ts` defines `'order_status_changed'` (underscores). TypeScript doesn't catch this because the `inngest.send()` call casts with `as never`. The `TEMPLATE_PREFERENCE_MAP` lookup silently fails to find the key, so the unsubscribe-preference check is skipped.

- [ ] **Step 1: Fix the typo**

In `src/actions/orders.ts` around line 513, change:
```typescript
template: 'order-status-changed',
```
to:
```typescript
template: 'order_status_changed',
```

The full surrounding context (so you can locate the right occurrence — there are two `inngest.send` calls for this template; fix only the one with the hyphen around line 509-518):
```typescript
await inngest.send({
  name: 'email/send' as never,
  data: {
    recipientProfileId: clientProfile.id,
    to: clientProfile.email,
    template: 'order_status_changed',   // ← was 'order-status-changed'
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  },
})
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/orders.ts
git commit -m "fix: correct order-status-changed template name to use underscores"
```

---

## Task 2: Add 'welcome' and 'provider_assignment' to the EmailTemplate union + map

**Files:**
- Modify: `src/lib/resend/send.ts`

**Background:** The `EmailTemplate` union and `TEMPLATE_PREFERENCE_MAP` must cover exactly the same keys. We're adding two new templates (`welcome` = transactional onboarding, `provider_assignment` = transactional provider notification). Both map to `null` (always send, cannot unsubscribe). Do this before creating the template files so Tasks 3 and 4 can import from `send.ts` without type errors.

- [ ] **Step 1: Extend the union and map**

Replace the `EmailTemplate` type and `TEMPLATE_PREFERENCE_MAP` in `src/lib/resend/send.ts`:

```typescript
export type EmailTemplate =
  | 'order_confirmation'
  | 'order_status_changed'
  | 'payment_receipt'
  | 'payment_failed'
  | 'seasonal_rotation_reminder'
  | 'welcome'
  | 'provider_assignment'

type EmailPreferenceKey = 'order_updates' | 'delivery_notices' | 'payment' | 'seasonal_reminders'

const TEMPLATE_PREFERENCE_MAP: Record<EmailTemplate, EmailPreferenceKey | null> = {
  order_confirmation: 'order_updates',
  order_status_changed: 'order_updates',
  payment_receipt: null,
  payment_failed: null,
  seasonal_rotation_reminder: 'seasonal_reminders',
  welcome: null,
  provider_assignment: null,
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean (no new errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend/send.ts
git commit -m "feat: add welcome and provider_assignment to EmailTemplate union and map"
```

---

## Task 3: Create the welcome email template

**Files:**
- Create: `src/lib/resend/emails/welcome.ts`

**Background:** New clients need a transactional welcome email immediately after completing onboarding. The template uses `emailLayout` + helpers (`h1`, `para`, `ctaButton`) exactly like the other templates — no Tailwind, inline CSS only.

- [ ] **Step 1: Create the file**

Create `src/lib/resend/emails/welcome.ts`:

```typescript
import { emailLayout, h1, para, ctaButton } from './layout'

export function welcomeEmail(props: {
  clientName: string
  appUrl: string
}): { subject: string; html: string; text: string } {
  const { clientName, appUrl } = props
  const firstName = clientName.split(' ')[0]
  const dashboardUrl = `${appUrl}/client`

  const html = emailLayout(`
    ${h1(`Welcome to Luxury Lifestyle Vault, ${firstName}.`)}
    ${para('Your membership is active. Your concierge is ready to receive your first request.')}
    ${para('From your dashboard you can add items to your vault, schedule a pickup, and track every piece in your wardrobe.')}
    ${ctaButton('Go to my dashboard', dashboardUrl)}
  `)

  const text = `Welcome to Luxury Lifestyle Vault, ${firstName}.\n\nYour membership is active. Visit your dashboard to get started: ${dashboardUrl}`

  return {
    subject: `Welcome to Luxury Lifestyle Vault — your membership is active`,
    html,
    text,
  }
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend/emails/welcome.ts
git commit -m "feat: add welcome email template"
```

---

## Task 4: Fire the welcome email from completeOnboarding

**Files:**
- Modify: `src/actions/profile.ts`

**Background:** `completeOnboarding` in `src/actions/profile.ts` already fires `profile/created` via `inngest.send()`. We add a second `inngest.send()` call for `email/send` immediately after, using the `user.email` and `profile.full_name` already in scope. The email is built inline (not in a helper) to keep the action self-contained.

- [ ] **Step 1: Add the import and the send**

At the top of `src/actions/profile.ts`, add the import:
```typescript
import { welcomeEmail } from '@/lib/resend/emails/welcome'
```

Then, in the `completeOnboarding` function body, add the welcome email dispatch immediately after the existing `inngest.send(...)` for `profile/created`:

```typescript
export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', user.id)
    .select('full_name')
    .single()

  if (error) return { error: error.message }

  // Fire async Stripe customer creation (idempotent — skips if already exists)
  await inngest.send({
    name: 'profile/created' as never,
    data: { profileId: user.id, email: user.email!, fullName: profile?.full_name ?? null },
  })

  // Welcome email — transactional, fires once at onboarding completion
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const clientName = profile?.full_name ?? user.email!
  const emailContent = welcomeEmail({ clientName, appUrl })
  await inngest.send({
    name: 'email/send' as never,
    data: {
      recipientProfileId: user.id,
      to: user.email!,
      template: 'welcome' as const,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    },
  })

  revalidatePath('/client')
  return { success: true }
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/actions/profile.ts
git commit -m "feat: send welcome email on onboarding completion"
```

---

## Task 5: Wire payment emails in the Stripe invoice webhook handler

**Files:**
- Modify: `src/lib/stripe/webhooks/handle-invoice.ts`

**Background:** `handleInvoiceEvent` already resolves `clientId` (which equals `profiles.id`) from the Stripe customer. For `invoice.paid` we emit a `payment_receipt` email; for `invoice.payment_failed` we emit `payment_failed`. Both are transactional (`null` in the map) so they always send. The email is emitted **after** DB writes complete, which keeps retries idempotent — the deduplication in the webhook router at `route.ts` blocks re-entry before `handleInvoiceEvent` is called, so we can't double-send on Stripe retries.

Data available for the templates:
- `clientId` = `profiles.id` → we look up `profiles.email` and `profiles.full_name`
- `invoice.amount_paid` (for receipt) or `invoice.amount_due` (for failure)
- `invoice.description ?? invoice.lines.data[0]?.description ?? 'Membership subscription'`
- `invoice.id` (for receipt reference)

- [ ] **Step 1: Add imports and email dispatch**

Replace the full contents of `src/lib/stripe/webhooks/handle-invoice.ts`:

```typescript
import type Stripe from 'stripe'
import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { paymentReceiptEmail, paymentFailedEmail } from '@/lib/resend/emails/payment-receipt'

export async function handleInvoiceEvent(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const supabase = createAdminClient()

  // Resolve client_id from the Stripe customer on the invoice
  const rawCustomer = invoice.customer as unknown as string | { id: string } | null
  const stripeCustomerId = typeof rawCustomer === 'string' ? rawCustomer : rawCustomer?.id ?? null

  let clientId: string | null = null
  if (stripeCustomerId) {
    const { data: cp } = await supabase
      .from('client_profiles')
      .select('profile_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()
    clientId = cp?.profile_id ?? null
  }

  // Update linked order
  if (invoice.metadata?.order_id) {
    const orderId = invoice.metadata.order_id
    if (event.type === 'invoice.paid') {
      await supabase
        .from('orders')
        .update({ stripe_invoice_id: invoice.id, paid_at: new Date().toISOString() })
        .eq('id', orderId)
    } else if (event.type === 'invoice.payment_failed') {
      await supabase
        .from('orders')
        .update({ stripe_invoice_id: invoice.id })
        .eq('id', orderId)
    }
  }

  // Populate billing_history_cache for paid invoices
  if (event.type === 'invoice.paid' && clientId && invoice.amount_paid > 0) {
    const invoiceAny = invoice as unknown as { subscription?: string | { id: string } | null }
    const rawSub = invoiceAny.subscription
    const subscriptionId = typeof rawSub === 'string' ? rawSub : rawSub?.id ?? null

    await supabase
      .from('billing_history_cache')
      .upsert({
        client_id: clientId,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        order_id: invoice.metadata?.order_id ?? null,
        amount_cents: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        description: invoice.description ?? (invoice.lines.data[0]?.description ?? null),
        pdf_url: invoice.invoice_pdf ?? null,
        hosted_url: invoice.hosted_invoice_url ?? null,
        invoice_date: new Date(invoice.created * 1000).toISOString(),
        period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
        period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      }, { onConflict: 'stripe_invoice_id' })
  }

  // Send payment emails if we can resolve a client
  if (!clientId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', clientId)
    .single()

  if (!profile?.email) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const clientName = profile.full_name ?? profile.email
  const description = invoice.description ?? invoice.lines.data[0]?.description ?? 'Membership subscription'

  if (event.type === 'invoice.paid' && invoice.amount_paid > 0) {
    const emailContent = paymentReceiptEmail({
      clientName,
      amountCents: invoice.amount_paid,
      description,
      invoiceId: invoice.id,
      appUrl,
    })
    await inngest.send({
      name: 'email/send' as never,
      data: {
        recipientProfileId: clientId,
        to: profile.email,
        template: 'payment_receipt' as const,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
    })
  } else if (event.type === 'invoice.payment_failed') {
    const amountCents = (invoice as unknown as { amount_due?: number }).amount_due ?? 0
    const emailContent = paymentFailedEmail({
      clientName,
      amountCents,
      description,
      appUrl,
    })
    await inngest.send({
      name: 'email/send' as never,
      data: {
        recipientProfileId: clientId,
        to: profile.email,
        template: 'payment_failed' as const,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
    })
  }
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stripe/webhooks/handle-invoice.ts
git commit -m "feat: send payment receipt and payment failed emails from Stripe invoice webhook"
```

---

## Task 6: Send the seasonal rotation reminder email

**Files:**
- Modify: `src/lib/inngest/functions/seasonal-rotation-reminders.ts`

**Background:** The seasonal reminder function already creates an in-app notification for each eligible client. We add an email dispatch immediately before the idempotency write so that if the `reminder_sends` insert succeeds, we know we sent the email exactly once. We look up `profiles.email` and `profiles.full_name` for each `clientId` (the function already has `clientId` in the inner loop). The `unsubscribeToken` field on the template is optional — we omit it here because the preference check in `sendEmail()` handles opt-outs.

- [ ] **Step 1: Add import and email dispatch**

Replace the full contents of `src/lib/inngest/functions/seasonal-rotation-reminders.ts`:

```typescript
import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { seasonalRotationReminderEmail } from '@/lib/resend/emails/seasonal-rotation-reminder'
import { isWithinInterval, addDays, parseISO } from 'date-fns'

export const seasonalRotationReminders = inngest.createFunction(
  {
    id: 'seasonal-rotation-reminders',
    triggers: [{ cron: '0 9 * * *' }] as never,
    retries: 1,
  },
  async () => {
    const db = createAdminClient()
    const now = new Date()
    const year = now.getFullYear()

    // Load settings
    const { data: settings } = await db
      .from('admin_settings')
      .select('key, value')
      .in('key', ['seasonal_reminder_days_before', 'seasonal_reminder_enabled'])

    const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
    if (settingsMap['seasonal_reminder_enabled'] === false) return { skipped: true }

    const daysBefore = Number(settingsMap['seasonal_reminder_days_before'] ?? 14)

    // Load active corridors with transition dates
    const { data: corridors } = await db
      .from('corridors')
      .select('id, display_name, fall_transition_start_date, spring_transition_start_date')
      .eq('active', true)

    if (!corridors?.length) return { noCorridors: true }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    let totalSent = 0

    for (const corridor of corridors) {
      for (const [reminderType, dateStr] of [
        ['fall_transition', corridor.fall_transition_start_date],
        ['spring_transition', corridor.spring_transition_start_date],
      ] as const) {
        if (!dateStr) continue

        const transitionDate = parseISO(dateStr)
        const reminderWindowStart = addDays(transitionDate, -daysBefore)
        const reminderWindowEnd = addDays(transitionDate, -1)

        if (!isWithinInterval(now, { start: reminderWindowStart, end: reminderWindowEnd })) continue

        // Find active clients (those with active subscriptions)
        const { data: activeSubs } = await db
          .from('client_subscriptions')
          .select('client_id')
          .eq('status', 'active')

        const clientIds = activeSubs?.map(s => s.client_id) ?? []
        if (!clientIds.length) continue

        for (const clientId of clientIds) {
          // Check if already sent this year for this corridor + type
          const { data: existing } = await db
            .from('reminder_sends')
            .select('id')
            .eq('client_id', clientId)
            .eq('corridor_id', corridor.id)
            .eq('reminder_type', reminderType)
            .eq('reminder_year', year)
            .maybeSingle()

          if (existing) continue

          // Get item count for personalization
          const { count: itemCount } = await db
            .from('items')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId)

          // Resolve client profile for email
          const { data: profile } = await db
            .from('profiles')
            .select('email, full_name')
            .eq('id', clientId)
            .single()

          const seasonLabel = reminderType === 'fall_transition' ? 'fall' : 'spring'
          const title = `Your ${seasonLabel} rotation window is opening`
          const snippet = `The ${corridor.display_name} corridor opens in ~${daysBefore} days.${itemCount ? ` You have ${itemCount} item${itemCount !== 1 ? 's' : ''} in the vault.` : ''}`

          // Create in-app notification
          await createNotification({
            recipientProfileId: clientId,
            type: 'system',
            title,
            snippet,
            linkTarget: '/client/rotations/new',
            metadata: {
              corridorId: corridor.id,
              reminderType,
              transitionDate: dateStr,
            } as unknown as import('@/types/database').Json,
          })

          // Send email (preference-gated via sendEmail → seasonal_reminders pref key)
          if (profile?.email) {
            const emailContent = seasonalRotationReminderEmail({
              clientName: profile.full_name ?? profile.email,
              daysUntilTransition: daysBefore,
              season: seasonLabel,
              itemCount: itemCount ?? 0,
              corridorLabel: corridor.display_name,
              appUrl,
            })
            await inngest.send({
              name: 'email/send' as never,
              data: {
                recipientProfileId: clientId,
                to: profile.email,
                template: 'seasonal_rotation_reminder' as const,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              },
            })
          }

          // Record send for idempotency (covers both in-app + email)
          await db.from('reminder_sends').insert({
            client_id: clientId,
            corridor_id: corridor.id,
            reminder_type: reminderType,
            reminder_year: year,
          })

          totalSent++
        }
      }
    }

    return { totalSent }
  }
)
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/inngest/functions/seasonal-rotation-reminders.ts
git commit -m "feat: send seasonal rotation reminder email alongside in-app notification"
```

---

## Task 7: Create the provider-assignment email template

**Files:**
- Create: `src/lib/resend/emails/provider-assignment.ts`

**Background:** Providers need a branded email when a new order is assigned to them. The recipient is the provider (not a client), so `recipientProfileId` is the provider's `profile_id`.

- [ ] **Step 1: Create the file**

Create `src/lib/resend/emails/provider-assignment.ts`:

```typescript
import { emailLayout, h1, para, ctaButton, divider, label, value } from './layout'

export function providerAssignmentEmail(props: {
  providerName: string
  orderId: string
  appUrl: string
}): { subject: string; html: string; text: string } {
  const { providerName, orderId, appUrl } = props
  const firstName = providerName.split(' ')[0]
  const orderUrl = `${appUrl}/provider/orders/${orderId}`

  const html = emailLayout(`
    ${h1(`New assignment, ${firstName}.`)}
    ${para('A new order has been assigned to your account. Please review the details and respond at your earliest convenience.')}
    ${divider()}
    ${label('Order reference')}
    ${value(orderId.substring(0, 8).toUpperCase())}
    ${divider()}
    ${ctaButton('Review and respond', orderUrl)}
  `)

  const text = `New assignment, ${firstName}.\n\nA new order has been assigned to your account.\nOrder: ${orderId}\n\nReview: ${orderUrl}`

  return {
    subject: `New assignment — LLV`,
    html,
    text,
  }
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend/emails/provider-assignment.ts
git commit -m "feat: add provider-assignment email template"
```

---

## Task 8: Wire the provider-assignment email in the Inngest function

**Files:**
- Modify: `src/lib/inngest/functions/notify-provider-assignment.ts`

**Background:** The `notifyProviderAssignment` function already has `provider.profile_id` and `provider.business_name`. We add a profile lookup for the provider's email, then emit `email/send`. The email is transactional (`provider_assignment: null` in the map) so it always sends regardless of notification preferences.

- [ ] **Step 1: Add import and email dispatch**

Replace the full contents of `src/lib/inngest/functions/notify-provider-assignment.ts`:

```typescript
import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { providerAssignmentEmail } from '@/lib/resend/emails/provider-assignment'

export const notifyProviderAssignment = inngest.createFunction(
  {
    id: 'notify-provider-assignment',
    triggers: [{ event: 'provider/assigned' as never }],
    retries: 3,
  },
  async ({ event }: { event: { data: { assignmentId: string; orderId: string; providerId: string } } }) => {
    const { assignmentId, orderId, providerId } = event.data

    const adminClient = createAdminClient()

    // Get provider profile_id for in-app notification
    const { data: provider } = await adminClient
      .from('providers')
      .select('profile_id, business_name')
      .eq('id', providerId)
      .single()

    if (!provider?.profile_id) return { skipped: 'no provider profile' }

    await createNotification({
      recipientProfileId: provider.profile_id,
      type: 'system',
      title: 'New assignment waiting for your response',
      snippet: 'A new order has been assigned to you. Please review and accept or decline.',
      linkTarget: `/provider/orders/${orderId}`,
      metadata: { orderId, assignmentId } as Record<string, string>,
    })

    // Send email to the provider
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', provider.profile_id)
      .single()

    if (profile?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const providerName = profile.full_name ?? provider.business_name ?? profile.email
      const emailContent = providerAssignmentEmail({ providerName, orderId, appUrl })
      await inngest.send({
        name: 'email/send' as never,
        data: {
          recipientProfileId: provider.profile_id,
          to: profile.email,
          template: 'provider_assignment' as const,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        },
      })
    }

    return { notified: provider.profile_id }
  }
)
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/inngest/functions/notify-provider-assignment.ts
git commit -m "feat: send provider-assignment email alongside in-app notification"
```

---

## Task 9: Final audit — one email per event, no leaks

**Files:**
- Read-only grep pass; no code changes unless a gap is found.

**Background:** Verify every lifecycle/billing event has exactly one `email/send` emission and that all `appUrl` values use `NEXT_PUBLIC_APP_URL`.

- [ ] **Step 1: Grep all email/send emissions**

```bash
grep -rn "email/send\|inngest.send" \
  src/actions/orders.ts \
  src/actions/profile.ts \
  src/lib/stripe/webhooks/ \
  src/lib/inngest/functions/ \
  | grep -v "node_modules"
```

Expected output should show exactly these sends:
| File | Template |
|---|---|
| `src/actions/orders.ts` | `order_confirmation` (on confirmed) |
| `src/actions/orders.ts` | `order_status_changed` (on status change, line ~328) |
| `src/actions/orders.ts` | `order_status_changed` (dispatched_to_provider, line ~513) |
| `src/actions/profile.ts` | `welcome` |
| `src/lib/stripe/webhooks/handle-invoice.ts` | `payment_receipt` (invoice.paid) |
| `src/lib/stripe/webhooks/handle-invoice.ts` | `payment_failed` (invoice.payment_failed) |
| `src/lib/inngest/functions/seasonal-rotation-reminders.ts` | `seasonal_rotation_reminder` |
| `src/lib/inngest/functions/notify-provider-assignment.ts` | `provider_assignment` |

- [ ] **Step 2: Confirm all appUrl references use NEXT_PUBLIC_APP_URL**

```bash
grep -rn "NEXT_PUBLIC_SITE_URL\|NEXT_PUBLIC_APP_URL" src/lib/resend/ src/actions/ src/lib/stripe/ src/lib/inngest/
```

Expected: only `NEXT_PUBLIC_APP_URL` appears. If `NEXT_PUBLIC_SITE_URL` appears anywhere, replace it with `NEXT_PUBLIC_APP_URL`.

- [ ] **Step 3: Final verify**

```bash
npm run verify
```
Expected: clean — no ESLint errors, no TypeScript errors.

- [ ] **Step 4: Confirm union + map parity**

The `EmailTemplate` union now has 7 members: `order_confirmation`, `order_status_changed`, `payment_receipt`, `payment_failed`, `seasonal_rotation_reminder`, `welcome`, `provider_assignment`. The `TEMPLATE_PREFERENCE_MAP` must have exactly 7 entries. TypeScript enforces this (the `Record<EmailTemplate, ...>` type will error if any member is missing).

---

## Lifecycle → Template Reference Table

| Event | Template | Preference key |
|---|---|---|
| Order confirmed (`confirmed` status) | `order_confirmation` | `order_updates` |
| Order status changed (6 statuses) | `order_status_changed` | `order_updates` |
| Order dispatched to provider | `order_status_changed` | `order_updates` |
| `invoice.paid` | `payment_receipt` | _(transactional)_ |
| `invoice.payment_failed` | `payment_failed` | _(transactional)_ |
| Onboarding complete | `welcome` | _(transactional)_ |
| Seasonal rotation window | `seasonal_rotation_reminder` | `seasonal_reminders` |
| Provider assigned to order | `provider_assignment` | _(transactional)_ |
