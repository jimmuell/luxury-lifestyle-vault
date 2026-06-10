# Code Prompt — Align from-address fallback to the verified apex domain

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Relates to:** supersedes prompt `07`. The apex `luxurylifestylevault.com` is now **verified** in Resend and is the chosen sending identity, so the in-code fallback should match it.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Why

The founder has chosen `noreply@luxurylifestylevault.com` (apex) as the sending address; `RESEND_FROM_EMAIL` is being set to it in local `.env` and Vercel. The apex domain is now fully verified in Resend (DKIM verified, sending enabled), so it's a safe default. Update the in-code fallback (currently the `send.` subdomain from prompt 07) and the `.env.example` comment so code, env, and docs all agree.

## Scope

**1. `src/lib/resend/client.ts`** — change the fallback default:
```ts
// from:
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@send.luxurylifestylevault.com'
// to:
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@luxurylifestylevault.com'
```

**2. `.env.example`** — update the `RESEND_FROM_EMAIL` comment to match:
```
RESEND_FROM_EMAIL=   # optional; default: noreply@luxurylifestylevault.com (verified Resend domain)
```

No other changes. Don't touch where `RESEND_FROM_EMAIL` is actually set (env files / Vercel).

## Acceptance criteria
- `grep` shows no remaining `noreply@send.luxurylifestylevault.com` literal in `src/`.
- `npm run verify` (ESLint + tsc) is clean.
- Runtime behavior unchanged where `RESEND_FROM_EMAIL` is set (env still wins); the blank-env fallback now uses the apex.

## Report back
The one-line diff, the `grep` result, and the `npm run verify` result.
