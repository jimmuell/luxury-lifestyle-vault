# Code Prompt — Admin sidebar: pinned header + scrollable nav + pinned footer

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-13
**Canonical location:** `docs/cowork/2026-06-13/llv_admin_sidebar_header_footer.md` (this file). Single source of truth for this task — authored by Cowork, kept in the repo per the Source-of-Truth Map.
**Branch:** create `fix/admin-sidebar-scroll` off `main`.
**Workflow:** feature branch → push → PR → CI (`verify` + `build`) → Vercel preview → QA → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit org is out of review credits — self-review carefully.)

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-13/llv_admin_sidebar_header_footer.md`, create that folder and save this prompt there verbatim, then proceed. This keeps the repo as the single canonical home for Cowork prompts.

## Problem

The admin dashboard's left sidebar has grown enough menu items that — even with the collapsible section groups — the **Sign out** control is pushed below the viewport and can't be reached without scrolling the whole page. The theme/color changer and Sign out are the two controls that must always be reachable.

## Goal

Restructure the admin sidebar as a fixed, full-height column with three regions:

1. **Header (pinned, top)** — a title **"LLV Admin"** (include the LLV mark if one is already used in the admin chrome; don't introduce new art otherwise).
2. **Nav (middle — the only scroll region)** — the existing collapsible menu sections; this is the part that scrolls when content overflows.
3. **Footer (pinned, bottom)** — the **theme color changer** and the **Sign out** button.

Header and footer stay visible at all times; only the nav list scrolls. Sign out is always reachable no matter how many sections are added or expanded.

## Where (locate first, don't assume)

Find the admin sidebar / nav component. Likely candidates — confirm against the repo:

- the admin route-group layout, e.g. `src/app/(admin)/admin/layout.tsx` (or wherever the admin layout lives), and/or
- a dedicated component such as `src/components/admin/AdminSidebar.tsx` / `AdminNav.tsx` / `Sidebar.tsx`.

The theme color changer and the Sign out button already exist inside that sidebar today — **move them into the new footer region**, don't re-implement them.

## Layout (Tailwind)

Make the sidebar root a full-height vertical flex; the nav is the flexible, scrollable middle:

```tsx
<aside className="flex h-dvh flex-col border-r bg-[...]">
  {/* Header — fixed */}
  <div className="shrink-0 border-b px-4 py-4">
    <span className="text-lg font-semibold">LLV Admin</span>
  </div>

  {/* Nav — the ONLY scroll region */}
  <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
    {/* existing collapsible section groups, unchanged */}
  </nav>

  {/* Footer — fixed */}
  <div className="shrink-0 space-y-2 border-t px-4 py-3">
    {/* theme color changer */}
    {/* Sign out button */}
  </div>
</aside>
```

Key details:

- **`min-h-0` on the scroll region is required.** A flex child won't shrink below its content size without it, so `overflow-y-auto` appears to do nothing — this is the single most common cause of this exact bug.
- Use **`h-dvh`** (dynamic viewport height) rather than `h-screen` so it behaves correctly with mobile browser chrome. If `dvh` isn't already used anywhere in the codebase, `h-screen` is an acceptable fallback.
- **Don't double-constrain height.** If the admin layout already bounds the sidebar via a parent grid/flex (e.g. a two-column `flex` row with the main content), set the sidebar to `h-full` and make the parent `h-dvh` instead of forcing `h-dvh` on the sidebar itself. Pick whichever matches the existing layout.
- This is a **structural reflow, not a redesign** — preserve existing collapsible-section behavior, icons, active-route highlighting, spacing, and any keyboard / `aria` attributes.

## Mobile

Phase 1b added a mobile nav drawer on the investor side; the admin sidebar may also render as a drawer on small screens. Apply the same header / scroll / footer structure **inside the drawer** so Sign out is reachable on mobile too. Don't regress the existing responsive behavior.

## Done (acceptance criteria)

- Admin sidebar shows a pinned **"LLV Admin"** header at the top and a pinned footer at the bottom.
- The footer holds the theme color changer and the Sign out button; **both are always visible**, regardless of how many nav sections are expanded.
- Only the middle nav list scrolls when the menu overflows; header and footer don't move.
- Works at desktop **and** mobile widths (drawer included); no horizontal scroll; active-route highlight and collapsible sections still work.
- `verify` + `build` pass; verified on the Vercel preview.

## Commit / PR

- Branch `fix/admin-sidebar-scroll` off `main`.
- Suggested commit: `fix(admin): pin sidebar header + footer, scroll nav so sign-out stays visible`.
- Open the PR to `main`; CI gate; QA the preview; squash-merge; delete the branch. Do **not** auto-merge. Report back with the Vercel preview URL.
