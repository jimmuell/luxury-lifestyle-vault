# Claude Code Prompt — Fix createSubscription so the first invoice actually charges
**Date:** May 30, 2026
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**For:** Claude Code in VS Code, working in `~/Documents/Claude/Projects/luxury-lifestyle-vault`
**Priority:** Real bug — every new client signup leaves their subscription in `incomplete` state. Launch-blocker.

---

## Context

After today's earlier fixes (Bugs #11-#20), end-to-end onboarding now completes:
- Signup → all 6 onboarding steps → payment with `4242 4242 4242 4242` → "Confirm & start membership" → lands at `/client`
- Profile, client_profile, addresses, subscription row all created correctly
- Stripe webhooks are now working locally (via `stripe listen` forwarding to `localhost:3000/api/webhooks/stripe` with the real `STRIPE_WEBHOOK_SECRET`)

BUT — `client_subscriptions.status` stays at `incomplete` forever. In Stripe Dashboard → Transactions, the corresponding $299 charge shows status `Incomplete`. No money has actually moved.

The webhook event trace during a fresh signup (`webhooktest@example.com`) confirmed the chain breaks at a specific point:

**Events that fired ✓:**
- `customer.created`
- `setup_intent.created` (x2)
- `payment_method.attached`
- `setup_intent.succeeded`
- `customer.updated` (x2 — second one is the app setting `invoice_settings.default_payment_method`)
- `payment_intent.created`
- `invoice.created`
- `invoice.finalized`
- `customer.subscription.created`

**Events that NEVER fired ✗:**
- `invoice.payment_succeeded` / `invoice.paid`
- `customer.subscription.updated` (transition to active)
- `charge.succeeded`
- `payment_intent.succeeded`

All received events returned `200` from the webhook handler. So webhook infrastructure is fine.

## Root cause

`src/actions/stripe.ts` `createSubscription` (~line 112) creates the subscription with:

```typescript
const subscription = await stripe.subscriptions.create({
  customer: stripe_customer_id,
  items: [{ price: stripe_price_id_current }],
  ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
  metadata: { profile_id: user.id, tier_id: tierId },
  payment_behavior: 'default_incomplete',
})
```

The `payment_behavior: 'default_incomplete'` mode is **designed for SCA (Strong Customer Authentication) flows** where the client must call `stripe.confirmCardPayment()` browser-side to confirm the PaymentIntent. With this mode:

1. Subscription created → status `incomplete`
2. Invoice created + finalized
3. PaymentIntent created with status `requires_action` or `requires_confirmation`
4. **App is expected to return the PaymentIntent's `client_secret` to the browser, where Stripe.js confirms it**
5. After confirmation → invoice paid → subscription transitions to `active`

Our app never does step 4 — `activateAndComplete` calls `createSubscription` then immediately redirects to `/client`. The PaymentIntent sits unconfirmed forever.

The customer already has a fully-set-up, charge-ready payment method on file (the SetupIntent flow in step 5 of onboarding attaches it as `invoice_settings.default_payment_method` via `handle-setup-intent.ts`). For test cards like `4242 4242 4242 4242` and the vast majority of real luxury-segment cards that don't require SCA, we can charge immediately without user interaction.

## The fix

Change `createSubscription` to fetch the customer's default payment method and pass it explicitly to the subscription with `off_session: true`, removing `payment_behavior: 'default_incomplete'`.

### Proposed implementation

```typescript
// Fetch the customer's default payment method (set during SetupIntent flow)
const customer = await stripe.customers.retrieve(stripe_customer_id)
const defaultPaymentMethodId =
  typeof customer === 'object' && !customer.deleted
    ? (customer.invoice_settings?.default_payment_method as string | null)
    : null

if (!defaultPaymentMethodId) {
  // No payment method on file. Should never happen if SetupIntent flow ran,
  // but defend against it explicitly.
  throw new Error('No payment method on file — please complete payment setup before subscribing')
}

const subscription = asStripe<Stripe.Subscription>(
  await stripe.subscriptions.create({
    customer: stripe_customer_id,
    items: [{ price: stripe_price_id_current }],
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    metadata: { profile_id: user.id, tier_id: tierId },
    default_payment_method: defaultPaymentMethodId,  // explicit PM for this sub
    off_session: true,                                // charge immediately, no SCA prompt
    // Removed: payment_behavior: 'default_incomplete'
  })
)
```

### What this changes

- Subscription is created and the first invoice is charged immediately using the saved card
- If the card declines (rare with test cards, possible with real cards in real signups), Stripe raises an error which surfaces to the client — handle it in the catch block in `onboarding-flow.tsx` `handleActivate` so the user sees a "card declined" message
- For cards that succeed: webhook chain completes, `invoice.payment_succeeded` fires, subscription transitions to `active`, DB updates via webhook handler

### Consider for SCA-required cards (post-MVP polish, not in scope here)

If a real card eventually requires 3DS, the `off_session: true` charge will fail with an `authentication_required` error and Stripe will require the user to be on-session to confirm. For the luxury-segment pilot, this is rare. Long-term we may want to add a fallback that returns the PaymentIntent client_secret and confirms in the browser — but that's a larger refactor not blocking launch.

For now: `off_session: true` works for test cards (no SCA) and for most real US/non-EU cards.

## Apply the same pattern to `changeTier`

Same file (`src/actions/stripe.ts`), function `changeTier` around line 230 — it has the same `payment_behavior: 'default_incomplete'` pattern when creating the new tier's subscription. Apply the same fix there so tier upgrades/downgrades also charge cleanly.

Grep for `payment_behavior` across the codebase to make sure there are no other instances I missed.

## Verify

1. `npx tsc --noEmit` clean
2. `npm run lint` clean
3. With `pnpm dev` + `stripe listen` both running, do a fresh incognito signup with a new email (e.g., `webhooktest3@example.com`)
4. After "Confirm & start membership," watch `stripe listen` output for:
   - `invoice.payment_succeeded` ← NEW, should now appear
   - `customer.subscription.updated` ← NEW, transitions sub to `active`
5. Run verification SQL:
   ```sql
   SELECT email, onboarding_complete, cs.status
   FROM profiles p
   LEFT JOIN client_subscriptions cs ON cs.client_id = p.id
   WHERE email = 'webhooktest3@example.com';
   ```
   Expected: `status = 'active'`
6. In Stripe Dashboard → Transactions, the new $299 charge should show `Succeeded` (green), not `Incomplete`

## Reporting protocol

Per the Bug Fix Cycle convention in `llv_session_handoff.md`. Next entry is **#21**.

Suggested row:

```
| 21 | May 30, 2026 | High | Subscriptions / Stripe | New client signups left subscriptions stuck at `status=incomplete` because `createSubscription` used `payment_behavior: 'default_incomplete'` — a mode designed for SCA flows that requires client-side PaymentIntent confirmation we never performed. Result: invoice generated, PaymentIntent created, but never confirmed → `invoice.payment_succeeded` never fired → subscription never transitioned to active → no actual money charged. Fixed by fetching the customer's default payment method (set during SetupIntent flow), passing it explicitly to `subscriptions.create` with `off_session: true`, and removing `payment_behavior: 'default_incomplete'`. Applied same fix to `changeTier`. Surfaced via local Stripe CLI webhook testing today. | ✅ FIXED |
```

Commit + push. Local dev will hot-reload; Vercel will auto-deploy.
