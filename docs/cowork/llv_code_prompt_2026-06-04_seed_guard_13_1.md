# Code Prompt — 13.1 Seed/reset production guard (CRITICAL security fix)

**Date:** 2026-06-04
**Author:** Cowork
**For:** Claude Code
**Priority:** CRITICAL — implements Launch Plan §13.1. Destructive seed/reset operations are currently reachable in production.

## The vulnerability (from the live code, not just the plan)

1. **`src/app/(admin)/admin/seed-data/page.tsx` has no environment gate.** Its yellow box *claims* it's "gated by `NEXT_PUBLIC_ENABLE_SEED_TOOLS=true`," but the component checks nothing — it renders `<SeedRunner />` unconditionally. Any admin reaches the seed tools in any environment.
2. **In `src/actions/seed.ts`, the most destructive server actions have no environment guard at all** — `runAllSeeds()`, `runSeedScript()`, and `clearAllSeeds()` (which deletes via the service-role `createAdminClient()`) are protected only by `requireAdmin()`. A logged-in admin (or a compromised admin session, or a hand-crafted server-action request) could seed or wipe data in production.
3. **The two actions that *are* gated** — `clearAllTestAccounts()` and `previewTestAccountCleanup()` — gate on `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`, a **client-exposed** variable (inlined into the browser bundle). A `NEXT_PUBLIC_*` flag must never be the security boundary for destructive operations, and it's also a different name than the page claims.

## The fix — a single server-only allow-flag, default-deny, enforced server-side

Introduce one **server-only** environment variable, **`SEED_TOOLS_ENABLED`** (NO `NEXT_PUBLIC_` prefix, so it never enters the client bundle and can't be read or flipped from the browser). Default behavior is **deny**: seed/reset tools work only where this flag is explicitly `'true'`.

> ⚠️ **Do NOT gate on `NODE_ENV` or `VERCEL_ENV === 'production'`.** LLV's current Vercel deployment is the *test* environment but runs as Vercel "Production" (`NODE_ENV=production`, `VERCEL_ENV=production`) — this is the exact trap that broke demo gating before (Bug #18). The guard must be the explicit `SEED_TOOLS_ENABLED` allow-flag only, set on test/staging and absent in the real production project.

### 1. Server guard helper (`src/actions/seed.ts`)

Add alongside `requireAdmin()`:

```ts
function requireSeedToolsEnabled() {
  if (process.env.SEED_TOOLS_ENABLED !== 'true') {
    throw new Error('Seed tools are disabled in this environment.')
  }
}
```

### 2. Apply it to EVERY destructive / mutating action in `seed.ts`

Call **both** `await requireAdmin()` and `requireSeedToolsEnabled()` (admin auth + environment guard = defense in depth) at the top of:
- `runSeedScript`
- `runAllSeeds`
- `clearAllSeeds`
- `clearAllTestAccounts`
- `previewTestAccountCleanup`
- `fetchNextSeedPhoto` (it writes photo data)

**Remove** the `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` checks from `clearAllTestAccounts` and `previewTestAccountCleanup` — they're replaced by `requireSeedToolsEnabled()`. (`getSeedStatus` is read-only counts; add `requireSeedToolsEnabled()` to it too for consistency since it's part of the same tool surface, but keep `requireAdmin()`.)

### 3. Gate the page server-side (`src/app/(admin)/admin/seed-data/page.tsx`)

It's a server component, so it can read the server-only flag. At the top:

```ts
import { notFound } from 'next/navigation'
// ...
export default function SeedDataPage() {
  if (process.env.SEED_TOOLS_ENABLED !== 'true') notFound()
  // ...
}
```

So the page 404s anywhere the flag isn't set (incl. production), instead of rendering the tools. Also **fix the misleading copy**: the warning box should reference `SEED_TOOLS_ENABLED` (server-only), not `NEXT_PUBLIC_ENABLE_SEED_TOOLS`.

### 4. Hide the sidebar link when disabled (nice-to-have)

The admin sidebar (`src/components/admin/admin-nav.tsx`) lists "Seed Data". The nav is a client component, so it can't read the server-only flag directly. Either (a) leave the link (clicking it now 404s safely — acceptable), or (b) pass an `seedToolsEnabled` boolean from the server `layout.tsx` (which can read `process.env.SEED_TOOLS_ENABLED`) down to `AdminNav` and omit the System→Seed Data item when false. (b) is cleaner; (a) is acceptable if simpler. Your call — the security boundary is the page + actions, not the link.

### 5. Decoupling — keep the two flags distinct

- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` → stays as-is, controls only the **demo-login UI** (the quick-login dropdown / demo buttons on the login page). Cosmetic, fine to be public.
- `SEED_TOOLS_ENABLED` → server-only, the **security boundary** for destructive seed/reset. These are now independent.

### 6. Document the new var

Add `SEED_TOOLS_ENABLED` to `.env.example` (create it if missing) with a comment: server-only; set to `true` ONLY in local/dev/staging; never set in production. (If `.env.example` doesn't exist yet, that's launch-plan item 1.4 — at minimum add this var; a fuller `.env.example` can be a separate task.)

## Founder / deploy steps (call these out in your report)

- **Local:** add `SEED_TOOLS_ENABLED=true` to `.env.local` so the seed page + tools keep working in local dev.
- **Current Vercel test project:** set env var `SEED_TOOLS_ENABLED=true` and redeploy, so seeding keeps working in the test environment.
- **Future production project (Phase 3 cutover):** do NOT set `SEED_TOOLS_ENABLED`. With it unset, the page 404s and every destructive action throws — production is safe by default.

## Acceptance criteria

- With `SEED_TOOLS_ENABLED` unset (or not `'true'`): `/admin/seed-data` returns 404, and calling any of `runSeedScript`, `runAllSeeds`, `clearAllSeeds`, `clearAllTestAccounts`, `previewTestAccountCleanup`, `fetchNextSeedPhoto`, `getSeedStatus` throws "Seed tools are disabled in this environment." — even for an authenticated admin, and even if the request is hand-crafted (guard is server-side in the action).
- With `SEED_TOOLS_ENABLED=true`: the page and all tools work exactly as before for admins.
- No destructive seed/reset action relies on a `NEXT_PUBLIC_*` flag anymore. `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` still controls only the demo-login UI.
- `requireAdmin()` is still enforced everywhere (defense in depth).
- Misleading "NEXT_PUBLIC_ENABLE_SEED_TOOLS" copy on the page is corrected.
- `npm run verify` (ESLint + tsc) clean.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`; the founder will exercise the running app.
- Node **20.19.5** (`.nvmrc`). Never hand-edit `node_modules` (patches are via patch-package now).

## Report back

- Files changed, `npm run verify` result, confirmation that the page 404s + actions throw when the flag is unset and work when it's `'true'`, and a clear restatement of the three env steps (local `.env.local`, current Vercel test project, future prod) so the founder sets the flag correctly.
