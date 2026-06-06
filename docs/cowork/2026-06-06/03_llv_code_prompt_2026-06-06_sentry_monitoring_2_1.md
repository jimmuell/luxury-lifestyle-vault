# Code Prompt — Error monitoring with Sentry (Tracker 2.1)

**Date:** 2026-06-06
**Author:** Cowork
**For:** Claude Code
**Tracker:** 2.1 Error monitoring (Sentry) · Phase 2 — Observability · Priority High

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder will exercise the running app. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Goal

No error monitoring exists today (no `@sentry/*` packages, no instrumentation files). Add Sentry across **client, server, and Inngest background jobs** for this **Next.js 16 (App Router)** app, with environment tagging and alerting, so production errors are captured and triaged.

## Important — Next.js 16 specifics
- This is **Next.js 16.2.6**. Use the current `@sentry/nextjs` SDK and its **App Router + `instrumentation.ts`** integration model (the modern `instrumentation.ts` / `instrumentation-client.ts` approach), **not** the legacy `sentry.client/server.config.ts` pattern from older guides. Verify the SDK version's docs for Next 16 before wiring.
- There is currently **no `instrumentation.ts`** in the repo and `next.config.ts` has no Sentry wrapping — you're adding both.
- Respect the project's existing `next.config.ts` (Tailwind v4 / no `tailwind.config.ts`) and the patch-package setup — wrap the config with `withSentryConfig` without disturbing existing options.

## Scope

**1. Install** `@sentry/nextjs` (pin a version compatible with Next 16). Add it to `package.json` deps.

**2. Init files** following the SDK's Next-16 guidance:
- Client init (browser) — DSN from `NEXT_PUBLIC_SENTRY_DSN`.
- Server init + `instrumentation.ts` `register()` hook (and `onRequestError` for App Router server errors).
- Set `environment` from `VERCEL_ENV` (falls back to `NODE_ENV`) so prod / preview / dev are tagged distinctly.
- Conservative `tracesSampleRate` (e.g. 0.1) and **PII off** by default (`sendDefaultPii: false`) — this app handles client/payment data; do not capture request bodies or headers that could include personal data. Scrub email/phone if added to scopes.

**3. Inngest coverage:** Inngest functions run in the server runtime, so the server/instrumentation init should cover them, **but** confirm uncaught errors inside Inngest functions actually reach Sentry. If they don't surface automatically, wrap the function handlers (or add a shared error-capturing wrapper used in `src/app/api/inngest/route.ts`) so background-job failures are reported with the function id + event name as tags/context.

**4. Verify-safe config:** the build/verify must pass with **no DSN set** (CI and the founder's local env won't have one) — Sentry should no-op gracefully when `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` are absent. Source-map upload (which needs `SENTRY_AUTH_TOKEN` + org/project) must be **optional** and skipped when the token isn't present, so local/CI builds don't fail.

**5. Env vars** — add to `.env.example` (and note they're set in Vercel for prod): `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` (if used server-side), and the build-only `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (clearly marked optional / build-time, server-only).

**6. Smoke hook:** add a tiny throwaway way for the founder to confirm capture — e.g. a server action or `/api/_sentry-test` route (guarded behind the existing `SEED_TOOLS_ENABLED` boundary or admin-only) that throws on demand. Document how to remove it later, or remove it before final and just give the founder a manual trigger.

**7. Alerting (founder-facing, not code):** alerting rules are configured in the Sentry dashboard, not in code. Note in your report that the founder must, in Sentry: create the project, set `NEXT_PUBLIC_SENTRY_DSN` in Vercel, and add an alert rule (e.g. email on new issue / error-rate spike) for the **production** environment. Add these as steps for the QA-gate / founder doc.

## Acceptance criteria
- `npm run verify` is clean **with and without** a DSN present.
- Client, server, and Inngest errors are captured and tagged with the correct `environment`.
- No PII (emails, phone numbers, payment data, request bodies) is sent to Sentry by default.
- Source-map upload is optional and does not break builds when `SENTRY_AUTH_TOKEN` is absent.
- New env vars are in `.env.example`, server-only ones without `NEXT_PUBLIC_`.

## Conventions (from CLAUDE.md)
- Don't break the existing `next.config.ts` / patch-package / Node 20.19.5 setup.
- Server-only secrets never get a `NEXT_PUBLIC_` prefix.

## Report back
Files added/changed, SDK version pinned, `npm run verify` result (with and without DSN), how Inngest errors were confirmed to reach Sentry, and the exact founder dashboard steps (create project, set Vercel env var, add prod alert rule).
