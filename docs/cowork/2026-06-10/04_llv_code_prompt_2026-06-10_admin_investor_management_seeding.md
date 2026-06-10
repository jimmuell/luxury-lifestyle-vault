# Code Prompt 4 — Admin investor management + document seeding

**Date:** 2026-06-10
**Author:** Cowork
**For:** Claude Code
**Branch:** `feat/investor-dashboard`
**Relates to:** Investor Dashboard set. **Depends on Prompts 1 & 2** (independent of 3 & 5).

> **Local environment:** The founder runs the dev server — do NOT run `npm run dev` / `next dev` or `pkill` Next. Verify with `npm run verify`. Run under Node 20.19.5; never hand-edit `node_modules`.

---

## Problem

Investors are invite-only — there is no public investor signup. The founder (admin) needs to create/promote investor accounts, see who has acknowledged the NDA, and see the view-audit ("who viewed what, when"). Separately, the document library needs a way to load files into the private `investor-room` bucket and register the `investor_documents` rows.

## Goal

### 1. Admin "Investors" area

Add an admin route `src/app/(admin)/admin/investors/page.tsx` and a nav entry in `src/components/admin/admin-nav.tsx` (under the **People** group, label `Investors`, Lucide `Briefcase` or `LineChart` icon). The page (admin-gated like other admin pages) shows a table of investor accounts: name, email, NDA status (acknowledged + date, from `investor_nda_acknowledgments`), document count viewed, and last activity (latest `investor_document_views.viewed_at`). Provide an **Invite investor** control.

### 2. Invite/promote action

`src/actions/admin-investors.ts`, server action(s), admin-only (re-verify session, assert `get_my_role()`/profile role is `admin`, else throw):

- `inviteInvestor({ email, fullName })`:
  - Create the auth user with the **service-role admin client** (`createAdminClient().auth.admin.createUser` or `inviteUserByEmail` — prefer invite-by-email if SMTP/Resend is configured; otherwise `createUser` with a temporary password and `email_confirm: true`, and return the temp credential to the admin UI so the founder can relay it).
  - Ensure the `profiles` row for that user has `role = 'investor'` and `nda_acknowledged = false`. (The existing new-user trigger likely creates a `profiles` row defaulting to `client`; explicitly update it to `investor` here via the admin client.)
  - Return `{ success: true }` or `{ error }`.
- `promoteToInvestor({ profileId })` (optional convenience): set an existing account's `role = 'investor'`. Guard against changing an existing `admin`.

> Keep all role mutations server-side via the service-role client; never trust a role from form data. Document any assumption about the new-user trigger in the report-back.

### 3. Document seeding + upload script

Two parts:

**3a. Upload script** `scripts/seed-investor-docs.ts` (Node/ts, run manually by the founder — not Inngest, not part of the app runtime). It:
- Reads files from a local folder `supabase/seed/investor-room/` (create the folder with a `.gitkeep`; the actual PDFs are git-ignored — they're confidential and supplied by Cowork/founder).
- For each file, uploads to the `investor-room` bucket (service-role client) at a stable path (e.g. `<section>/<filename>`), then upserts an `investor_documents` row with `{ section, title, description, storage_path, file_type, file_size_bytes, sort_order }`.
- Driven by a manifest `supabase/seed/investor-room/manifest.json` mapping filename → `{ section, title, description, sort_order }` so titles/sections aren't guessed from filenames.
- Idempotent: re-running updates existing rows (match on `storage_path`) rather than duplicating.
- Add an npm script alias if convenient (e.g. `"seed:investor-docs": "tsx scripts/seed-investor-docs.ts"`), consistent with how existing scripts are invoked. Gate it to non-production or require an explicit env confirmation, consistent with the project's seed-safety conventions (`SEED_TOOLS_ENABLED` pattern).

**3b. Manifest template.** Commit `supabase/seed/investor-room/manifest.example.json` showing the expected shape and the canonical section keys (`concept, strategy, market, financials, product, operations, launch, legal`). Example entry:
```json
{
  "documents": [
    { "file": "LLV_Executive_One-Pager.pdf", "section": "concept", "title": "Executive One-Pager", "description": "The 60-second overview of Luxury Lifestyle Vault.", "sort_order": 10 }
  ]
}
```

### 4. `.gitignore`

Ensure `supabase/seed/investor-room/*.pdf` (and other doc binaries) are git-ignored — confidential investor material must not be committed. Keep `manifest.example.json`, `.gitkeep`, and the script tracked.

## Acceptance criteria

- An admin can invite/create an investor; the resulting account has `role='investor'`, `nda_acknowledged=false`, and on first login is forced through `/investor/acknowledge` (Prompt 2 gate).
- The admin Investors page lists investors with NDA status and view-audit summary, reading from `investor_nda_acknowledgments` and `investor_document_views`.
- Running `scripts/seed-investor-docs.ts` against a populated `supabase/seed/investor-room/` + manifest uploads files to the private bucket and creates/updates `investor_documents` rows idempotently; the docs then appear at `/investor/documents` (Prompt 3).
- Confidential PDFs are git-ignored; the example manifest and script are committed.
- `npm run verify` is clean.

## Conventions (from CLAUDE.md)
- Service-role client is server-only and used for all role mutations + storage writes; admin pages/actions assert admin role; Lucide icons only (no emoji); Shadcn Base UI conventions; seed safety mirrors `SEED_TOOLS_ENABLED`.

## Report back
Files added/changed, how investor accounts are created (invite-by-email vs temp password) and any new-user-trigger assumption, confirmation the seed script is idempotent and PDFs are git-ignored, and the `npm run verify` result.
