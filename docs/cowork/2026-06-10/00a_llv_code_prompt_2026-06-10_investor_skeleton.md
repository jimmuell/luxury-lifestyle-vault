# Code Prompt 0 — Investor Dashboard skeleton + demo entry

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard` (create from `main`)
**Relates to:** Investor Dashboard set (`00_README_investor_dashboard.md`). **Run this FIRST** — it stands up a clickable shell. Prompts 1–5 then layer real functionality on top.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Goal of this prompt

A **walkable skeleton**: a one-click demo button on the sign-in form that drops you into `/investor`, a gated `(investor)` layout with the full sidebar, and placeholder pages for every menu item. No NDA gate, no RLS tables, no real data yet — those come in Prompts 1–5. The point is to click through the information architecture and agree on it before building functionality.

## What to build

### 1. Migration `030_investor_role.sql` — enum value only

```sql
-- 030_investor_role.sql
-- Add 'investor' to user_role. Standalone migration (a new enum value can't be
-- used in the same transaction it's added). Later migrations (031) use it.
alter type user_role add value if not exists 'investor';
```
Apply with `npx supabase db push`, then regenerate types: `npx supabase gen types typescript --linked > src/types/database.ts`. In `src/types/app.ts`, add `investor` to the role union / label maps (search for `'provider'` to find each spot; `investor: 'Investor'`).

> **Ownership note:** This migration `030` is owned by THIS prompt. Prompt 1 assumes it exists and adds only `031`.

### 2. Demo investor account (seed)

Add a demo investor to the existing demo/seed accounts (follow the pattern that creates `demo.admin@llv.dev` / `demo.client@llv.dev`): `demo.investor@llv.dev`, role `investor`. Reuse the existing demo-account seeding mechanism (Seed Data Manager / seed scripts) and the `is_seed_data = true` convention where applicable.

> When Prompt 1 adds `profiles.nda_acknowledged` (default false) and Prompt 2 adds the NDA gate, set the demo investor's `nda_acknowledged = true` in the seed so the demo button keeps landing directly in the room. (Not applicable yet — the column doesn't exist in this prompt.)

### 3. Demo entry button on the sign-in form

Extend the existing demo-login affordance (currently gated by `NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'`, with client/admin demo buttons):

- In `src/actions/auth.ts`, widen `signInAsDemo(role: 'client' | 'admin' | 'investor')` and map `investor → demo.investor@llv.dev`. Keep the `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` guard.
- In the sign-in form/page (`src/app/(auth)/auth/login/…`), add a button alongside the existing demo buttons: **"Enter Investor Dashboard (demo)"** → calls `signInAsDemo('investor')`. After sign-in, the existing `/` redirect + proxy will route the investor to `/investor`. Style with `buttonVariants`; Lucide icon (e.g. `LineChart`), no emoji.

### 4. `proxy.ts` — investor prefix

In `src/proxy.ts`, add to `ROLE_PREFIXES`: `investor: '/investor'`. That's all for this prompt (the NDA gate is added in Prompt 2). With this, a signed-in investor is routed to `/investor` and kept within `/investor/*`.

> Admin preview of `/investor` is intentionally out of scope here — the existing prefix rule bounces admins to `/admin`. Use the demo investor button to view the room.

### 5. `(investor)` route group, layout, sidebar nav

Mirror `src/app/(admin)/layout.tsx` and `src/components/admin/admin-nav.tsx`.

- `src/app/(investor)/layout.tsx` (server component): `getUser()` → if none `redirect('/auth/login')`; fetch `profiles.role`; if `role !== 'investor'` (allow `'admin'` too for future preview) `redirect('/')`. Render the admin-style sidebar shell: brand label `LLV Investor Room` (`text-[10px] tracking-[0.3em] uppercase text-muted-foreground`), `<InvestorNav />`, `ThemeToggle`, and the sign-out form. `<main>` uses `max-w-screen-xl mx-auto px-6 md:px-12 py-8` with `<AuthWatcher />`.
- `src/components/investor/investor-nav.tsx` (client component, modeled on `admin-nav.tsx`: `usePathname`, active/hover classes identical to admin). Full menu IA:

```ts
import { LayoutGrid, FolderOpen, BarChart2, Presentation, Target, Mail } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/investor',            label: 'Overview',    icon: LayoutGrid },
  { href: '/investor/documents',  label: 'Documents',   icon: FolderOpen },
  { href: '/investor/financials', label: 'Financials',  icon: BarChart2 },
  { href: '/investor/deck',       label: 'Pitch Deck',  icon: Presentation },
  { href: '/investor/the-ask',    label: 'The Ask',     icon: Target },
  { href: '/investor/contact',    label: 'Contact',     icon: Mail },
]
```

### 6. Placeholder pages (one per nav item)

Create a server-component page for each route below. Each renders a serif page title, one sentence of framing, and a branded **empty/coming-soon state** (a bordered `bg-card` panel with a Lucide icon, a short "Coming soon" line, and muted helper text describing what will live here). Build a tiny shared `InvestorPlaceholder` component to keep them consistent.

- `src/app/(investor)/investor/page.tsx` — **Overview**: serif headline using the brand line *"Your Lifestyle, Wherever Life Takes You."*, a sentence welcoming the investor to the data room, and three "Jump in" cards linking to Documents / Financials / Pitch Deck.
- `src/app/(investor)/investor/documents/page.tsx` — **Documents**: "The data room library will appear here."
- `src/app/(investor)/investor/financials/page.tsx` — **Financials**: "Revenue, costs, and the 3-year projection will appear here."
- `src/app/(investor)/investor/deck/page.tsx` — **Pitch Deck**: "The pitch deck will be embedded here."
- `src/app/(investor)/investor/the-ask/page.tsx` — **The Ask**: "Round size, use of funds, and terms will appear here."
- `src/app/(investor)/investor/contact/page.tsx` — **Contact**: "Request a meeting or ask a question here."

## Acceptance criteria

- With `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`, the sign-in form shows **Enter Investor Dashboard (demo)**; clicking it signs in as the demo investor and lands on `/investor`.
- The `(investor)` sidebar shows all six items with correct active states; theme toggle and sign-out work.
- All six routes render their placeholder without error; navigating between them keeps the sidebar.
- A `client`/`provider` cannot reach `/investor/*` (proxy routes them to their own area).
- `npm run verify` is clean.

## Conventions (from CLAUDE.md)
- Shadcn on Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); Obsidian & Ivory; `font-serif` headings; Server Actions re-verify session; demo login stays behind `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`.

## Report back
Files added/changed, confirmation the demo button lands in `/investor`, a list of the six routes rendering, how the demo investor account is seeded, and the `npm run verify` result.
