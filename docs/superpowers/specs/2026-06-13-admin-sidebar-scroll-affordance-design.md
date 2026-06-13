# Design: Admin Sidebar — Hidden Scrollbar + Down-Scroll Affordance

**Date:** 2026-06-13
**Branch:** `fix/admin-sidebar-scroll` (folded into PR #5)
**Builds on:** `docs/superpowers/specs/2026-06-13-admin-sidebar-scroll-design.md` (pinned header/footer already in place)
**Canonical code prompt:** `docs/cowork/2026-06-13/llv_admin_sidebar_scroll_affordance.md`

---

## Problem

The nav scroll region from PR #5 shows a native scrollbar (ugly on a luxury UI) and gives no visual cue that more content exists below the viewport. When nav sections are expanded enough to overflow, the user has no affordance prompting them to scroll — they may not realize Sign out is just a scroll away.

## Goal

Two additions to the admin sidebar nav region:

1. **Hide the native scrollbar** while keeping full scroll functionality (wheel, trackpad, keyboard).
2. **A floating down-chevron** that appears only when scrollable content exists below, sits inside the nav region above the pinned footer, and fades out on reaching the bottom.

Aesthetic: quiet and luxury — a small semi-transparent circular button, not a heavy chrome element.

## Scope

- **Files changed:** `src/app/globals.css`, new `src/components/admin/admin-nav-scroller.tsx`, `src/app/(admin)/layout.tsx`
- **Unchanged:** `src/components/admin/admin-nav.tsx` — no modifications
- **Branch:** `fix/admin-sidebar-scroll` (same PR #5 — no separate branch needed)

---

## Architecture

### Change 1 — `scrollbar-hide` Tailwind v4 utility

Added to `src/app/globals.css` after the `@layer base` block (before the `@media print` block):

```css
@utility scrollbar-hide {
  -ms-overflow-style: none;   /* legacy Edge */
  scrollbar-width: none;      /* Firefox */
  &::-webkit-scrollbar {
    display: none;            /* Chrome/Safari */
  }
}
```

Tailwind v4 uses `@utility` (not `@layer utilities`) for custom utilities. The three vendor-specific rules cover all current browsers.

---

### Change 2 — `AdminNavScroller` component

New file: `src/components/admin/admin-nav-scroller.tsx`

This is a thin `'use client'` wrapper that:
- Owns the scroll container (so it can attach listeners)
- Renders the `<nav>` landmark for a11y (not a plain `<div>`)
- Tracks whether more content exists below and shows/hides the chevron accordingly

**Full component:**

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
    // 8px tolerance so the arrow hides cleanly before the very last pixel
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    recompute()
    el.addEventListener('scroll', recompute, { passive: true })
    // ResizeObserver on BOTH the scroll element and the inner content div.
    // Observing only the scroll element catches viewport resizes but misses
    // collapsible expand/collapse (which changes content height, not container
    // height). Observing contentRef catches those height changes too — this
    // dual observation is the key correctness piece for the AdminNav use case.
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
    // Respect prefers-reduced-motion: instant jump instead of smooth scroll
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ top: Math.round(el.clientHeight * 0.8), behavior: prefersReduced ? 'instant' : 'smooth' })
  }

  return (
    <div className="relative flex-1 min-h-0">
      <nav ref={scrollRef} className={cn('h-full overflow-y-auto scrollbar-hide', className)}>
        <div ref={contentRef}>{children}</div>
      </nav>

      {/* canScrollDown starts false (useState initial value) and is computed
          in useEffect after mount — so the button is absent on first paint,
          which is correct: no SSR/hydration mismatch, and no flash of a
          chevron that might not be needed. This is intentional, not a bug. */}
      <button
        type="button"
        onClick={scrollDown}
        aria-label="Scroll navigation down"
        aria-hidden={!canScrollDown}
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

**Accessibility completeness for the hidden state:**

| Attribute | Purpose |
|---|---|
| `opacity-0` | Visually hidden |
| `pointer-events-none` | Not clickable |
| `tabIndex={-1}` | Removed from tab order |
| `aria-hidden={!canScrollDown}` | Removed from a11y tree — `opacity-0` alone does not do this |

All four are required together; any one missing leaves a partial hole.

---

### Change 3 — Wire into layout

In `src/app/(admin)/layout.tsx`, the existing `<nav>` block is replaced with `AdminNavScroller`. The `flex-1 min-h-0` that previously lived on `<nav>` now lives on the scroller's outer `<div>` — the three-region layout (pinned header / scrollable nav / pinned footer) is structurally unchanged.

**Before:**
```tsx
<nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
  <AdminNav />
</nav>
```

**After:**
```tsx
<AdminNavScroller className="px-4 py-3">
  <AdminNav />
</AdminNavScroller>
```

---

## Key Invariants

1. **Dual ResizeObserver** — `ro.observe(el)` + `ro.observe(contentRef.current)` together. Removing either breaks affordance accuracy on collapsible expand/collapse or viewport resize respectively.
2. **`<nav>` landmark preserved** — the scroller renders `<nav>`, not `<div>`. Don't change this.
3. **`AdminNav` untouched** — the scroller wraps it; `admin-nav.tsx` has zero changes.
4. **Hidden-until-measured is intentional** — `canScrollDown` initialises `false`; the first `recompute()` in `useEffect` sets it correctly after mount. No SSR mismatch.
5. **Full a11y hidden state** — opacity + pointer-events + tabIndex + aria-hidden all set when not scrollable.
6. **Reduced motion** — `scrollBy` uses `behavior: 'instant'` when `prefers-reduced-motion: reduce` is set.

---

## Optional Polish (evaluate at QA)

A `pointer-events-none` gradient overlay above the footer — e.g. `from-transparent to-background/40` — can reinforce "more below." Skip if it fights the Obsidian & Ivory theme. Not required for acceptance.

---

## Acceptance Criteria

- Admin nav scrolls with no visible scrollbar in Chrome, Safari, and Firefox.
- Down-chevron appears centered above the footer when content overflows; absent when it doesn't.
- Chevron fades out at the scroll bottom; reappears on scrolling back up.
- Expanding or collapsing a nav section correctly updates chevron visibility (ResizeObserver path).
- Chevron click smooth-scrolls down ~80% of the nav height; instant-jumps if `prefers-reduced-motion` is set.
- Pinned header and footer are unaffected.
- `npm run verify` passes. Vercel preview build passes.
