# LLV Investor Portal — Presentations, Tiered Access & Performance

**Code prompts for Claude Code · 2026-06-11**
Repo: `~/dev/luxury-lifestyle-vault` · run on a feature branch off `main`.

These continue the investor-dashboard work. Each prompt below is self-contained: run them in order, and after each one run `npm run verify` (ESLint + TypeScript) before moving on. Paths are best-known from the current tree — confirm exact filenames in the repo before editing.

---

## Why we're doing this (context for every prompt)

The "investor dashboard" is becoming a **two-audience board & investor portal**:

- **Prospects** (potential investors) — see *only* the pitch deck.
- **Board members** — ongoing access to financials, operations, documents, and a growing library of meeting decks.

Two product decisions drive the design:

1. **Tiering by audience flag, not forked apps.** One investor area. Each document/deck carries an `audience` level; each profile carries an `investor_tier`. Visibility rule: a user sees an item if the item is tagged `prospect` **or** the user's tier is `board`. Board sees everything; prospects see only `prospect`-tagged items.
2. **"Pitch Deck" → "Presentations."** A section that lists *multiple* slideshows, each opening in a real click-through viewer (react-pdf), with Download and Open-as-PDF. The pitch deck is just the first, prospect-visible entry.

---

## Prompt 1 — Migration 033: audience tiering + doc types + RLS

**Goal:** Add tiering columns and update row-level security so visibility follows audience.

**Changes**

- New migration `supabase/migrations/033_investor_tiering.sql`:
  - `profiles`: add `investor_tier text not null default 'prospect'` with `check (investor_tier in ('prospect','board'))`. (Only meaningful when `role = 'investor'`.)
  - `investor_documents`: add
    - `audience text not null default 'board' check (audience in ('prospect','board'))`
    - `doc_type text not null default 'document' check (doc_type in ('document','presentation'))`
  - Index: `create index on investor_documents (doc_type, audience, sort_order);`
  - **RLS** — replace the investor SELECT policy on `investor_documents` so an investor sees a row when:
    `is_published = true AND (audience = 'prospect' OR public.get_my_tier() = 'board')`.
    Admin keeps full access. Add a small `public.get_my_tier()` SQL function mirroring the existing `get_my_role()` (reads `investor_tier` from the caller's profile).
- Regenerate types: `npm run gen:types` (or the project's existing types command) so `src/lib/database.types.ts` includes the new columns.

**Acceptance**

- `npm run verify` clean.
- Migration applies cleanly on a fresh DB and is idempotent-safe to re-run in CI.
- An investor with tier `prospect` can select only `audience='prospect'` published rows; tier `board` selects all published rows; admin selects all.

---

## Prompt 2 — Reclassify the pitch deck + backfill tiers

**Goal:** Make existing data fit the new model.

**Changes**

- Update `scripts/seed-investor-docs.ts` + its manifest:
  - The pitch deck row → `doc_type = 'presentation'`, `audience = 'prospect'`.
  - All other seeded documents → `audience = 'board'` (default already, but set explicitly in the manifest for clarity).
  - Add a `doc_type`/`audience` field to the manifest schema so future uploads declare them.
- Demo data: set `demo.investor@llv.dev` to `investor_tier = 'board'` (so QA sees the full portal). Add a second demo profile `demo.prospect@llv.dev` / `demo1234` with `investor_tier = 'prospect'`, `nda_acknowledged = true`, to QA the prospect view. Gate both behind the existing demo-login flag.

**Acceptance**

- Re-running the seed is idempotent (upsert on `storage_path`).
- Board demo sees all sections; prospect demo sees only Presentations → the pitch deck.

---

## Prompt 3 — IA: rename to "Presentations", add list + viewer routes, gate by tier

**Goal:** Replace the single deck page with a Presentations section, and hide board-only areas from prospects.

**Changes**

- Routing:
  - Add `src/app/(investor)/investor/presentations/page.tsx` — **list** of `doc_type='presentation'` rows the viewer is allowed to see (RLS does the filtering), as cards (title, description, slide/section). Ordered by `sort_order`.
  - Add `src/app/(investor)/investor/presentations/[id]/page.tsx` — **viewer** (built in Prompt 4).
  - Keep the old `/investor/deck` path working via a redirect to `/investor/presentations` (or to the pitch deck's `[id]`).
- Nav: in `InvestorNav`, rename "Pitch Deck" → **"Presentations"** pointing at `/investor/presentations`. Build the nav items from the viewer's tier: a `prospect` sees **Overview, Presentations, Contact** only; a `board` member sees the full set (Overview, Presentations, Documents, Financials, Operations, The Ask, Contact). Pass tier from the layout (server) into the nav.
- Gate at the boundary too (defense in depth): in `(investor)/layout.tsx` and/or the proxy, bounce a `prospect` who hits a board-only route (`/investor/financials`, `/investor/documents`, etc.) back to `/investor/presentations`.

**Acceptance**

- Prospect nav shows only Overview / Presentations / Contact; direct-navigating to `/investor/financials` redirects.
- Board nav shows everything; all routes render.
- `/investor/deck` redirects without error.

---

## Prompt 4 — react-pdf slideshow viewer

**Goal:** A real click-through deck viewer with Download and Open-as-PDF.

**Changes**

- `npm i react-pdf` (pulls `pdfjs-dist`). Configure the pdf.js worker (set `pdfjs.GlobalWorkerOptions.workerSrc` to the bundled worker or a pinned CDN URL matching the installed version).
- New client component `src/components/investor/DeckViewer.tsx`:
  - Props: `signedUrl`, `title`, `downloadUrl`.
  - Renders `<Document file={signedUrl}>` + a single `<Page pageNumber={n} />`; **must be loaded with `next/dynamic` `{ ssr: false }`** (pdf.js needs the DOM).
  - Controls: Prev / Next buttons, ←/→ keyboard nav, "n / total" counter, fullscreen toggle, and a loading skeleton while the page renders.
  - Toolbar above the slide: **Download** (existing `getInvestorDocSignedUrl` with download filename) and **Open as PDF** (signed URL, `target="_blank" rel="noopener"`).
- `presentations/[id]/page.tsx` (server): fetch the doc (RLS-checked), mint the 1h signed URL, **log the view audit after the URL is successfully minted** (reuse the existing `investor_document_views` pattern — and apply the CodeRabbit fix: don't fail open, write the audit user-scoped after signing), then render `<DeckViewer>`.

**Acceptance**

- Opening a presentation shows slide 1; arrows/keys page through; counter + fullscreen work.
- Download saves the PDF with a sensible filename; Open-as-PDF opens the raw PDF in a new tab.
- A view row is recorded once per open, after signing.

---

## Prompt 5 — Admin: upload & manage presentations

**Goal:** Upload a new slideshow from the admin area without re-running the seed script.

**Changes**

- Extend the admin investor tooling (alongside `src/actions/admin-investors.ts` / the admin investors page) with a **presentations manager**: list existing presentations + an upload form.
- Server action `uploadInvestorPresentation`: accepts a PDF file + `title`, `description`, `audience` (`prospect`|`board`), `sort_order`. Uploads to the `investor-room` bucket (`INVESTOR_BUCKET`) at a deterministic path, then inserts an `investor_documents` row with `doc_type='presentation'`, the chosen `audience`, `file_type='pdf'`, and `file_size_bytes`. Use the admin client; validate content-type is PDF.
- Allow editing a presentation's `audience` and `is_published` (so a board deck can later be exposed to prospects, or unpublished).

**Acceptance**

- Admin uploads a PDF → it appears under Presentations for the correct audience immediately.
- Setting `audience='prospect'` makes it visible to the prospect demo; `board` hides it from prospects.

---

## Prompt 6 — Performance pass

**Goal:** Fix the real production-side latency (note: most "slow first load" on `127.0.0.1:3000` is `next dev` compiling routes on demand — verify perf on the **Vercel production URL**, not dev).

**Changes**

- **Loading skeletons:** add `loading.tsx` to each investor route segment (`overview`, `presentations`, `presentations/[id]`, `documents`, `financials`) so navigation paints the shell + skeleton instantly while data streams.
- **Prefetch:** confirm `InvestorNav` and all in-app navigation use Next `<Link>` (prefetch on by default in prod). Replace any `<a>` / `router.push` used for primary nav.
- **Parallelize queries:** in `(investor)/layout.tsx` and pages, fetch user + profile (role/tier/NDA) and page data with `Promise.all` rather than sequential `await`s. Remove duplicate `auth.getUser()` calls per request where the value can be passed down.
- **Cache static data:** the financials come from a fixed model (`src/lib/investor/financials.ts`) — render those from the constant (no per-request DB/compute) or mark the read cached/`revalidate`.

**Acceptance**

- `npm run verify` clean; routes still gated correctly.
- On the production URL, route transitions show an immediate skeleton; no full-page white flash between sections.

---

## Prompt 7 — (Optional, phase 2) Cut per-request auth round-trips

**Goal:** Remove the Supabase DB lookups the middleware/proxy does on every `/investor/*` request.

**Changes**

- Move `role`, `investor_tier`, and `nda_acknowledged` into the Supabase session via **custom access-token claims** (Auth Hook), so middleware reads them from the JWT instead of querying `profiles` each navigation. Invalidate/refresh the session when an admin changes a user's tier or NDA status.
- **Ops note (no code):** confirm the Vercel function region matches the Supabase project region — a mismatch adds a round-trip of latency to every query.

**Acceptance**

- Middleware performs zero DB queries on a normal authenticated navigation.
- Tier/NDA changes take effect on next session refresh.

---

## Suggested branch & order

```
git checkout -b feat/investor-presentations
# Prompt 1 → verify → 2 → verify → 3 → verify → 4 → verify → 5 → verify → 6 → verify
# Prompt 7 is optional / later.
```

Open one PR; the audience/tier model (P1–P3) is the foundation, P4–P5 deliver the slideshow + uploads, P6 is the perf win, P7 is hardening.

## Parked / related (from PR #1 review, worth folding in)

- CodeRabbit flagged: enforce NDA on the doc **API** endpoint; don't **fail open** on audit-write failure; mobile nav missing on the investor sidebar. P4 already adopts the audit fix; consider the API NDA check and a mobile nav in this branch.
