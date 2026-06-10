# Code Prompt 2 — Investor route group, NDA gate, navigation

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set. **Depends on Prompts 0 & 1.** Prompt 0 already created the `(investor)` route group, the gated layout, and the sidebar nav; Prompt 1 added the `nda_acknowledged` flag and tables. This prompt adds the **NDA gate** on top of that skeleton — extend the existing layout/proxy, do not recreate them.

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

Investors need their own gated area. Two gates: (1) only `investor` (and `admin` for preview) may enter `/investor/*`; (2) an investor who hasn't acknowledged the NDA is forced to `/investor/acknowledge` before seeing anything else. The app's role-prefix enforcement lives in `src/proxy.ts`, and the NDA gate should mirror the existing client-onboarding gate there.

## Goal

### 1. `src/proxy.ts` — add the investor prefix + NDA gate

- Add to `ROLE_PREFIXES`: `investor: '/investor'`.
- After the existing client-onboarding gate, add the NDA gate (same shape):

```ts
// Gate investors: must acknowledge the NDA before entering the data room
if (role === 'investor' && !profile?.nda_acknowledged && !pathname.startsWith('/investor/acknowledge')) {
  return NextResponse.redirect(new URL('/investor/acknowledge', request.url))
}
```

- Extend the existing `profiles` select in proxy to include the flag: `.select('role, onboarding_complete, nda_acknowledged')`.
- Leave `PUBLIC_PREFIXES` unchanged (the data room is not public). The `/` redirect already routes each role to its prefix via `ROLE_PREFIXES`, so investors landing on `/` go to `/investor` automatically.

### 2. `(investor)` route group + gated layout — already exists (Prompt 0)

Prompt 0 created `src/app/(investor)/layout.tsx` and the sidebar nav. No changes needed here for the NDA gate (the redirect lives in proxy). Skip recreating it. *(For reference, the layout it built:)*

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// ...chrome imports: ThemeToggle, AuthWatcher, signOut, Button, the new InvestorNav

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, nda_acknowledged')
    .eq('id', user.id)
    .single()

  // Admins may preview the room; everyone else must be an investor.
  if (profile?.role !== 'investor' && profile?.role !== 'admin') redirect('/')

  // (NDA redirect is handled in proxy; the acknowledge page renders its own minimal shell.)
  return (/* sidebar with InvestorNav + ThemeToggle + sign-out, <main> with AuthWatcher + children */)
}
```

Match the admin layout's structure and classes (sidebar `w-56 border-r bg-sidebar`, `<main>` with `max-w-screen-xl mx-auto px-6 md:px-12 py-8`). Sidebar brand label: small uppercase tracked text reading `LLV Investor Room` (use the same `text-[10px] tracking-[0.3em] uppercase text-muted-foreground` treatment as `LLV Admin`).

### 3. Investor navigation component — already exists (Prompt 0)

`src/components/investor/investor-nav.tsx` was created in Prompt 0 with the full six-item menu (Overview, Documents, Financials, Pitch Deck, The Ask, Contact). No change needed here.

### 4. `/investor/acknowledge` — the NDA gate page + action

`src/app/(investor)/investor/acknowledge/page.tsx` — server component. If the investor has already acknowledged (`profile.nda_acknowledged === true`), `redirect('/investor')`. Otherwise render a centered, branded confidentiality screen (no sidebar nav — this is pre-entry): the LLV wordmark treatment, a scrollable confidentiality/NDA summary block, a required typed **full name** field, a required checkbox ("I have read and agree to the confidentiality terms above"), and an **Enter Data Room** submit button (`buttonVariants` styling; Lucide `Lock`/`ShieldCheck` icon, no emoji). Include a short line that access is logged.

Use a small **client component** for the form (`AcknowledgeForm`) that calls the server action and disables submit until the checkbox is checked and the name is non-empty. Show returned `{ error }` via the project's toast (`sonner`) pattern; on success the action redirects.

Server action `acknowledgeNda` in `src/actions/investor.ts`:

```ts
'use server'
// re-verify session; derive profile_id from user.id (NEVER from form data)
// validate full_name (non-empty) and that the checkbox was checked (form field)
// 1) insert into investor_nda_acknowledgments { profile_id, nda_version: 'v1', full_name, ip_address, user_agent }
//    - capture IP/user-agent from headers() if available
//    - on unique-violation (already acknowledged) treat as success
// 2) set profiles.nda_acknowledged = true for this user
//    - if RLS blocks the self-update (per Prompt 1 report-back), use the service-role admin client for THIS update only
// return { error } on failure; on success revalidatePath('/investor','layout') then redirect('/investor')
```

Use `nda_version: 'v1'`. Keep the displayed NDA text in a constant (e.g. `src/lib/legal/investor-nda.ts`) with a `version` export so the version and copy stay in sync — Cowork will supply final NDA wording; use a clearly-marked placeholder summary for now.

## Acceptance criteria

- A logged-in `investor` who hasn't acknowledged is redirected to `/investor/acknowledge` from any `/investor/*` path (and from `/`).
- Submitting the form with a typed name + checked box records an `investor_nda_acknowledgments` row, flips `profiles.nda_acknowledged` to true, and lands on `/investor`. Re-visiting `/investor/acknowledge` afterward redirects to `/investor`.
- A `client` or `provider` hitting `/investor/*` is redirected to their own area (proxy). An `admin` can view `/investor/*` for preview.
- Sidebar nav renders the four items with correct active states; sign-out and theme toggle work as in admin.
- `npm run verify` is clean.

## Conventions (from CLAUDE.md)
- Shadcn on Base UI (no `asChild`; `buttonVariants` on `<Link>`); Lucide icons only (no emoji); Obsidian & Ivory; Server Actions re-verify session and derive ids from `user.id`; return `{ error }` / `{ success }`.

## Report back
Files added/changed, confirmation of both gates (role + NDA) with the redirect behavior for each role, whether the self-update of `nda_acknowledged` needed the service-role client, and the `npm run verify` result.
