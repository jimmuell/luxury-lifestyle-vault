# LLV — Dashboard QA Verification Checklist
**Date:** June 1, 2026
**Owner:** Jim (founder — these run in your logged-in sandbox dashboards)
**Purpose:** Close out the only remaining QA items from the Sections 2–13 test run. These verifications can't be done from the app UI — they confirm that the platform's writes actually landed in Stripe, Resend, and Inngest. Everything in the app itself passed.

All dashboards are in **TEST / sandbox mode**. Don't switch to live.

How to use: walk each block top to bottom, check the box when the expected result matches, and jot the actual result if it doesn't. Anything that fails becomes a Code prompt (Cowork drafts, Code fixes), logged as Bug Fix Cycle #36+.

---

## 1. Stripe Dashboard
**URL:** https://dashboard.stripe.com/test/ — confirm the **"Test mode"** toggle (top-right) is ON.

Prep: have one freshly onboarded test client and one on-demand (Tier 3) order handy, or use a seeded/demo client. The demo client is on **Seasonal Essentials**.

### 1.1 — Customer creation (maps to T3 / onboarding)
- [ ] Go to **Customers** (https://dashboard.stripe.com/test/customers).
- [ ] Each onboarded test client appears as a Customer (name + email match the app).
- [ ] Open one customer → a **default payment method** is attached (set during the SetupIntent step).
- **Expected:** one Stripe Customer per onboarded client, with a card on file. No duplicate customers for the same client (the #11 self-heal uses idempotency key `profile_<user_id>`).

### 1.2 — Subscription creation (T3 / membership activation)
- [ ] Go to **Subscriptions** (https://dashboard.stripe.com/test/subscriptions).
- [ ] Each Tier 1/Tier 2 client has a subscription with status **Active** (not `incomplete` — that was bug #21).
- [ ] The plan/price matches the tier ($299 Seasonal Essentials / $599 Seasonal Premier).
- **Expected:** Active subscription, correct price, billing cycle anchored to signup date.

### 1.3 — Proration on tier change (T3 / tier upgrade-downgrade)
- [ ] Pick a test client on Seasonal Essentials. In the **app admin panel** (or Stripe directly), change their tier to Seasonal Premier mid-cycle.
- [ ] In Stripe, open that subscription → **upcoming invoice** (or the immediately-issued invoice).
- [ ] You see **proration line items**: a credit for unused Essentials time + a charge for the Premier remainder.
- **Expected:** net proration reflects the partial period, not a full double charge. Note the prorated amount.

### 1.4 — Refund processing (T11 / admin refund)
- [ ] Trigger a refund from the **app admin order panel** (the refund action — now behind the custom confirm dialog, bug #33).
- [ ] In Stripe → **Payments**, open the relevant charge.
- [ ] Charge shows **Refunded** (or Partially refunded) with a matching refund amount and timestamp.
- **Expected:** refund amount = what the admin entered; charge status updates; refund visible under the customer too.

### 1.5 — Per-request invoice line items (T5 / on-demand billing)
- [ ] Place/complete an **on-demand (Tier 3)** order in the app.
- [ ] In Stripe → **Invoices** (https://dashboard.stripe.com/test/invoices), find the invoice for that client.
- [ ] Invoice has **per-item line items** (base fee + per-item surcharges), not a single opaque charge.
- **Expected:** line items sum to the cost preview the client saw at checkout; descriptions identify the request.

---

## 2. Resend Dashboard (email notifications)
**URL:** https://resend.com/emails — or use the app's **dev-mode inbox** (QA inbox) if you'd rather not check the live Resend log.

Trigger emails by walking an order through its lifecycle in the app (confirm → ship → deliver) and by activating a membership.

- [ ] **Order confirmed** email sent (to the test client's address).
- [ ] **Shipped** email sent (with tracking, if populated).
- [ ] **Delivered** email sent.
- [ ] **Payment succeeded** email (membership activation / invoice paid).
- [ ] **Payment failed** email — optional; only if you simulate a failing card.
- [ ] Each email status shows **Delivered** (Resend log) and renders with LLV branding (Obsidian & Ivory, logo).
- [ ] Unsubscribe link present (CAN-SPAM) and per-template preferences are respected.
- **Expected:** one email per lifecycle event, correct recipient, branded HTML, no raw template variables leaking.

---

## 3. Inngest Dashboard (background jobs)
**URL:** https://app.inngest.com/ — the cloud env connected via the Vercel integration. Look at **Functions** and **Runs**.

### 3.1 — Per-request billing function
- [ ] In **Functions**, the per-request (on-demand) billing function is **registered**.
- [ ] After placing an on-demand order (§1.5), open **Runs** → there's a **successful run** for that function tied to the order event.
- [ ] No errored/retrying runs for that event.
- **Expected:** function fired once per on-demand request, completed successfully, and produced the Stripe invoice from §1.5.

### 3.2 — Seasonal rotation reminder schedule
- [ ] In **Functions**, the seasonal reminder function is **registered** with a **cron/schedule** trigger.
- [ ] Schedule reflects the configured lead days (the admin-set reminder lead time).
- [ ] If any run has fired, it shows as successful; otherwise confirm the next scheduled run time is set.
- **Expected:** the seasonal reminder is scheduled (Oct/Apr rotation lead), registered, and not erroring.

---

## 4. In-app — Admin return processing (T12.1 steps 4–6)
This one is in the app, not a dashboard — it's the half of the return flow the test run didn't exercise (client initiation already verified).

- [ ] As **admin**, find an order in `return_initiated` status (initiate one as a client first if needed).
- [ ] **Mark return received** (now behind the custom confirm dialog, bug #33).
- [ ] Order transitions to `return_received`.
- [ ] The returned **items re-enter storage** automatically — verify their `item_location` updates to the correct WI/AZ storage location.
- **Expected:** status advances, items show back in storage at the right corridor end, audit log records the transition.

---

## Result log
| # | Check | Pass? | Actual result / notes |
|---|-------|-------|------------------------|
| 1.1 | Stripe customer creation | ☐ | |
| 1.2 | Stripe subscription active | ☐ | |
| 1.3 | Stripe proration on tier change | ☐ | |
| 1.4 | Stripe refund | ☐ | |
| 1.5 | Stripe per-request line items | ☐ | |
| 2 | Resend emails (all events) | ☐ | |
| 3.1 | Inngest per-request billing run | ☐ | |
| 3.2 | Inngest seasonal reminder schedule | ☐ | |
| 4 | Admin return processing | ☐ | |

**If anything fails:** describe it here, and Cowork will turn it into a Code prompt (logged Bug Fix Cycle #36+). Once all nine pass, the Sections 2–13 QA is fully closed and the platform is verified end-to-end — clear to shift to founding-member recruitment.
