# Your Steps — Final QA Gate (last open Phase 0 item)

**For:** Jim (founder) — this is for YOU to read and follow. Not a Code prompt; don't paste into VS Code.
**Date:** 2026-06-06

This is the last open Phase 0 item: confirm the platform's writes actually land in **Stripe, Resend, and Inngest**, and that **admin return-processing** works end-to-end. Everything in the app UI already passed. The working checklist with the exact clicks is:

**→ `docs/testing/llv_dashboard_qa_verification_checklist.md`** (9 checks, all in TEST/sandbox mode). Use that as your worksheet; this page tells you *when* to run each part and what changed.

---

## ⚠️ Read this first — sequencing

One of the nine checks (SMS) still depends on a Code prompt that hasn't shipped. **Don't run it until the matching prompt is done**, or it'll "fail" for the wrong reason:

1. ✅ **Email checks (checklist Section 2) — NOW READY.** The **Resend wiring** prompt shipped and is on the test deploy (commits `1f3c0fa..415cdae`, 2026-06-06). Every lifecycle/billing event now fires a branded email, including the previously-missing **payment receipt / payment-failed**, plus welcome, seasonal reminder, and provider-assignment. **Run Section 2 now** and confirm one email per event (Resend dev inbox / `dev_email_inbox` in local mode), no leaked template variables, unsubscribe honored.

2. **SMS** — there's no SMS in the checklist yet because it isn't wired. Once the **SMS consent flow** and **Twilio SMS** prompts ship, add a quick SMS pass (consented test client receives confirm/ship/deliver texts; non-consented gets none).

The rest — Stripe (Section 1), Inngest (Section 3), and **admin return-processing (Section 4 / test plan T12.1 steps 4–6)** — you can run **now**.

---

## What to do now (no dependencies)

**A. Stripe dashboard (checklist §1):** customer creation, active subscription, proration on tier change, refund, per-request invoice line items. All in **test mode** — do not switch to live.

**B. Inngest dashboard (checklist §3):** per-request billing function registered + a successful run; seasonal reminder function registered with its schedule, not erroring.

**C. Admin return-processing (checklist §4 = T12.1 steps 4–6):** as admin, find an order in `return_initiated` → **Mark return received** → confirm it moves to `return_received`, the items re-enter storage with the correct `item_location`, and the audit log records it.

## What to do after the email prompt ships

**D. Resend dashboard (checklist §2):** walk an order confirm → ship → deliver and activate a membership; confirm one branded email per event, **including payment receipt** (membership activation) and, if you simulate a failing card, payment-failed. Check unsubscribe link present and preferences respected.

## New — after the Sentry prompt (2.1) ships

**E. Sentry:** this won't be in the dashboard checklist. Once Code reports Sentry is wired, do the founder-side setup it can't do for you:
- Create the Sentry project and copy the DSN.
- Set `NEXT_PUBLIC_SENTRY_DSN` (and any server DSN) in the Vercel **production** project.
- Add an alert rule for the **production** environment (e.g., email on a new issue / error-rate spike).
- Trigger the test error Code left you and confirm it appears in Sentry tagged `production`.

---

## When you're done
- **All clear:** message me "QA gate verified" and which sections passed. I'll mark the Phase 0 item Done in the Notion tracker and we move to the long-lead launch gates (WI LLC + EIN first).
- **Anything fails:** paste the error or describe what you saw (screenshot is fine). I'll turn it into a Code prompt (logged as the next Bug Fix Cycle) — you won't have to diagnose it.

## Tracker items this closes
- *Founder dashboard verifications — Stripe / Resend / Inngest* (Phase 0, Launch gate, In progress)
- *Admin return-processing checks (T12.1 steps 4–6)* (Phase 0)
