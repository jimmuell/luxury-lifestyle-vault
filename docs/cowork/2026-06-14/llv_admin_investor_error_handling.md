# Code Prompt — Consistent error handling for admin investor pages

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-14
**Canonical location:** `docs/cowork/2026-06-14/llv_admin_investor_error_handling.md` (this file). Authored by Cowork; kept in the repo per the Source-of-Truth Map.
**Branch:** create `fix/admin-investor-error-handling` off `main`.
**Workflow:** feature branch → push → PR → CI (`verify` + `build`) → Vercel preview → QA → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit out of credits — self-review.)

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-14/llv_admin_investor_error_handling.md`, create that folder and save this prompt there verbatim, then proceed.

## Background

The investor admin pages handle Supabase query errors inconsistently — a latent trap exposed when migrations 035–040 were unapplied:

- `/admin/faq` (`src/app/(admin)/admin/faq/page.tsx`) destructures `error` and **`throw`s** → white-screens the whole admin route via the error boundary.
- `/admin/updates`, `/admin/ctas` **ignore the error** (`const { data } = ...`) and render `data ?? []` → a real DB failure looks identical to a legitimately empty list.
- `/admin/investor-config` ignores the error and falls back to `DEFAULT_WELCOME_*` → a read failure silently shows defaults as if they were saved values.

## Goal

One sensible, consistent behavior across these pages: a query **error** renders a visible inline error state (page still usable, sidebar intact); a genuinely **empty** result still renders the normal empty state. Never white-screen, never silently hide a failure.

## 1. Add a shared inline-error component

Create `src/components/admin/load-error.tsx`:

```tsx
import { AlertTriangle } from 'lucide-react'

export function AdminLoadError({ area, message }: { area: string; message?: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-10 text-center">
      <AlertTriangle className="mx-auto h-5 w-5 text-destructive" />
      <p className="mt-2 text-sm font-medium text-destructive">Couldn't load {area}.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {message ?? 'Please refresh, or check that database migrations are applied.'}
      </p>
    </div>
  )
}
```

## 2. Apply the pattern to each page

Keep all existing auth redirects unchanged. For each page, capture the query `error`, and in the render branch show `<AdminLoadError>` when `error` is truthy.

**`src/app/(admin)/admin/faq/page.tsx`** — remove the `if (faqError) throw new Error(...)` line entirely. Keep `const { data: entries, error: faqError } = await admin...`. In the results container, branch:

```tsx
{faqError ? (
  <AdminLoadError area="FAQ entries" message={faqError.message} />
) : (entries ?? []).length > 0 ? (
  /* existing <table> ... */
) : (
  /* existing "No FAQ entries yet" empty state */
)}
```

**`src/app/(admin)/admin/updates/page.tsx`** and **`src/app/(admin)/admin/ctas/page.tsx`** — change `const { data: X } = await admin...` to `const { data: X, error } = await admin...`, then wrap the table/empty-state block so `error` renders `<AdminLoadError area="investor updates" message={error.message} />` (or `"investor CTAs"`) instead.

**`src/app/(admin)/admin/investor-config/page.tsx`** — capture `error` from the query. If `error` is truthy, render the page header + `<AdminLoadError area="the welcome panel config" message={error.message} />` instead of the form (don't let the admin edit/overwrite config they couldn't read). If there's no error, keep the current behavior — `config?.welcome_* ?? DEFAULT_*` (a null row with no error is legitimate first-run state, not an error).

**Also check** `src/app/(admin)/admin/investors/page.tsx` and `src/app/(admin)/admin/presentations/page.tsx`: if either ignores its query error or throws, apply the same `<AdminLoadError>` pattern for consistency. If they already handle errors sensibly, leave them.

## Do NOT touch

- Auth/role redirect logic at the top of each page.
- The legitimate empty states (these stay for the no-rows-but-no-error case).
- Server actions in `src/actions/admin-faq.ts` etc. (they already return `{ error }`); this task is read-path rendering only.
- The local dev server — founder owns it. Verify with `npm run verify`.

## Acceptance criteria

1. `npm run verify` passes; `npm run build` succeeds.
2. No admin investor page uses `throw` for a query error; none silently swallow one.
3. With tables present (current state), all five pages render their normal empty/data states — no regression.
4. Code review confirms: when a query returns `error`, the page renders `<AdminLoadError>` (visible message) while keeping the admin layout/sidebar usable; a no-rows result still shows the normal empty state.

## Commit / PR

Commit `fix(admin): consistent inline error handling on investor pages`. Open a PR against `main`, let CI + Vercel preview run, self-review, hand the preview URL back for QA. Do not auto-merge.
