# Code Prompt 7 — Fix demo-login shortcuts (investor + admin + client)

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** QA of the investor dashboard. Bug found during browser testing.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem (observed in the browser)

On `/auth/login`, clicking the **dev-shortcut buttons** "→ Demo client / Demo admin / Demo investor" does **nothing** — no navigation, no error, no auth cookie set. Verified for both Demo investor and Demo admin. The page hydrates fine (no console errors), so this is a wiring bug, plus likely-missing seed accounts.

Two root causes:

1. **The buttons ignore the action result and don't await it.** In `src/components/auth/demo-login.tsx`:
   ```tsx
   onClick={() => startInvestor(() => { signInAsDemo('investor') })}
   ```
   The transition callback is synchronous and discards the returned promise, so `signInAsDemo`'s success `redirect('/')` is never applied to the router and its `{ error }` return is never shown. All three buttons fail silently.

2. **The demo accounts may not exist in the connected database, and the demo investor lacks the NDA flag.** `src/lib/seed/seed-demo-accounts.ts` creates `demo.investor@llv.dev` (role `investor`) but does **not** set `nda_acknowledged = true`, so even after a successful login the proxy NDA gate would bounce it to `/investor/acknowledge`. The account also only exists if the seed has been re-run since the investor branch was added.

## Goal

### 1. Make `signInAsDemo` return a result instead of redirecting

In `src/actions/auth.ts`, change `signInAsDemo` to return `{ success: true }` on success (keep `{ error }` on failure) — do **not** call `redirect()` inside it (programmatic server-action redirects invoked from an event handler are unreliable):

```ts
export async function signInAsDemo(role: 'client' | 'admin' | 'investor') {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'true') {
    return { error: 'Demo login is not enabled in this environment.' }
  }
  const supabase = await createClient()
  const EMAIL_MAP = { admin: 'demo.admin@llv.dev', client: 'demo.client@llv.dev', investor: 'demo.investor@llv.dev' }
  const { error } = await supabase.auth.signInWithPassword({ email: EMAIL_MAP[role], password: 'demo1234' })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true as const }
}
```

### 2. Fix the buttons — await the action, navigate client-side, surface errors

In `src/components/auth/demo-login.tsx`, use `useRouter` and async transitions, and show any error:

```tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signInAsDemo } from '@/actions/auth'
// ...
const router = useRouter()
const [error, setError] = useState<string | null>(null)

function go(role: 'client' | 'admin' | 'investor', start: React.TransitionStartFunction) {
  setError(null)
  start(async () => {
    const r = await signInAsDemo(role)
    if (r?.error) { setError(r.error); return }
    router.push('/')   // proxy routes each role to its area (investor → /investor)
    router.refresh()
  })
}
// each button: onClick={() => go('investor', startInvestor)}
```
Render `error` in a small visible message block (same styling as the login form's error banner) so failures are never silent again. Keep the pending/"Signing in…" states.

### 3. Add "Demo — Investor" to the Quick-login dropdown

In `src/components/auth/login-form.tsx`, the dropdown account list currently has only Admin + Client. Add an investor entry for parity:
```ts
{ label: 'Demo — Investor', email: 'demo.investor@llv.dev', password: 'demo1234' },
```

### 4. Seed: set the NDA flag on the demo investor

In `src/lib/seed/seed-demo-accounts.ts`, when creating/updating the demo investor, also set `nda_acknowledged: true` (both the create-branch `profiles.update` and the existing-branch update), so the demo investor lands directly in `/investor` without hitting the NDA gate. (Optional: also insert a matching `investor_nda_acknowledgments` row for realism.)

### 5. After merge of this prompt — re-run the demo seed

Note for the founder (not code): run the **Seed Data Manager → demo accounts** (or the seed entry that calls `seedDemoAccounts`) so `demo.investor@llv.dev` exists in the connected database. Confirm `seeded`/`skipped` counts and no errors.

## Acceptance criteria

- Clicking **→ Demo investor** signs in and lands on `/investor` (no NDA gate, since the flag is set); **→ Demo admin** lands on `/admin`; **→ Demo client** on `/client`.
- A failed demo login shows a **visible error** (e.g. "Invalid login credentials") instead of doing nothing.
- "Demo — Investor" appears in the Quick-login dropdown.
- `demo.investor@llv.dev` is seeded with role `investor` and `nda_acknowledged = true`.
- `npm run verify` clean.

## Conventions (from CLAUDE.md)
- Shadcn Base UI; Lucide icons only (no emoji); Obsidian & Ivory; Server Actions re-verify session; demo login stays behind `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`; service-role client server-only.

## Report back
Files changed, confirmation all three demo shortcuts now sign in and route correctly, that errors are surfaced, the demo-seed re-run result (counts/errors), and the `npm run verify` result.
