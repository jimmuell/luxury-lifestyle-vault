# Design: Admin Sidebar — Pinned Header + Scrollable Nav + Pinned Footer

**Date:** 2026-06-13  
**Branch:** `fix/admin-sidebar-scroll`  
**Status:** Approved  
**Canonical code prompt:** `docs/cowork/2026-06-13/llv_admin_sidebar_header_footer.md`

---

## Problem

The admin sidebar (`src/app/(admin)/layout.tsx`) has grown enough collapsible nav sections that the Sign out button and theme changer are pushed below the viewport when sections are expanded. The root cause: `<nav className="flex-1">` has no `min-h-0` or `overflow-y-auto`, so the nav grows unbounded past the sidebar height and the footer follows it offscreen.

## Scope

- **In scope:** Desktop sidebar only (`hidden md:flex`). Single file change: `src/app/(admin)/layout.tsx`. No changes to `admin-nav.tsx` or any other file.
- **Out of scope:** Mobile admin nav drawer (admin sidebar is currently hidden on mobile; no drawer exists to regress).

---

## Solution

Flatten the current double-nested flex structure into three explicit regions — pinned header, scrollable nav, pinned footer — as direct flex children of the `<aside>`.

### Current structure (broken)

```tsx
<div className="flex h-screen overflow-hidden">
  <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar flex-shrink-0">
    <div className="flex flex-col h-full py-6 px-4">          {/* ← extra wrapper */}
      <div className="mb-8 px-3">LLV Admin</div>
      <nav className="flex-1">                                 {/* ← no min-h-0, no overflow */}
        <AdminNav />
      </nav>
      <div className="mt-auto pt-6 border-t ...">             {/* ← footer pushed offscreen */}
        <ThemeToggle /> <SignOut />
      </div>
    </div>
  </aside>
  <main className="flex-1 overflow-y-auto">...</main>
</div>
```

### Target structure (fixed)

```tsx
<div className="flex h-screen overflow-hidden">               {/* unchanged — owns h-screen */}
  <aside className="hidden md:flex md:flex-col h-full w-56 flex-shrink-0 border-r border-border bg-sidebar">

    {/* 1. Header — pinned top */}
    <div className="shrink-0 border-b border-border px-4 py-4">
      <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">LLV Admin</p>
    </div>

    {/* 2. Nav — ONLY scroll region */}
    <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
      <AdminNav />
    </nav>

    {/* 3. Footer — pinned bottom */}
    <div className="shrink-0 border-t border-border px-4 py-4 flex items-center gap-1">
      <ThemeToggle />
      <form action={signOut} className="flex-1">
        <Button variant="ghost" size="sm" type="submit"
          className="w-full justify-start gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </form>
    </div>

  </aside>
  <main className="flex-1 overflow-y-auto bg-background">...</main>
</div>
```

---

## Key Implementation Constraints

### 1. `flex-1 min-h-0 overflow-y-auto` must be on the direct flex child of `<aside>`

This is the most important invariant. All three classes must sit on the element that is a **direct child** of the `<aside>` flex container:

- `flex-1` — makes the nav consume all available height between header and footer, pinning the footer to the bottom.
- `min-h-0` — overrides the default `min-height: auto` on flex children; without it, the nav won't shrink below its content size and `overflow-y-auto` appears to do nothing. This is the root cause of the bug.
- `overflow-y-auto` — enables scrolling once `min-h-0` allows shrinking.

**If `AdminNav` gets wrapped in an extra `<div>` between `<aside>` and these classes, the constraint breaks and the bug comes back.** The `<nav>` element is the direct flex child — `AdminNav` renders inside it with no intermediate unconstrained wrapper.

### 2. Height ownership — no double-constraint

- The **parent `<div>`** owns `h-screen overflow-hidden`. Do not remove either class.
- The **`<aside>`** uses `h-full` (100% of the screen-height parent). `h-screen` on the aside would also work (redundant but harmless), but `h-full` is cleaner.

### 3. `flex-col` on the `<aside>`

`hidden md:flex` defaults to `flex-direction: row`. Add `md:flex-col` so the three regions stack vertically (header top, nav middle, footer bottom).

### 4. `shrink-0` on header and footer

Prevents the header and footer from being squashed by the flex layout when the nav needs space.

---

## What Does NOT Change

- `src/components/admin/admin-nav.tsx` — untouched. All collapsible-section logic, icons, active-route highlighting, keyboard and aria attributes remain exactly as-is.
- `<main>` element — untouched.
- The "LLV Admin" text content, styling (`text-[10px] tracking-[0.3em] uppercase text-muted-foreground`), ThemeToggle, and Sign out button/form — moved into the explicit regions, not re-implemented.

---

## Acceptance Criteria

- Admin sidebar shows a pinned header ("LLV Admin") at the top and a pinned footer at the bottom.
- Footer holds ThemeToggle and Sign out; **both are always visible** regardless of how many nav sections are expanded.
- Only the middle nav list scrolls when menu overflows; header and footer do not move.
- Active-route highlight and collapsible sections still work.
- `npm run verify` passes (ESLint + TypeScript).
- Vercel preview build passes.
