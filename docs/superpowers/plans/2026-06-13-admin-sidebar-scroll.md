# Admin Sidebar Scroll Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/app/(admin)/layout.tsx` so the admin sidebar has a pinned header, a scrollable nav middle, and a pinned footer — keeping Sign out and ThemeToggle always visible no matter how many nav sections are expanded.

**Architecture:** Remove the inner `<div className="flex flex-col h-full">` wrapper and promote the three sidebar regions (header, nav, footer) to direct flex children of `<aside>`. Add `flex-1 min-h-0 overflow-y-auto` to the `<nav>` so it scrolls without displacing the footer. The `<aside>` gets `md:flex-col h-full`; height is owned by the parent `<div className="flex h-screen overflow-hidden">` which is unchanged.

**Tech Stack:** Next.js App Router (Server Component layout), Tailwind CSS v4, Shadcn/UI Base UI

---

### Task 1: Create the feature branch

**Files:**
- No file changes — git only

- [ ] **Step 1: Create and switch to branch**

```bash
git checkout -b fix/admin-sidebar-scroll
```

Expected: `Switched to a new branch 'fix/admin-sidebar-scroll'`

- [ ] **Step 2: Confirm branch**

```bash
git branch --show-current
```

Expected: `fix/admin-sidebar-scroll`

---

### Task 2: Restructure `layout.tsx`

**Files:**
- Modify: `src/app/(admin)/layout.tsx`

The entire `return` block changes. Imports are unchanged.

**Before** (the broken structure — inner wrapper causes unbounded nav growth):

```tsx
return (
  <div className="flex h-screen overflow-hidden">
    <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar flex-shrink-0">
      <div className="flex flex-col h-full py-6 px-4">
        <div className="mb-8 px-3">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            LLV Admin
          </p>
        </div>
        <nav className="flex-1">
          <AdminNav />
        </nav>
        <div className="mt-auto pt-6 border-t border-border flex items-center gap-1 px-1">
          <ThemeToggle />
          <form action={signOut} className="flex-1">
            <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
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
```

- [ ] **Step 1: Replace the return block**

Replace the entire `return (...)` with:

```tsx
return (
  <div className="flex h-screen overflow-hidden">
    <aside className="hidden md:flex md:flex-col h-full w-56 flex-shrink-0 border-r border-border bg-sidebar">
      <div className="shrink-0 border-b border-border px-4 py-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          LLV Admin
        </p>
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <AdminNav />
      </nav>
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
```

**Critical invariant:** `flex-1 min-h-0 overflow-y-auto` sit on `<nav>`, which is a **direct child of `<aside>`**. Do not add any wrapper `<div>` between `<aside>` and `<nav>` — it would break the scroll constraint and reproduce the bug.

---

### Task 3: Verify — ESLint + TypeScript

**Files:**
- No changes — verification only

- [ ] **Step 1: Run verify**

```bash
npm run verify
```

Expected: exits 0 with no ESLint errors or TypeScript errors. If it fails, fix the reported issue before proceeding.

---

### Task 4: Commit

**Files:**
- Commit: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Stage and commit**

```bash
git add src/app/(admin)/layout.tsx
git commit -m "fix(admin): pin sidebar header + footer, scroll nav so sign-out stays visible"
```

Expected: commit created on `fix/admin-sidebar-scroll`.

---

### Task 5: Push and open PR

**Files:**
- No file changes — git + GitHub only

- [ ] **Step 1: Push branch**

```bash
git push -u origin fix/admin-sidebar-scroll
```

- [ ] **Step 2: Open PR**

```bash
gh pr create \
  --title "fix(admin): pin sidebar header + footer, scroll nav so sign-out stays visible" \
  --body "$(cat <<'EOF'
## Summary

- Removes the inner `<div className="flex flex-col h-full">` wrapper from the admin sidebar
- Promotes header, nav, and footer to direct flex children of `<aside>`
- Adds `flex-1 min-h-0 overflow-y-auto` to `<nav>` — `min-h-0` is the key fix that lets the flex-1 region shrink and scroll
- ThemeToggle and Sign out are now always visible regardless of how many nav sections are expanded

## Test plan

- [ ] Open the admin dashboard and expand all nav sections — Sign out and ThemeToggle remain visible and reachable at the bottom of the sidebar
- [ ] Collapse all sections — layout looks correct; header and footer are pinned
- [ ] Active-route highlight still works; collapsible sections still toggle
- [ ] Resize to < md breakpoint — sidebar is hidden (no regression)
- [ ] `npm run verify` passes
- [ ] Vercel preview builds and renders correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Note the Vercel preview URL from the PR and QA it**

Open the Vercel preview, navigate to an admin page, expand all nav sections, and confirm Sign out and ThemeToggle remain visible at the bottom.

---

## Self-Review Notes

- **Spec coverage:** All four implementation constraints from the spec are addressed: direct flex child, height ownership (parent keeps `h-screen`), `flex-col` on aside, `shrink-0` on header/footer.
- **No placeholders:** All steps contain exact code or exact commands.
- **Type consistency:** No new types or functions introduced — purely Tailwind class changes.
- **Mobile:** Explicitly out of scope per approved spec. `hidden md:flex` is preserved.
