# Investor Dashboard — Code Prompt Set (2026-06-10)

**Author:** Cowork
**For:** Claude Code
**Feature:** A gated, in-app **Investor Data Room** — a new `investor` role whose users log in, acknowledge an NDA, and then browse a documents library, financial charts, and the pitch deck, with per-document downloads and view auditing.

> **Why in-app and not a static file:** building this inside the platform gives *real* access control — Supabase Auth (login), role-gating, a server-enforced NDA gate, RLS so investors can read only room content, and a view-audit trail (DocSend-style "who viewed what"), all self-hosted. A standalone HTML file cannot enforce any of that.

---

## Workflow & guardrails (read first)

- **Branch:** Do all of this on a feature branch — `feat/investor-dashboard` — off `main`. Commit incrementally per prompt. Open a PR for the founder to review/merge. **Do not build on `main`** (project rule: testing gates new build).
- **Local environment:** The founder runs the dev server — do **NOT** run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.
- **Migrations:** Continue numbering from `029_*` → `030`, `031`, … After schema changes, regenerate types: `npx supabase gen types typescript --linked > src/types/database.ts`, and confirm every new table has `Relationships: []` (or Supabase generic inference breaks). Apply with `npx supabase db push`.
- **Conventions (from CLAUDE.md):** Shadcn on Base UI — no `asChild`; use `buttonVariants` on `<Link>`. **Lucide icons only, no emoji** in UI. Obsidian & Ivory palette (`globals.css` CSS variables). Server Actions re-verify the session (`supabase.auth.getUser()`), derive ids from `user.id` (never from form data), and return `{ error }` / `{ success }` / `{ data }` (throw only on auth/permission violations). Inngest is not involved here.
- **Tailwind v4:** no config file; tokens live in `src/app/globals.css`. Fonts: Cormorant Garamond (`font-serif`, headings) + Inter (body).

---

## Prompt sequence (build in order)

**Build the skeleton first (Prompt 0), click through it to confirm the IA, then layer functionality with 1–5.**

| # | File | Builds | Depends on |
|---|---|---|---|
| 0 | `00a_..._investor_skeleton.md` | Migration `030` (enum value); demo investor account + **demo entry button** on the sign-in form; `proxy.ts` investor prefix; `(investor)` route group + gated layout + **full sidebar nav**; placeholder pages for all six routes (Overview, Documents, Financials, Pitch Deck, The Ask, Contact) | — |
| 1 | `01_..._investor_role_schema_rls.md` | Migration `031`: `nda_acknowledged` flag on `profiles`; `investor_documents`, `investor_nda_acknowledgments`, `investor_document_views` tables; RLS; private `investor-room` storage bucket; type regen *(enum `030` already added in Prompt 0)* | 0 |
| 2 | `02_..._investor_route_group_nda_gate.md` | `proxy.ts` NDA gate; `/investor/acknowledge` page + acknowledge action *(route group + layout already exist from Prompt 0 — extend, don't recreate)* | 0, 1 |
| 3 | `03_..._investor_documents_downloads_audit.md` | `/investor/documents` library (grouped by section); signed-URL downloads via service-role storage helper; view/download audit logging; print-friendly | 1, 2 |
| 4 | `04_..._admin_investor_management_seeding.md` | Admin "Investors" area: invite/promote an investor, see NDA status + view audit; document seed + storage upload script | 1, 2 |
| 5 | `05_..._investor_overview_financials_deck.md` | `/investor` overview KPIs; `/investor/financials` hand-rolled charts + tables from a typed data module; `/investor/deck` embedded slides | 1, 2, 3 |

Prompts 3, 4, 5 can be done in any order once 1–2 are merged. Each prompt ends with `npm run verify` clean and a report-back.

---

## Content Cowork supplies (not Code's job)

- **Documents library files:** Cowork produces the conformed, control-page-stripped PDFs (the "binder" set) and hands them to the founder to drop into `supabase/seed/investor-room/` (or wherever Prompt 4's upload script reads). Code builds the *plumbing*; Cowork supplies the *files*.
- **Financial figures:** the numbers for Prompt 5's charts are already extracted from the live Financial Model and are embedded directly in Prompt 5 as a typed data module — no spreadsheet access needed at build time.

---

## Out of scope for v1 (note for later)

- Per-document access control (all investors see the same room). Per-investor document visibility can be a later `investor_document_access` join table.
- Watermarking downloads with the viewer's identity (DocSend-style). Architecturally easy later — the view-audit table already records who downloaded what.
- Email invitations via Resend (Prompt 4 creates the account + sets role; wiring an invite email is a small follow-up).
