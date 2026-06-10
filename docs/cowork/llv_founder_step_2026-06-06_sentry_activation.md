# Your Steps — Activate Sentry error monitoring

**For:** Jim (founder) — your steps. Not a Code prompt.
**Date:** 2026-06-06

Code shipped the Sentry integration (Tracker 2.1) and it's live in the codebase. But it's a **no-op until you give it a DSN** — Sentry only starts catching errors once these dashboard/env steps are done. Do this before soft launch.

## 1. Create the Sentry project
1. Go to **sentry.io**, sign in / create an account (free tier is fine to start).
2. **Create Project** → platform **Next.js** → name it e.g. `luxury-lifestyle-vault`.
3. After creation, open **Settings → Projects → (your project) → Client Keys (DSN)** and copy the **DSN** (looks like `https://abc123@o12345.ingest.us.sentry.io/67890`).
4. Note your **org slug** and **project slug** (visible in the URL / project settings) — you'll need them for readable stack traces.

## 2. Add the env vars in Vercel
**Vercel → `luxury-lifestyle-vault` project → Settings → Environment Variables.** Add these (apply to **Production** and **Preview**):

| Variable | Value | Required? |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | the DSN you copied | **Required** (browser errors) |
| `SENTRY_DSN` | the **same** DSN value | **Required** (server/Inngest errors) |
| `NEXT_PUBLIC_VERCEL_ENV` | `production` (and `preview` on the Preview env) | Optional — tags client errors with the right environment |
| `SENTRY_AUTH_TOKEN` | a Sentry auth token (Sentry → Settings → Auth Tokens) | Optional — enables readable stack traces (source maps) |
| `SENTRY_ORG` | your org slug | Optional — needed only with the auth token |
| `SENTRY_PROJECT` | your project slug | Optional — needed only with the auth token |

Minimum to start catching errors: the two **DSN** vars. The other four just make stack traces readable and tag the environment — add them when convenient.

## 3. Redeploy
Env-var changes only take effect on a new deploy: **Vercel → Deployments → latest → ⋯ → Redeploy.**

## 4. Smoke test (confirm it actually captures)
Code left a test endpoint that throws on demand: **`/api/_sentry-test`**. It's gated behind `SEED_TOOLS_ENABLED=true` (already set on your **test/preview** project, and intentionally **off** in production).
1. On the preview/test deploy, visit `…/api/_sentry-test` in the browser.
2. In Sentry → **Issues**, confirm a new error appears within a minute, tagged with the right **environment**.
3. If it shows up, capture is working end-to-end. ✅

## 5. Set an alert (so you actually hear about errors)
In Sentry → **Alerts → Create Alert** → a simple rule like "email me when a **new issue** is created" (and/or an error-rate spike), scoped to the **production** environment. Point it at your email.

## When done
Tell me "Sentry active" (and whether the smoke test captured) and I'll flip Tracker **2.1** to **Done** and note it in the handoff. The `/api/_sentry-test` endpoint can stay — it 404s in production where `SEED_TOOLS_ENABLED` is unset — or ask Code to remove it later.
