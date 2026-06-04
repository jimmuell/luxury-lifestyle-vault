# Code Prompt — Replace native `window.confirm()` dialogs with a custom confirm dialog

**Date:** 2026-06-01
**Severity:** High (one instance is the root cause of the "Save-pricing freeze"; all instances break the luxury brand voice and block automated testing)
**Surfaced by:** QA test run + founder observation (native browser dialog screenshot on Cancel order).

## Problem
The app uses the **native browser `confirm()`** for destructive/irreversible confirmations. Native dialogs render as ugly OS/browser chrome ("luxury-lifestyle-vault.vercel.app says…") — off-brand for a luxury concierge product — and they **block the page's main thread**, which is why these actions appeared to "freeze" during QA.

**Root-cause note:** the High-severity "Save-pricing freeze" (Bug Fix Cycle #25) is THIS issue. In `src/components/admin/tier-edit-form.tsx` the pricing save only fires when the price changes, and it gates on `confirm('This will create a new Stripe price… Continue?')` then `if (!ok) return`. The native dialog blocked the test driver, got dismissed, and the save returned early — so the price never persisted and no audit entry was written. It was **not** a Stripe hang. The non-Stripe "Save configuration" button has no `confirm()`, which is why it always saved instantly.

## All 8 native `confirm()` sites to replace
| File | Line | Message |
|------|------|---------|
| `src/components/admin/tier-edit-form.tsx` | 185 | "This will create a new Stripe price. Existing subscribers will keep their current price unless you migrate them. Continue?" (← Save-pricing freeze) |
| `src/components/admin/tier-edit-form.tsx` | 223 | "Deactivate this tier? Existing subscribers will not be affected." |
| `src/components/admin/admin-order-status-panel.tsx` | 91 | "Issue a full refund for this order? This cannot be undone." |
| `src/components/admin/admin-order-status-panel.tsx` | 104 | "Mark this return as received? Item locations will be reset to intake." |
| `src/components/client/order-action-buttons.tsx` | 20 | "Cancel this order? This cannot be undone." (← founder's screenshot) |
| `src/components/client/order-action-buttons.tsx` | 33 | "Initiate a return for this order?" |
| `src/components/client/account-settings-form.tsx` | 67 | "Sign out of all devices?" |
| `src/components/client/account-settings-form.tsx` | 91 | "Close your account? Your wardrobe data will be preserved for 90 days before permanent deletion. This cannot be undone." |

(Also do a final `grep -rn "\\bconfirm(\|window.confirm\|alert(\|prompt(" src/` to catch any stragglers — and ban native dialogs going forward, e.g. an ESLint `no-restricted-globals` rule for `confirm`/`alert`/`prompt`.)

## Approach
The codebase already has `src/components/ui/dialog.tsx` (Base UI/Shadcn Dialog, used for the Return + New Corridor modals) and `sonner` toasts. Build a **reusable confirm dialog** in the same system and route all 8 sites through it.

1. Create `src/components/ui/confirm-dialog.tsx` — either a `useConfirm()` hook returning a `confirm({ title, body, confirmLabel, tone })` promise, or a controlled `<ConfirmDialog>` component. Styling: Obsidian & Ivory, Cormorant heading + Inter body, a primary confirm button (destructive tone = the gold/red treatment used elsewhere) and a secondary "Cancel". Must be keyboard-accessible and focus-trapped (Base UI Dialog already handles this).
2. Replace each native `confirm()` with the custom dialog. The handlers currently follow `if (!confirm(...)) return; <do action>` — convert to `const ok = await confirm({...}); if (!ok) return; <do action>` (these handlers already run inside async/startTransition).
3. Preserve each existing message (tighten copy for brand voice if you like, but keep the meaning). Keep the existing success/error `toast` calls after the action.

## Verify
- Each of the 8 actions now shows the **custom** in-app dialog (no native browser chrome), and the page does not block.
- **Save pricing specifically:** change a tier's monthly price → custom dialog → Confirm → price persists, `pricing_change_log` + `audit_log` (`service_tier.updated`) entries are written, no freeze. This closes Bug Fix Cycle #25.
- Cancel order, initiate return, refund, mark-return-received, deactivate tier, sign-out-everywhere, close-account all show the custom dialog and behave correctly.
- `grep` confirms no remaining native `confirm/alert/prompt` in `src/`.
- `npm run verify` clean. Add Bug Fix Cycle entries (#25 corrected + the native-dialog sweep) to `llv_session_handoff.md`.
