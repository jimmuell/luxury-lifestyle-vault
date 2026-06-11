# Sentry Error Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sentry error monitoring across client, server, and Inngest background jobs with environment tagging, PII-off defaults, and graceful no-op when no DSN is configured.

**Architecture:** The modern Next.js 16 approach uses `src/instrumentation.ts` (server init + `onRequestError` hook) and `src/instrumentation-client.ts` (browser init) — no legacy `sentry.*.config.ts` files. `next.config.ts` is wrapped with `withSentryConfig` so source maps can optionally be uploaded on Vercel CI. Inngest functions get explicit error capture via a shared `withSentryCapture` wrapper since Inngest internally catches and retries errors (preventing them from reaching Sentry's global unhandled-error handler).

**Tech Stack:** `@sentry/nextjs@^10.56.0`, Next.js 16.2.6 App Router, `instrumentation.ts` / `instrumentation-client.ts`, TypeScript strict mode, ESLint `eslint-config-next`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `@sentry/nextjs` dependency |
| `src/instrumentation.ts` | **Create** | Server-side Sentry init + `onRequestError` hook for App Router |
| `src/instrumentation-client.ts` | **Create** | Browser-side Sentry init |
| `src/app/error.tsx` | Modify | Call `Sentry.captureException` in useEffect alongside console.error |
| `next.config.ts` | Modify | Wrap with `withSentryConfig` (source map upload optional) |
| `src/lib/inngest/with-sentry.ts` | **Create** | `withSentryCapture` utility for Inngest function error reporting |
| `src/lib/inngest/functions/categorize-photo.ts` | Modify | Wrap handler body with `withSentryCapture` |
| `src/lib/inngest/functions/create-stripe-customer.ts` | Modify | Wrap handler body with `withSentryCapture` |
| `src/lib/inngest/functions/send-email.ts` | Modify | Wrap handler body with `withSentryCapture` |
| `src/lib/inngest/functions/notify-provider-assignment.ts` | Modify | Wrap handler body with `withSentryCapture` |
| `src/lib/inngest/functions/bill-on-demand-order.ts` | Modify | Wrap handler body with `withSentryCapture` |
| `src/lib/inngest/functions/seasonal-rotation-reminders.ts` | Modify | Wrap handler body with `withSentryCapture` |
| `src/app/api/_sentry-test/route.ts` | **Create** | Dev-only smoke test endpoint (gated by `SEED_TOOLS_ENABLED`) |
| `.env.example` | Modify | Add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_VERCEL_ENV` |

---

## Task 1: Install @sentry/nextjs

**Files:**
- Modify: `package.json`

**Background:** No `@sentry/*` packages exist yet. We pin `^10.56.0` (latest, compatible with Next.js 16, React 19).

- [ ] **Step 1: Install the package**

```bash
npm install @sentry/nextjs@^10.56.0
```

Expected: package-lock.json updated, `@sentry/nextjs` appears in `package.json` dependencies.

- [ ] **Step 2: Verify no install errors**

```bash
npm run verify
```

Expected: clean. (Nothing uses Sentry yet — just confirming the install didn't break TypeScript resolution.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(sentry): install @sentry/nextjs"
```

---

## Task 2: Create server instrumentation file

**Files:**
- Create: `src/instrumentation.ts`

**Background:** Next.js 16 calls `register()` from `instrumentation.ts` once at server startup (Node.js runtime). `onRequestError` is the App Router hook for capturing server-side errors (route handlers, server actions, server components). Dynamic imports inside `register()` ensure the correct Sentry build is loaded per runtime. When `SENTRY_DSN` is not set, `Sentry.init({ dsn: undefined })` is a documented no-op.

- [ ] **Step 1: Create the file**

Create `src/instrumentation.ts` with this exact content:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    })
  }
}

export async function onRequestError(
  err: Error,
  _request: { path: string; method: string; headers: Record<string, string> },
  _context: { routerKind: string; routeType: string; routePath: string }
): Promise<void> {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureException(err)
}
```

**Why dynamic imports:** avoids loading the full Sentry Node.js bundle in the edge runtime, where it's unsupported.

**Why `_request` / `_context` prefixes:** the ESLint `@typescript-eslint/no-unused-vars` rule is set to `warn` for vars; prefixing prevents that warning while preserving the correct `onRequestError` signature that Next.js requires.

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/instrumentation.ts
git commit -m "feat(sentry): add server instrumentation and onRequestError hook"
```

---

## Task 3: Create client instrumentation file

**Files:**
- Create: `src/instrumentation-client.ts`

**Background:** Next.js 15+ executes `instrumentation-client.ts` in the browser before any page JS. This is the modern replacement for importing init code in root layout. Session Replay is explicitly disabled (`replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0`) — it captures user interactions which could include PII from form fields. When `NEXT_PUBLIC_SENTRY_DSN` is undefined, Sentry no-ops gracefully.

- [ ] **Step 1: Create the file**

Create `src/instrumentation-client.ts` with this exact content:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
})
```

**`NEXT_PUBLIC_VERCEL_ENV`:** Vercel provides `VERCEL_ENV` server-side only. To tag client events with the deployment environment (production / preview / development), the founder must add `NEXT_PUBLIC_VERCEL_ENV` as a Vercel environment variable (value: `production` on prod, `preview` on preview, `development` locally). See `.env.example`. Falls back to `process.env.NODE_ENV` if absent.

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/instrumentation-client.ts
git commit -m "feat(sentry): add client instrumentation"
```

---

## Task 4: Wire Sentry into the error boundary

**Files:**
- Modify: `src/app/error.tsx`

**Background:** App Router error boundaries (`error.tsx`) catch errors before they reach Sentry's global browser handlers, so they must explicitly call `Sentry.captureException`. This is the only place in client code that needs an explicit capture call — all other client errors propagate to Sentry automatically via the global handler set up in `instrumentation-client.ts`.

- [ ] **Step 1: Add the Sentry import and capture call**

In `src/app/error.tsx`, add the Sentry import after the existing imports, and add `Sentry.captureException(error)` to the `useEffect`. The updated top section:

```typescript
'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { buttonVariants } from '@/components/ui/button'
```

And the updated `useEffect`:

```typescript
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
```

(Remove the `console.error(error)` line — it adds no value once Sentry is capturing the error.)

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/error.tsx
git commit -m "feat(sentry): capture client errors from App Router error boundary"
```

---

## Task 5: Wrap next.config.ts with withSentryConfig

**Files:**
- Modify: `next.config.ts`

**Background:** `withSentryConfig` enables two things: (1) automatic injection of the Sentry webpack plugin for source map upload, and (2) SDK features that require build-time hooks. Source map upload is skipped when `SENTRY_AUTH_TOKEN` is absent — this ensures local builds and CI without the token don't fail. `silent: true` suppresses the Sentry build plugin's console output so it doesn't pollute `next build` logs. The existing `images.remotePatterns` config is preserved exactly.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `next.config.ts`:

```typescript
import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: clean. If TypeScript complains about `withSentryConfig` return type not matching `NextConfig`, that's a type widening issue — see concern note below.

> **If verify fails with type error on `export default withSentryConfig(...)`:** The Sentry plugin may return a widened config type. Fix by adding an explicit cast:
> ```typescript
> export default withSentryConfig(nextConfig, { ... }) as NextConfig
> ```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(sentry): wrap next.config.ts with withSentryConfig"
```

---

## Task 6: Create Inngest Sentry capture utility

**Files:**
- Create: `src/lib/inngest/with-sentry.ts`

**Background:** Inngest internally catches function errors for retry logic, so errors thrown inside Inngest handlers never reach Sentry's global unhandled-error handler. `withSentryCapture` wraps a function body, captures any thrown error with the Inngest function ID as a tag, then re-throws so Inngest can still manage retries. This is the single place that provides Sentry coverage for all background jobs.

- [ ] **Step 1: Create the utility file**

Create `src/lib/inngest/with-sentry.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

export async function withSentryCapture<T>(
  fn: () => Promise<T>,
  functionId: string
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    Sentry.withScope((scope) => {
      scope.setTag('inngest.function_id', functionId)
      scope.setContext('inngest', { functionId })
      Sentry.captureException(err)
    })
    throw err
  }
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/inngest/with-sentry.ts
git commit -m "feat(sentry): add withSentryCapture utility for Inngest functions"
```

---

## Task 7: Apply withSentryCapture to all 6 Inngest functions

**Files:**
- Modify: `src/lib/inngest/functions/categorize-photo.ts`
- Modify: `src/lib/inngest/functions/create-stripe-customer.ts`
- Modify: `src/lib/inngest/functions/send-email.ts`
- Modify: `src/lib/inngest/functions/notify-provider-assignment.ts`
- Modify: `src/lib/inngest/functions/bill-on-demand-order.ts`
- Modify: `src/lib/inngest/functions/seasonal-rotation-reminders.ts`

**Background:** Each function needs the same two-line change: add the import and wrap the handler's return value. The pattern for every file is identical:

```
// Add this import alongside existing imports:
import { withSentryCapture } from '@/lib/inngest/with-sentry'

// Inside the function handler, wrap the entire body:
async ({ event }) => {
  return withSentryCapture(async () => {
    // ... existing function body, unchanged ...
  }, '<function-id-string>')
}
```

The function ID string must match the `id:` field in the function's `createFunction` call exactly.

- [ ] **Step 1: Update categorize-photo.ts**

Read `src/lib/inngest/functions/categorize-photo.ts`. Add the import:
```typescript
import { withSentryCapture } from '@/lib/inngest/with-sentry'
```

The handler's outer async function currently starts like:
```typescript
  async ({ event }: { event: { data: { itemId: string; photoId: string; storagePath: string } } }) => {
```

Wrap the entire existing body in `return withSentryCapture(async () => { ... }, 'categorize-photo')`. The function id is `'categorize-photo'` (from `id: 'categorize-photo'` in `createFunction`).

Concretely, the handler becomes:
```typescript
  async ({ event }: { event: { data: { itemId: string; photoId: string; storagePath: string } } }) => {
    return withSentryCapture(async () => {
      // PASTE THE ENTIRE EXISTING FUNCTION BODY HERE — do not change anything inside it
    }, 'categorize-photo')
  }
```

- [ ] **Step 2: Update create-stripe-customer.ts**

Same pattern. Function id: `'create-stripe-customer'`.

```typescript
import { withSentryCapture } from '@/lib/inngest/with-sentry'
```

Wrap:
```typescript
  async ({ event }: ...) => {
    return withSentryCapture(async () => {
      // PASTE EXISTING BODY
    }, 'create-stripe-customer')
  }
```

- [ ] **Step 3: Update send-email.ts**

Function id: `'send-email'`.

```typescript
import { withSentryCapture } from '@/lib/inngest/with-sentry'
```

Wrap:
```typescript
  async ({ event }: { event: { data: SendEmailEventData } }) => {
    return withSentryCapture(async () => {
      await sendEmail(event.data)
    }, 'send-email')
  }
```

- [ ] **Step 4: Update notify-provider-assignment.ts**

Function id: `'notify-provider-assignment'`.

```typescript
import { withSentryCapture } from '@/lib/inngest/with-sentry'
```

Wrap — the handler's outer `async ({ event }) => {` body goes inside `withSentryCapture`.

- [ ] **Step 5: Update bill-on-demand-order.ts**

Function id: `'bill-on-demand-order'`.

```typescript
import { withSentryCapture } from '@/lib/inngest/with-sentry'
```

Wrap — same pattern.

- [ ] **Step 6: Update seasonal-rotation-reminders.ts**

Function id: `'seasonal-rotation-reminders'`.

```typescript
import { withSentryCapture } from '@/lib/inngest/with-sentry'
```

Note: this function's handler has no `event` argument (`async () => { ... }`). The wrap is:
```typescript
  async () => {
    return withSentryCapture(async () => {
      // EXISTING BODY
    }, 'seasonal-rotation-reminders')
  }
```

- [ ] **Step 7: Verify**

```bash
npm run verify
```

Expected: clean across all 6 files.

- [ ] **Step 8: Commit**

```bash
git add src/lib/inngest/functions/
git commit -m "feat(sentry): wrap all Inngest functions with withSentryCapture"
```

---

## Task 8: Add smoke test route

**Files:**
- Create: `src/app/api/_sentry-test/route.ts`

**Background:** Lets the founder confirm end-to-end Sentry capture without deploying a real error. Gated by `SEED_TOOLS_ENABLED=true` (same gate as seed/reset tools) — never accessible in production where that var is absent. Returns 404 in prod so it's not discoverable. To verify: set `SEED_TOOLS_ENABLED=true` locally or on staging, visit `/api/_sentry-test`, and check Sentry for a `[LLV] Sentry smoke test` error. To remove later: delete the `src/app/api/_sentry-test/` directory.

- [ ] **Step 1: Create the route**

Create `src/app/api/_sentry-test/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.SEED_TOOLS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  throw new Error('[LLV] Sentry smoke test — intentional server error from /api/_sentry-test')
}
```

- [ ] **Step 2: Verify**

```bash
npm run verify
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/_sentry-test/
git commit -m "feat(sentry): add SEED_TOOLS_ENABLED-gated smoke test route"
```

---

## Task 9: Update .env.example and run final verify

**Files:**
- Modify: `.env.example`

**Background:** Add the 6 new Sentry-related env vars. `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_VERCEL_ENV` are public (browser-accessible). `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` are server-only build-time vars — never prefix them with `NEXT_PUBLIC_`. All Sentry vars are optional at runtime (graceful no-op) but required in the Vercel production project for monitoring to work.

- [ ] **Step 1: Add Sentry section to .env.example**

Open `.env.example`. After the Anthropic section and before the Twilio section, add:

```bash
# ─── Sentry (error monitoring) ───────────────────────────────────────────────
# Required in Vercel prod/preview for error monitoring to work; absent = no-op.
NEXT_PUBLIC_SENTRY_DSN=              # public; from Sentry project → Client Keys
SENTRY_DSN=                          # server-only; same value as NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_VERCEL_ENV=              # optional; set to VERCEL_ENV value in Vercel env settings (production/preview/development)
# Build-time only — set in Vercel project settings, not at runtime:
SENTRY_AUTH_TOKEN=                   # server-only; enables source map upload (optional)
SENTRY_ORG=                          # server-only; your Sentry org slug
SENTRY_PROJECT=                      # server-only; your Sentry project slug
```

- [ ] **Step 2: Run verify without DSN**

Confirm build is clean with no Sentry env vars set locally:

```bash
npm run verify
```

Expected: clean. Sentry no-ops when DSN is undefined.

- [ ] **Step 3: Run verify with a fake DSN**

```bash
NEXT_PUBLIC_SENTRY_DSN=https://fake@o0.ingest.sentry.io/0 SENTRY_DSN=https://fake@o0.ingest.sentry.io/0 npm run verify
```

Expected: clean. TypeScript and ESLint should not be affected by env vars.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "docs(env): add Sentry vars to .env.example"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Founder Dashboard Steps (not code — done in Sentry UI + Vercel)

After code is merged and deployed:

1. **Create Sentry project:**
   - Go to sentry.io → New Project → Next.js
   - Name: `luxury-lifestyle-vault`
   - Copy the DSN from Project Settings → Client Keys

2. **Set Vercel environment variables:**
   - In Vercel project → Settings → Environment Variables, add for **Production** and **Preview** environments:
     - `NEXT_PUBLIC_SENTRY_DSN` = _(DSN from step 1)_
     - `SENTRY_DSN` = _(same DSN)_
     - `NEXT_PUBLIC_VERCEL_ENV` = `production` (for Production env) and `preview` (for Preview env)
   - For source map upload (optional, run once per deploy):
     - `SENTRY_AUTH_TOKEN` = _(from Sentry → Settings → Auth Tokens)_
     - `SENTRY_ORG` = _(your org slug)_
     - `SENTRY_PROJECT` = `luxury-lifestyle-vault`

3. **Add alert rule:**
   - In Sentry → Alerts → Create Alert Rule → Issues
   - Condition: `A new issue is created`
   - Filter: `Environment = production`
   - Action: Send email to `jamesloganmueller@gmail.com`
   - Name: `New prod issue`
   - Save

4. **Smoke test (after deploy):**
   - Temporarily set `SEED_TOOLS_ENABLED=true` in Vercel Preview environment
   - Visit `https://<your-preview-url>/api/_sentry-test`
   - Check Sentry Issues for `[LLV] Sentry smoke test` error tagged `environment: preview`
   - Revert `SEED_TOOLS_ENABLED` if no longer needed on preview

5. **Remove smoke test (before soft launch):**
   - Delete `src/app/api/_sentry-test/` directory
   - Commit and push

---

## Self-Review: Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| Install @sentry/nextjs | Task 1 |
| Client init with NEXT_PUBLIC_SENTRY_DSN | Task 3 |
| Server init + instrumentation.ts register() | Task 2 |
| onRequestError for App Router server errors | Task 2 |
| environment from VERCEL_ENV / NODE_ENV | Tasks 2, 3 |
| tracesSampleRate 0.1 | Tasks 2, 3 |
| sendDefaultPii: false | Tasks 2, 3 |
| Session Replay off | Task 3 (replaysSessionSampleRate: 0) |
| Inngest error capture confirmed | Task 6 + 7 (withSentryCapture wrapper) |
| Inngest function id as tag | Task 6 (scope.setTag) |
| verify clean without DSN | Task 9 step 2 |
| verify clean with DSN | Task 9 step 3 |
| Source map upload optional | Task 5 (sourcemaps.disable: !SENTRY_AUTH_TOKEN) |
| Smoke test gated by SEED_TOOLS_ENABLED | Task 8 |
| New env vars in .env.example | Task 9 |
| Founder dashboard steps | Founder Dashboard Steps section |
| No PII (emails, phone, request bodies) | sendDefaultPii: false + Session Replay off |
