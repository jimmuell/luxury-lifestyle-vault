# Code Prompt — Admin sidebar: collapsible grouped sections

**Date:** 2026-06-04 (rev 2 — collapsible)
**Author:** Cowork
**For:** Claude Code
**Context:** The admin sidebar in `src/app/(admin)/layout.tsx` is a flat list of 15 links with no hierarchy. Reorganize it into one standalone home link plus five **collapsible** labeled groups. Clicking a group header expands/collapses that group's items, with open/closed state remembered across navigations. No routes, hrefs, or pages change — only grouping, rendering, and collapse behavior.

---

## Architecture note

Collapse state is interactive, so the nav must live in a **client component**. The layout (`src/app/(admin)/layout.tsx`) stays a **server component** — it does the Supabase auth + role guard. Extract the nav into a new client component and render it from the layout:

- New file: `src/components/admin/admin-nav.tsx` — `'use client'`, owns the grouped data, collapse state, and rendering.
- `layout.tsx` imports and renders `<AdminNav />` inside the existing `<nav className="flex-1 space-y-1">` slot (replace the current inline `NAV.map(...)`). Keep everything else in the layout unchanged: the `LLV Admin` wordmark, the `aside`/`main` structure, the `ThemeToggle` + `Sign out` footer, and the auth/role guard.

## Target grouping

`Overview` stays a standalone link at the top — **not** collapsible, no header. Then five collapsible groups, in this order:

| Group header | Items (in order) |
|---|---|
| *(none — standalone, not collapsible)* | Overview → `/admin` |
| **Operations** | Orders → `/admin/orders` · Inventory → `/admin/inventory` · Concierge → `/admin/concierge` |
| **People** | Clients → `/admin/clients` · Providers → `/admin/providers` |
| **Finance** | Transactions → `/admin/transactions` · Reports → `/admin/reports` |
| **Configuration** | Service Tiers → `/admin/settings/tiers` · Corridors → `/admin/settings/corridors` · Notifications → `/admin/settings/notifications` · Help Content → `/admin/help` |
| **System** | Audit Log → `/admin/audit` · Email → `/admin/email` · Seed Data → `/admin/seed-data` |

All 15 existing hrefs and their current Lucide icons carry over unchanged — only order, grouping, and collapse behavior change. Reuse the icons already imported in the layout: `LayoutGrid, Users, Package, Building2, MessageSquare, ShoppingBag, Settings, Route, CreditCard, BarChart2, ScrollText, BookOpen, Mail, FlaskConical`.

### Suggested data shape (move into `admin-nav.tsx`)

```tsx
const NAV_GROUPS = [
  { label: null, items: [{ href: '/admin', label: 'Overview', icon: LayoutGrid }] },
  { label: 'Operations', items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/inventory', label: 'Inventory', icon: Package },
      { href: '/admin/concierge', label: 'Concierge', icon: MessageSquare },
  ] },
  { label: 'People', items: [
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/providers', label: 'Providers', icon: Building2 },
  ] },
  { label: 'Finance', items: [
      { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  ] },
  { label: 'Configuration', items: [
      { href: '/admin/settings/tiers', label: 'Service Tiers', icon: Settings },
      { href: '/admin/settings/corridors', label: 'Corridors', icon: Route },
      { href: '/admin/settings/notifications', label: 'Notifications', icon: MessageSquare },
      { href: '/admin/help', label: 'Help Content', icon: BookOpen },
  ] },
  { label: 'System', items: [
      { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
      { href: '/admin/email', label: 'Email', icon: Mail },
      { href: '/admin/seed-data', label: 'Seed Data', icon: FlaskConical },
  ] },
]
```

## Collapse behavior

- Each group with a `label` renders a **header button** (the whole header is the click target) with the group label and a chevron (`ChevronDown` from `lucide-react`) that rotates ~ -90°/180° between open and closed. Clicking toggles that group's items open/closed.
- `Overview` (label `null`) renders as a plain standalone link with **no** header and **no** toggle.
- **Default state:** all groups **expanded** on first load.
- **Active section always open:** use `usePathname()` to detect which group contains the current route (longest-prefix match against item `href`s) and force that group open on load, even if it was previously collapsed. (This keeps the page you're on visible.)
- **Persist** each group's open/closed state across navigations and reloads via `localStorage` (e.g. key `llv.adminNav.collapsed` holding the set of collapsed group labels). Read it in a `useEffect` after mount — **not** during render — so server and first client render match (avoid hydration mismatch); initialize state to "all expanded", then reconcile from `localStorage` in the effect.
- Accessibility: the header is a `<button>` with `aria-expanded` reflecting state and `aria-controls` pointing at the items container; collapsed items are removed from the DOM or `hidden` so they're not tab-focusable. Keyboard: Enter/Space toggles.

You may implement this with a small `useState` + `localStorage` approach, or with Base UI's Collapsible primitive if it's already available in the project — either is fine as long as the behavior above holds. (Note: this project's Shadcn build is on Base UI, not Radix — no `asChild`.)

## Styling

- **Group header** should match the existing `LLV Admin` caption styling already in the layout — uppercase, tracked, muted, tiny — laid out as a flex row with the chevron pushed to the right. e.g.:
  ```tsx
  <button className="flex w-full items-center justify-between px-3 pt-5 pb-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 hover:text-foreground transition-colors" aria-expanded={open}>
    <span>{group.label}</span>
    <ChevronDown className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`} />
  </button>
  ```
- **Items** render exactly as today — same `<Link>` markup, classes (`flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors`), icon, and `space-y-1` rhythm within an open group.
- No divider lines between groups — the headers provide separation. The standalone Overview link needs no extra top padding.

## Out of scope (do not do)

- No active-link **highlighting** (using `usePathname` to auto-open the active group is in scope; styling the active link differently is a separate change — leave it).
- No route, page, or icon changes; no change to `Seed Data`'s existing visibility/gating.
- No animation library; a CSS transition on the chevron is enough (animating item height is optional and must not cause layout jank — instant show/hide is acceptable).
- No mobile drawer changes beyond what falls out naturally (the `aside` is already `hidden md:flex`).

## Acceptance criteria

- The admin sidebar shows: `Overview` (standalone, no toggle), then **Operations / People / Finance / Configuration / System** as collapsible headers, each with a chevron, in the order above.
- Clicking a header collapses/expands its items; the chevron rotates to match.
- All groups start expanded; collapsing a group and navigating/reloading keeps it collapsed (persisted); the group containing the current route is always open.
- All 15 links still navigate to their current routes with their current icons.
- No hydration warning in the console; light and dark mode both correct; collapsed items aren't keyboard-focusable.
- `npm run verify` (ESLint + tsc) clean.

## Standing rules (also in `CLAUDE.md`)

- **The founder runs the local dev server.** Do **NOT** run `npm run dev` / `next dev` or `pkill`/`kill` Next processes. Verify with `npm run verify`; the founder will exercise the running app.
- Run under **Node 20.19.5** (`.nvmrc`). **Never hand-edit `node_modules`.**
- Lucide icons only — no emoji in the UI.

## Report back

- File(s) changed, the `npm run verify` result, and a one-line note confirming: groups collapse/expand, state persists, the active group auto-opens, and all 15 links are intact.
