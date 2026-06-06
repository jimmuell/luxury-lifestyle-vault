# Code Prompt — Fix `.env.example` drift (Tracker 1.4 follow-up)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Tracker:** 1.4 Add .env.example (marked Done — this corrects drift found in a later audit)

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Context

`.env.example` exists, but a code audit found it has drifted from what the code actually reads. Three classes of problem:

1. **Referenced in code but missing from `.env.example`:**
   - `NEXT_PUBLIC_APP_URL` — used widely (email layout `src/lib/resend/emails/layout.ts`, `src/actions/orders.ts`, `src/actions/auth.ts`). **This is the important one** — see the bug below.
   - `AI_CATEGORIZATION_MODEL` — optional override in `src/lib/inngest/functions/categorize-photo.ts` and `src/actions/search.ts` (defaults to `claude-haiku-4-5-20251001`).
   - `RESEND_FROM_EMAIL` and `RESEND_DEV_MODE` — both read in `src/lib/resend/client.ts`.

2. **Likely-latent bug — name mismatch:** `.env.example` declares `NEXT_PUBLIC_SITE_URL`, but **no code reads `NEXT_PUBLIC_SITE_URL`**. The code reads `NEXT_PUBLIC_APP_URL`. So anyone provisioning env from `.env.example` sets the wrong variable and email links / redirects silently fall back to empty strings. Confirm by grepping the codebase for both names, then standardize on **`NEXT_PUBLIC_APP_URL`** (the one the code actually uses) and remove `NEXT_PUBLIC_SITE_URL` from `.env.example`.

3. **Twilio comment is misleading:** the header says "wired but not yet active." Until the Twilio SMS prompt (1.2) lands, the accurate state is "installed, not yet wired." Adjust the comment to match whatever is true at the time this prompt is applied.

## Goal

`.env.example` lists **every** variable the code reads, with accurate grouping/comments and no stale entries, so a fresh clone or a new Vercel environment can be provisioned correctly from it.

## Scope
- Grep the whole repo for `process.env.` and reconcile against `.env.example`. Add any missing referenced vars; remove any declared-but-never-read vars (notably `NEXT_PUBLIC_SITE_URL`, after confirming it's unused).
- Add, with brief comments: `NEXT_PUBLIC_APP_URL`, `AI_CATEGORIZATION_MODEL` (note the default), `RESEND_FROM_EMAIL` (note default `noreply@send.luxurylifestylevault.com`), `RESEND_DEV_MODE`.
- Keep `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` (used by the Inngest SDK via env even if not referenced by name in app code) — add a comment saying so.
- Mark clearly which vars are required vs. optional, and which must **never** use a `NEXT_PUBLIC_` prefix (server-only secrets).
- Preserve the existing tidy section-header style.

> **Note for whoever sequences these:** if the Sentry (2.1) and/or Twilio (1.2) prompts are applied around the same time, those will introduce new env vars (`SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN`, and the Twilio dev-mode flag). Add them to `.env.example` in the same pass if they already exist in the tree; otherwise each of those prompts is responsible for its own additions.

## Acceptance criteria
- Every `process.env.*` the code reads has a matching entry in `.env.example`; no orphan entries remain.
- `NEXT_PUBLIC_SITE_URL` is gone (or, if a grep proves it IS used somewhere, the code is migrated to `NEXT_PUBLIC_APP_URL` instead — report which).
- `npm run verify` is clean (this is mostly a docs/config change, but run it anyway).

## Report back
The final variable list, and explicit confirmation of how the `NEXT_PUBLIC_SITE_URL` vs `NEXT_PUBLIC_APP_URL` mismatch was resolved.
