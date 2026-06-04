# Code Prompt — "Save pricing" freeze / non-persistence (ROOT CAUSE FOUND — superseded)

**Date:** 2026-06-01
**Severity:** High
**Surfaced by:** QA test run (T2.1).

## Status: root cause identified — fix is in the native-dialogs prompt
This was **not** a Stripe hang (my initial hypothesis). Root cause confirmed by codebase scan:

`src/components/admin/tier-edit-form.tsx` (~line 182–189) only saves pricing when the price changes, and gates on a **native `window.confirm()`**:
```ts
const priceChanging = monthlyPriceCents !== tier.monthly_price_cents && tierType === 'subscription'
if (priceChanging) {
  const ok = confirm('This will create a new Stripe price. Existing subscribers will keep their current price unless you migrate them. Continue?')
  if (!ok) return            // ← native dialog blocked the page; dismissed → save returned early
}
startTransition(async () => { await updateTierPricing(tier.id, pricingFields); ... })
```
The native dialog **blocks the page's main thread**. During QA the dialog couldn't be interacted with, was dismissed, `ok` was false, and the handler returned before saving — so the price never persisted and no audit entry was written. The sibling "Save configuration" button has no `confirm()`, which is why it always saved instantly.

## Fix
Covered by **`llv_code_prompt_2026-06-01_native_dialogs.md`** — replace this `confirm()` (and the 7 other native `confirm()` sites) with the custom in-app confirm dialog. After that change, verify: change a tier monthly price → custom dialog → Confirm → price persists + `pricing_change_log` + `audit_log` (`service_tier.updated`) entries written, no freeze.

This closes Bug Fix Cycle #25.
