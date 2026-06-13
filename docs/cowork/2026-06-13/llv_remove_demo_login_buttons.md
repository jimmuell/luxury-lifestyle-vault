# Code Prompt — Remove the demo "dev shortcuts" buttons (keep the Quick-login dropdown)

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-13
**Canonical location:** `docs/cowork/2026-06-13/llv_remove_demo_login_buttons.md` (this file).
**Branch:** create `fix/remove-demo-login-buttons` off `main` (main is at d540d76 after PR #5).
**Workflow:** push → PR → CI (`verify` + `build`) → Vercel preview → QA → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit out of credits — self-review.)

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-13/llv_remove_demo_login_buttons.md`, create the folder if needed and save it there verbatim, then proceed.

## Why

The login page has two redundant demo-login affordances: the **Quick-login dropdown** (in `login-form.tsx`) which lists every demo/test account, and a row of **"dev shortcuts" buttons** (`DemoLogin`, "→ Demo client / admin / prospect / investor / board"). The dropdown already covers all of these, so the buttons are redundant. Remove the buttons and their associated code; **keep the dropdown exactly as-is.**

**Scope note (not the security gate):** this is a de-duplication, not the launch-gate fix. The dropdown still exposes the demo accounts and everything here remains gated by `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`. Disabling demo login in production + deleting the demo accounts is a separate task — do **not** change the env flag or the dropdown here.

## Changes (three touchpoints — all verified)

### 1. `src/app/(auth)/auth/login/page.tsx`
- Remove the import: `import { DemoLogin } from '@/components/auth/demo-login'`
- Remove the `<DemoLogin />` element (currently the last child before `</div>`).
- The wrapper uses `space-y-8`, so no spacing cleanup is needed once the element is gone.

### 2. `src/components/auth/demo-login.tsx`
- **Delete the entire file.** It is imported nowhere else (confirmed — only `login/page.tsx` referenced it).

### 3. `src/actions/auth.ts`
- Remove the `signInAsDemo` action (the `export async function signInAsDemo(role: …) { … }` block, currently lines ~51–75, including its internal `EMAIL_MAP`).
- It is used **only** by the deleted `demo-login.tsx` (confirmed by grep), so it becomes dead code. Leave `signIn`, `signUp`, `signOut`, and `sendMagicLink` untouched.

## Do NOT touch

- `login-form.tsx` — the Quick-login dropdown, `QUICK_ACCOUNTS`, and `handleQuickSelect` stay exactly as they are.
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` and any other env flags.
- `src/lib/seed/seed-demo-accounts.ts` — the demo accounts themselves remain (the dropdown still uses them).

## Done (acceptance)

- Login page renders the Quick-login dropdown and the email/password + magic-link form, with **no "dev shortcuts" button row** beneath "Request access."
- `demo-login.tsx` is gone; no remaining imports or references to `DemoLogin` or `signInAsDemo` anywhere (`grep -r` clean).
- `npm run verify` passes (no unused-import / unused-export lint or TS errors). `build` passes; QA on the Vercel preview.

## Commit

- Branch `fix/remove-demo-login-buttons`: `chore(auth): remove redundant demo dev-shortcut buttons (keep quick-login dropdown)`.
