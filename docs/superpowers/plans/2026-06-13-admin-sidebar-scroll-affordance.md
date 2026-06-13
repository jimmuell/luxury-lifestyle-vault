# Admin Sidebar Scroll Affordance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the admin sidebar's native scrollbar and add a floating down-chevron that appears only when nav content overflows, fades at the bottom, and stays accurate when collapsible sections expand/collapse.

**Architecture:** A new `AdminNavScroller` client component wraps the existing `AdminNav`, owns the scroll container, and drives chevron visibility via a `ResizeObserver` on both the scroll element and inner content div. A `@utility scrollbar-hide` CSS rule hides the native scrollbar cross-browser. `layout.tsx` swaps its `<nav>` for `<AdminNavScroller>` with no other structural changes.

**Tech Stack:** Next.js App Router, Tailwind CSS v4 (`@utility`), React (`useRef`/`useState`/`useEffect`/`useCallback`), `ResizeObserver`, Lucide React (`ChevronDown`)

---

### Task 1: Add `scrollbar-hide` Tailwind utility

**Files:**
- Modify: `src/app/globals.css` (after line 126 — append after the `@media print` block)

- [ ] **Step 1: Append the utility to the end of `globals.css`**

The file currently ends with a `@media print` block at line 126. Append after it:

```css
@utility scrollbar-hide {
  -ms-overflow-style: none;   /* legacy Edge */
  scrollbar-width: none;      /* Firefox */
  &::-webkit-scrollbar {
    display: none;            /* Chrome/Safari */
  }
}
```

The full file tail after editing should look like:

```css
@media print {
  aside { display: none !important; }
  .print\:hidden { display: none !important; }
}

@utility scrollbar-hide {
  -ms-overflow-style: none;   /* legacy Edge */
  scrollbar-width: none;      /* Firefox */
  &::-webkit-scrollbar {
    display: none;            /* Chrome/Safari */
  }
}
```

**Note:** Tailwind v4 uses `@utility` (not `@layer utilities`) for custom utilities. This is the correct v4 syntax for this project.

- [ ] **Step 2: Verify utility syntax compiles**

```bash
npm run verify
```

Expected: exits 0. If ESLint or TypeScript errors appear, they are unrelated to this step — investigate before proceeding.

---

### Task 2: Create `AdminNavScroller` component

**Files:**
- Create: `src/components/admin/admin-nav-scroller.tsx`

- [ ] **Step 1: Create the file with the complete component**

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
    // height). Observing contentRef catches those height changes — this dual
    // observation is the key correctness piece for the AdminNav use case.
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
      {/* canScrollDown starts false and is set in useEffect after mount —
          the button is absent on first paint (no SSR/hydration mismatch).
          This is intentional. */}
      <nav ref={scrollRef} className={cn('h-full overflow-y-auto scrollbar-hide', className)}>
        <div ref={contentRef}>{children}</div>
      </nav>

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

- [ ] **Step 2: Verify TypeScript accepts the new file**

```bash
npm run verify
```

Expected: exits 0. A common mistake here is forgetting `'use client'` at the top — if you see a hydration or server-component error, that's the cause.

---

### Task 3: Wire `AdminNavScroller` into the admin layout

**Files:**
- Modify: `src/app/(admin)/layout.tsx`

The current file has this import block and nav element (lines 1–8 and 34–36):

```tsx
import { AdminNav } from '@/components/admin/admin-nav'
// ...
<nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
  <AdminNav />
</nav>
```

- [ ] **Step 1: Add the `AdminNavScroller` import**

Add one line to the import block after the existing `AdminNav` import:

```tsx
import { AdminNavScroller } from '@/components/admin/admin-nav-scroller'
```

The full import block becomes:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AuthWatcher } from '@/components/shared/auth-watcher'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdminNavScroller } from '@/components/admin/admin-nav-scroller'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'
```

- [ ] **Step 2: Replace the `<nav>` block with `<AdminNavScroller>`**

Replace:

```tsx
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <AdminNav />
        </nav>
```

With:

```tsx
        <AdminNavScroller className="px-4 py-3">
          <AdminNav />
        </AdminNavScroller>
```

The `flex-1 min-h-0` classes are now on the scroller's internal `<div className="relative flex-1 min-h-0">` — the three-region layout (pinned header / scrollable nav / pinned footer) is structurally preserved. Do not add `flex-1 min-h-0` back to `<AdminNavScroller>` — it would double the constraint.

- [ ] **Step 3: Verify the full file looks correct**

After both edits, the complete `layout.tsx` should be:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AuthWatcher } from '@/components/shared/auth-watcher'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdminNavScroller } from '@/components/admin/admin-nav-scroller'
import { signOut } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex md:flex-col h-full w-56 flex-shrink-0 border-r border-border bg-sidebar">
        <div className="shrink-0 border-b border-border px-4 py-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            LLV Admin
          </p>
        </div>
        <AdminNavScroller className="px-4 py-3">
          <AdminNav />
        </AdminNavScroller>
        <div className="shrink-0 border-t border-border px-4 py-4 flex items-center gap-1">
          <ThemeToggle />
          <form action={signOut} className="flex-1">
            <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
          <AuthWatcher />
          {children}
        </div>
      </main>
    </div>
  )
}
```

---

### Task 4: Final verify + commit + push

**Files:**
- No new changes — verification and git only

- [ ] **Step 1: Run full verify**

```bash
npm run verify
```

Expected: exits 0 with no ESLint or TypeScript errors.

- [ ] **Step 2: Commit all three changed files**

```bash
git add src/app/globals.css src/components/admin/admin-nav-scroller.tsx src/app/\(admin\)/layout.tsx
git commit -m "feat(admin): hide sidebar scrollbar and add down-scroll affordance"
```

- [ ] **Step 3: Push to update PR #5**

```bash
git push
```

PR #5 (`fix/admin-sidebar-scroll`) will update automatically. Vercel will rebuild the preview.

---

## Self-Review

**Spec coverage:**
- ✅ `scrollbar-hide` utility — Task 1
- ✅ `AdminNavScroller` component with scroll listener + dual ResizeObserver — Task 2
- ✅ `canScrollDown` initialises `false` (hidden-until-measured) — present in component code, commented
- ✅ `aria-hidden`, `tabIndex`, `pointer-events-none`, `opacity-0` all set when hidden — Task 2
- ✅ `prefers-reduced-motion` respected — Task 2 `scrollDown`
- ✅ `<nav>` landmark preserved (not swapped to `<div>`) — Task 2
- ✅ `AdminNav` unchanged — Tasks 2 and 3 only wrap/wire it
- ✅ `flex-1 min-h-0` ownership stays correct — Task 3 note
- ✅ Wired into `layout.tsx` — Task 3

**Placeholder scan:** None found. All steps have concrete code or commands.

**Type consistency:** `AdminNavScroller` is defined once in Task 2 and imported by exact name in Task 3. `recompute`, `scrollRef`, `contentRef`, `canScrollDown`, `scrollDown` are all internal to the component and consistent throughout.
