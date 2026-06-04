# Claude Code Prompt — Fix post-Confirm redirect on onboarding
**Date:** May 30, 2026
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**For:** Claude Code in VS Code, working in `~/Documents/Claude/Projects/luxury-lifestyle-vault`
**Priority:** Small but real UX bug — testers see a "did nothing happen?" moment after clicking Confirm & start membership.

---

## Context

Today's session shipped the full Stripe + webhook + subscription pipeline (Bugs #15–#21). Both local and Vercel environments verified end-to-end with `vercelsmoke@example.com` test signup: DB transitions `sub_status` from absent → `active`, Stripe shows `Succeeded` $299 charge, webhooks deliver 200 to Vercel endpoint.

One residual UX issue surfaced during the Vercel smoke test:

**After clicking "Confirm & start membership" on the Review step (step 6 of onboarding), the user stays on `/client/onboarding` instead of auto-navigating to `/client` dashboard.** Manual refresh or URL-bar navigation to `/client` works correctly — middleware sees `onboarding_complete: true` and allows access. So the data flow is fine. The client-side `router.push('/client')` just isn't taking effect.

## Where the bug lives

`src/components/client/onboarding-flow.tsx` line ~248 (inside `handleActivate`):

```typescript
startTransition(async () => {
  try {
    await activateAndComplete(selectedTierId)
    router.push('/client')       // ← this isn't navigating
  } catch (e) {
    // ...existing catch block...
  }
})
```

The `activateAndComplete` server action completes successfully (verified — DB writes go through, function returns). Then `router.push('/client')` is supposed to fire. It either silently fails or navigates to a stale router cache that bounces back via middleware.

## Likely cause

Most plausible: **stale router cache**. When the user landed on `/client/onboarding`, Next.js cached the `/client` page (the route they were originally trying to access before middleware bounced them). When `router.push('/client')` fires after Confirm, it uses the cached version, which re-evaluates middleware-side and might bounce back.

Less likely but possible: Next.js 16 + Turbopack has a known quirk where `router.push` after a server action inside `startTransition` doesn't fire reliably.

## The fix

Two options, in order of preference:

### Option A (recommended) — Add `router.refresh()` before `router.push`

This invalidates the router cache before navigating, forcing Next.js to re-fetch the route freshly:

```typescript
startTransition(async () => {
  try {
    await activateAndComplete(selectedTierId)
    router.refresh()              // invalidate cached /client
    router.push('/client')
  } catch (e) {
    // ...existing catch block unchanged...
  }
})
```

### Option B (fallback if A doesn't work) — Hard navigation via `window.location`

If router.refresh + push still fails, fall back to a hard browser navigation that bypasses Next.js routing entirely:

```typescript
startTransition(async () => {
  try {
    await activateAndComplete(selectedTierId)
    window.location.href = '/client'    // full page navigation, no router involvement
  } catch (e) {
    // ...existing catch block unchanged...
  }
})
```

This is less elegant (full page reload, loses any React state in-flight) but it's bulletproof — there's no router cache to worry about.

**Try Option A first.** If a test signup still doesn't auto-redirect, switch to Option B.

## Apply same fix to the fallback path

The catch block has a similar `router.push('/client')` after `completeOnboarding()` — apply the same fix there:

```typescript
} catch (e) {
  const msg = e instanceof Error ? e.message : ''
  if (msg.includes('not synced to Stripe') || msg.includes('no stripe customer')) {
    toast.warning('Membership activated. Billing will be configured by your concierge.')
    await completeOnboarding()
    router.refresh()              // <-- same fix here
    router.push('/client')
  } else {
    toast.error(msg || 'Failed to activate membership')
  }
}
```

## Verify

1. `npx tsc --noEmit` clean
2. `npm run lint` clean
3. Local: stop dev server if running production build, do fresh signup with a new email (e.g., `redirecttest@example.com`), walk all 6 onboarding steps, click Confirm & start membership
4. **Expected:** auto-redirects to `/client` dashboard within ~500ms of clicking Confirm. No manual refresh required.
5. SQL verify the data is correct (same query pattern as Bug #21 verification)
6. Push, let Vercel auto-deploy, repeat the test on the deployed URL with another fresh email

## Reporting protocol

Per the Bug Fix Cycle in `llv_session_handoff.md`. Next entry is **#22**.

Suggested row:

```
| 22 | May 30, 2026 | Medium | Onboarding UI | After successful "Confirm & start membership," `router.push('/client')` in `onboarding-flow.tsx` did not auto-navigate users to the client dashboard — they stayed on `/client/onboarding` until manual refresh. DB data was correct (subscription active, onboarding_complete=true), only the client-side navigation was failing. Likely stale router cache or Next.js 16/Turbopack server-action quirk. Fixed by calling `router.refresh()` before `router.push('/client')` in both the success and fallback catch paths. Tested with fresh signup on both local and Vercel — now auto-redirects cleanly. | ✅ FIXED |
```

Push to main and verify once Vercel deploys.
