# Code Prompt — #35 re-fix: duplicate-corridor error still shows generic message

**Date:** 2026-06-01
**Severity:** Low
**Surfaced by:** Cowork re-test of the previous #35 fix (it did not resolve the user-facing message).

## Status
The first #35 fix made `createCorridor` catch Postgres `23505` and **`throw new Error("A corridor for WI ↔ AZ already exists.")`**. **Re-test on the deployment still shows the generic toast:** *"An error occurred in the Server Components render. The specific message is omitted in production builds…"* — not the friendly message. (The modal does now stay open — that part is fine.)

## Root cause
**Next.js masks *thrown* error messages from Server Actions / Server Components in production builds**, replacing them with the generic digest. So throwing a custom message can't surface it to the user in prod.

## Fix
Have `createCorridor` (and the form/client that calls it) **return** the error rather than throw it:
- On `23505` (or a pre-check that the origin/destination pair already exists), return a typed result like `{ ok: false, error: "A corridor for WI ↔ AZ already exists." }` (interpolate the actual codes).
- The client component awaits the result and, when `ok === false`, shows `error` via the existing toast and keeps the modal open. On success, proceed as today.
- Keep this pattern consistent with how other server actions in the codebase return user-facing errors.

(General note: any other admin action that currently relies on `throw` to surface a user-facing message will have the same prod-masking problem — worth a quick audit, but only the corridor case is in scope here.)

## Verify
- Create a corridor with origin/destination that already exists (WI↔AZ) → friendly **"A corridor for WI ↔ AZ already exists."** toast, modal stays open, no generic "Server Components render" error.
- Creating a unique corridor still works.
- `npm run verify` clean; update the Bug Fix Cycle entry (#35) in `llv_session_handoff.md`.

## Test residue to clean up (optional)
A test corridor **"Defaults Fixed Check" (WI↔TX)** is still in the list from earlier re-tests — note it's currently bleeding into the client dashboard's storage summary text ("33 items in Defaults Fixed Check storage…"), so deleting/deactivating it also fixes that cosmetic issue. Also a confirmed→dispatched on-demand order #DC62EF27 (Margaret) was left by the #32 re-test.
