# Code Prompt — Admin sidebar: add an "Investor" group, slim "People"

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-14
**Canonical location:** `docs/cowork/2026-06-14/llv_admin_sidebar_investor_group.md` (this file). Authored by Cowork; kept in the repo per the Source-of-Truth Map.
**Branch:** create `feat/admin-sidebar-investor-group` off `main`.
**Workflow:** feature branch → push → PR → CI (`verify` + `build`) → Vercel preview → QA → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit out of credits — self-review.)

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-14/llv_admin_sidebar_investor_group.md`, create that folder and save this prompt there verbatim, then proceed.

## Problem

In the admin sidebar, the **People** group is overloaded: it holds actual people (Clients, Providers, Investors) plus all the investor-portal content surfaces (Presentations, FAQ, Updates, Welcome Panel, CTAs). Investor admin is scattered and People is hard to scan.

## Goal

Split the investor-related items into their own collapsible **Investor** group, leaving **People** as just Clients + Providers. No behavior changes beyond the regrouping — the collapsible/persistence logic already derives from the group list.

## Where

Single file: `src/components/admin/admin-nav.tsx` — only the `NAV_GROUPS` array. All icons used are already imported (`LineChart`, `Presentation`, `Newspaper`, `HelpCircle`, `SlidersHorizontal`, `MousePointerClick`); no new imports needed.

## Change

Replace the current **People** group:

```tsx
  {
    label: 'People',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/providers', label: 'Providers', icon: Building2 },
      { href: '/admin/investors', label: 'Investors', icon: LineChart },
      { href: '/admin/presentations', label: 'Presentations', icon: Presentation },
      { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
      { href: '/admin/updates', label: 'Updates', icon: Newspaper },
      { href: '/admin/investor-config', label: 'Welcome Panel', icon: SlidersHorizontal },
      { href: '/admin/ctas', label: 'CTAs', icon: MousePointerClick },
    ],
  },
```

with these two groups (People first, then Investor immediately after):

```tsx
  {
    label: 'People',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/providers', label: 'Providers', icon: Building2 },
    ],
  },
  {
    label: 'Investor',
    items: [
      { href: '/admin/investors', label: 'Investors', icon: LineChart },
      { href: '/admin/presentations', label: 'Presentations', icon: Presentation },
      { href: '/admin/updates', label: 'Updates', icon: Newspaper },
      { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
      { href: '/admin/investor-config', label: 'Welcome Panel', icon: SlidersHorizontal },
      { href: '/admin/ctas', label: 'CTAs', icon: MousePointerClick },
    ],
  },
```

## Do NOT touch

- Any other group (Operations, Finance, Configuration, System) or the Overview item.
- The collapsible logic, `COLLAPSIBLE_LABELS`, `getActiveGroupLabel`, localStorage key, or persistence code — it derives from `NAV_GROUPS` and handles the new group automatically.
- Routes/pages themselves — this is sidebar grouping only; no hrefs change.
- The local dev server — founder owns it. Verify with `npm run verify`.

## Acceptance criteria

1. `npm run verify` passes; `npm run build` succeeds.
2. Sidebar shows **People** (Clients, Providers) and a new **Investor** group (Investors, Presentations, Updates, FAQ, Welcome Panel, CTAs) directly below it.
3. New group collapses/expands and persists its state like the others; navigating to any investor route auto-expands and highlights the Investor group.
4. No other group changed; all links resolve to their existing pages.

## Commit / PR

Commit `feat(admin): split investor items into their own sidebar group`. Open a PR against `main`, let CI + Vercel preview run, self-review, hand the preview URL back for QA. Do not auto-merge.
