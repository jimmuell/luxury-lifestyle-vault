# Code Prompt — Fix Resend from-address fallback default (follow-up to 1.3)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Relates to:** 1.3 Resend email. Tiny one-line correctness fix. Run anytime — independent of the other 2026-06-06 prompts.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Why

The app's from-address is `process.env.RESEND_FROM_EMAIL || <hardcoded fallback>`. The live environments correctly set `RESEND_FROM_EMAIL=noreply@send.luxurylifestylevault.com` (the **verified** Resend sending subdomain), so real sending is fine today. But the **hardcoded fallback** in `src/lib/resend/client.ts` is the apex `noreply@luxurylifestylevault.com`, which is **not** a verified Resend domain. If `RESEND_FROM_EMAIL` is ever missing in some environment, the app would silently send from an unverified address → bounces / spam. Make the fallback the verified subdomain so a blank env can't break deliverability.

We are intentionally **not** verifying the apex domain in Resend — the `send.` subdomain is the correct, best-practice sending identity.

## Scope

**1. `src/lib/resend/client.ts`** — change the fallback default on the `FROM_EMAIL` line:
```ts
// from:
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@luxurylifestylevault.com'
// to:
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@send.luxurylifestylevault.com'
```

**2. `.env.example`** — update the `RESEND_FROM_EMAIL` comment so the documented default matches:
```
RESEND_FROM_EMAIL=   # optional; default: noreply@send.luxurylifestylevault.com (verified Resend subdomain)
```

That's the whole change. Do **not** modify any other from-address logic, and do not change `RESEND_FROM_EMAIL` anywhere it's actually set (env files / Vercel) — only the in-code fallback and the example comment.

## Acceptance criteria
- `grep` confirms no remaining `'noreply@luxurylifestylevault.com'` (apex) default in `src/`.
- `npm run verify` (ESLint + tsc) is clean.
- Runtime behavior is unchanged where `RESEND_FROM_EMAIL` is set (env still wins); only the fallback for a blank env now uses the verified subdomain.

## Report back
The one-line diff, the `grep` result confirming the apex default is gone, and the `npm run verify` result.
