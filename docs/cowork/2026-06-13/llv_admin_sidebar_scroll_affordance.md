# Code Prompt — Admin sidebar: hide scrollbar + down-arrow scroll affordance

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-13
**Canonical location:** `docs/cowork/2026-06-13/llv_admin_sidebar_scroll_affordance.md` (this file).
**Builds on:** `docs/cowork/2026-06-13/llv_admin_sidebar_header_footer.md` (PR #5 / branch `fix/admin-sidebar-scroll`). The pinned-header/scrollable-nav/pinned-footer structure is already in place.
**Branch:** PR #5 is **not yet merged**, so add this to the **same branch** `fix/admin-sidebar-scroll` (one PR, one preview to QA). If you'd rather ship #5's minimal fix first, branch `feat/admin-sidebar-scroll-affordance` off `main` after #5 merges — author's preference is to fold it into #5.
**Workflow:** push → PR (already open as #5) → CI (`verify` + `build`) → Vercel preview → QA → squash-merge → delete branch. Do **not** auto-merge. (CodeRabbit is out of credits — self-review.)

## Step 0 — File this prompt in the repo (do this first)

If this file is not already at `docs/cowork/2026-06-13/llv_admin_sidebar_scroll_affordance.md`, create the folder if needed and save it there verbatim, then proceed.

## Goal

In the admin sidebar nav (the scroll region from PR #5), two changes:

1. **Hide the visible scrollbar** while keeping the region scrollable (wheel / trackpad / keyboard still work).
2. **Add a subtle floating down-chevron** centered near the bottom of the nav that appears **only when there is more content below**, scrolls the nav down when clicked, and fades out once you reach the bottom. It must sit inside the nav region (above the pinned footer), not overlap the footer.

Luxury aesthetic: the affordance should be quiet — a small, semi-transparent circular button with a `ChevronDown`, not a heavy control.

## Repo facts (already confirmed — don't re-investigate)

- Styling is **Tailwind v4** (`src/app/globals.css` uses `@import "tailwindcss"`, `@custom-variant`, `@theme inline`, `@layer base`). Custom utilities are added with `@utility`. There is **no** existing `scrollbar-hide` utility.
- `AdminNav` (`src/components/admin/admin-nav.tsx`) is already a **client component** (Base UI `Collapsible`); its sections expand/collapse, which **changes content height** — the arrow-visibility logic must react to that, not just to scroll events.
- `cn` helper is at `@/lib/utils`. Icons from `lucide-react` (`ChevronDown`).
- The nav currently lives in `src/app/(admin)/layout.tsx` (a **server** component) as:
  ```tsx
  <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
    <AdminNav />
  </nav>
  ```

## Change 1 — `scrollbar-hide` utility (Tailwind v4)

Add to `src/app/globals.css` (near the other custom utilities / after the `@layer base` block):

```css
@utility scrollbar-hide {
  -ms-overflow-style: none;   /* legacy Edge */
  scrollbar-width: none;      /* Firefox */
  &::-webkit-scrollbar {
    display: none;            /* Chrome/Safari */
  }
}
```

## Change 2 — client scroller component with the down-arrow

New file `src/components/admin/admin-nav-scroller.tsx`. It owns the scroll container (so it can track position) and keeps the `<nav>` landmark for a11y:

```tsx
'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNavScroller({ children, className }: { children: ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const recompute = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // 8px tolerance so the arrow hides cleanly at the bottom
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    recompute()
    el.addEventListener('scroll', recompute, { passive: true })
    // ResizeObserver catches both viewport resizes and collapsible expand/collapse
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    if (contentRef.current) ro.observe(contentRef.current)
    return () => {
      el.removeEventListener('scroll', recompute)
      ro.disconnect()
    }
  }, [recompute])

  const scrollDown = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ top: Math.round(el.clientHeight * 0.8), behavior: 'smooth' })
  }

  return (
    <div className="relative flex-1 min-h-0">
      <nav ref={scrollRef} className={cn('h-full overflow-y-auto scrollbar-hide', className)}>
        <div ref={contentRef}>{children}</div>
      </nav>

      <button
        type="button"
        onClick={scrollDown}
        aria-label="Scroll navigation down"
        tabIndex={canScrollDown ? 0 : -1}
        className={cn(
          'absolute bottom-2 left-1/2 -translate-x-1/2 grid h-8 w-8 place-items-center rounded-full',
          'border border-border bg-background/80 text-muted-foreground shadow-sm backdrop-blur',
          'transition-opacity duration-200 hover:text-foreground',
          canScrollDown ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}
```

## Change 3 — wire it into the layout

In `src/app/(admin)/layout.tsx`, import `AdminNavScroller` and replace the `<nav>…</nav>` block with:

```tsx
<AdminNavScroller className="px-4 py-3">
  <AdminNav />
</AdminNavScroller>
```

The `flex-1 min-h-0` that used to be on `<nav>` now lives on the scroller's outer wrapper (already in the component), so the three-region layout (header / scroller / footer) is preserved exactly. The header and footer regions are untouched.

## Notes / guardrails

- Keep the `<nav>` landmark (the component renders one) — don't drop it to a plain `div`.
- Don't change `AdminNav` itself; the scroller wraps it.
- The arrow is **decorative/assistive** — all existing scroll inputs (wheel, trackpad, arrow keys, Page Up/Down, focus-scroll on tab) must still work with the scrollbar hidden.
- Optional polish (only if quick and it looks right): a faint bottom fade (a small `pointer-events-none` gradient overlay) behind the arrow to reinforce "more below." Skip if it fights the theme.

## Done (acceptance)

- The admin nav scrolls with **no visible scrollbar** (verify Chrome + Safari + Firefox if available; at minimum the project's primary browser).
- When sections are expanded enough to overflow, a small down-chevron appears centered near the bottom of the nav, **above** the pinned footer; clicking it smooth-scrolls down.
- The chevron **fades out at the bottom** and reappears when scrolled back up; expanding/collapsing a section updates its visibility (ResizeObserver path).
- Header "LLV Admin" and the footer (theme toggle + sign out) stay pinned; only the nav scrolls.
- `verify` + `build` pass; QA on the Vercel preview.

## Commit

- On `fix/admin-sidebar-scroll`: `feat(admin): hide sidebar scrollbar and add down-scroll affordance`.
