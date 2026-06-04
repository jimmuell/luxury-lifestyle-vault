# LLV — Phase A Task Breakdown for Claude Code

**Author:** Claude Cowork
**Date:** May 24, 2026
**Source documents:** `docs/strategy/llv_technology_architecture_blueprint.docx` (architecture and Phase A scope, Sections 1–6) and the live codebase as of this date.
**Consumer:** Claude Code, working in the LLV repository.

---

## How to use this document

Tasks are grouped by the blueprint's four-layer architecture (Customer Experience, Operations Engine, Provider Network, Data & Intelligence) plus a Foundation layer for cross-cutting infrastructure. Each task is atomic enough to be picked up in one Claude Code session and has explicit done-when criteria.

Footnotes marked **[CR-N]** point to specific items in `llv_needs_chat_review.md` that are unresolved. Tasks with CR footnotes can still be built using the codebase's current choices, but the founder should be aware that Chat ratification is pending and may require revision.

Status legend:
- ✅ **Done** — present in codebase, no Phase A work needed
- 🔧 **In progress** — Code actively building right now
- ⚙️ **Partial** — foundation exists, finishing work remains
- ☐ **Not started** — no codebase artifacts yet
- ⛔ **Blocked** — held pending Chat resolution or founder decision

---

## Recent completions (build cycle log)

| Date | Tasks completed | Notes |
|---|---|---|
| May 25, 2026 | **🏁 PHASE A 100% COMPLETE** — DI-4 shipped; all 22 tasks delivered | **Summary:** 22/22 Phase A tasks delivered. Chat ruling: Supabase Storage only (no R2). Storage abstraction layer built (`src/lib/storage/constants.ts` + `server.ts`); archive bucket added (migration 009); all direct Supabase Storage calls in server pages replaced with service. **By layer:** Foundation 3/3 · UI Primitives 1/1 · Customer Experience 7/7 · Operations Engine 5/5 · Provider Network 2/2 · Data & Intelligence 4/4. **Sprints:** A1 ✅ · A2 ✅ · A3 ✅. **Build state:** 25 routes, 9 migrations, clean build. **Next:** Phase B planning. |
| May 24, 2026 | **🏁 PHASE A COMPLETE** — OE-4 and UI-1 shipped; OE-5 confirmed complete per founder report | **Summary:** 21 of 22 Phase A tasks delivered; DI-4 (photo storage strategy) remains held pending Chat resolution of [CR-3]. **By layer:** Foundation 3/3 (F-1, F-2, F-3) · UI Primitives 1/1 (UI-1) · Customer Experience 7/7 (CX-1 through CX-7) · Operations Engine 5/5 (OE-1 through OE-5) · Provider Network 2/2 (PN-1, PN-2) · Data & Intelligence 3/4 (DI-1, DI-2, DI-3 done; DI-4 held). **Sprints:** A1 ✅ · A2 ✅ · A3 ✅. **Build state:** 25 routes, 8 migrations, clean build. Typography primitives enforced via `<Typography>` components; admin styleguide at `/admin/styleguide`. Location enum (migration 007) committed with controlled WI/AZ values. **Next:** Chat session to resolve `llv_needs_chat_review.md` items (unblocks DI-4), ratify de facto stack decisions, and plan Phase B. Prep brief at `docs/cowork/llv_chat_session_prep.md`. |
| May 24, 2026 | OE-3, CX-7, PN-2 completed; OE-4 started | Admin inventory detail page live; concierge messaging live (table-backed, no email dependency); provider portal landing live. OE-4 unblocked — founder approved enum approach for location vocabulary, migration 007 in progress. DI-4 still held pending Chat. Sprint A2 nearly complete (UI-1 and OE-5 remain). |
| May 24, 2026 | **Sprint A1 complete** — F-1, F-2, F-3, CX-1, CX-5, CX-6, OE-1, OE-2, PN-1, DI-1, DI-3 | 20 routes live, clean build. Client dashboard with status tiles + quick actions + activity feed; address management with corridor-aware WI/AZ copy; 4-step onboarding stepper with middleware gating; admin dashboard with client counts + status grid + concierge queue; admin client roster with search/filters and detail pages; provider CRUD (create/edit/deactivate/reactivate); AI photo categorization via Haiku 4.5 and Inngest. F-2 completed by Cowork (`docs/cowork/llv_design_system.md`). DI-4 remains blocked on Chat resolution of [CR-3]. |
| May 24, 2026 | DI-2, CX-2, CX-3, CX-4 | Photo system delivered: drag-and-drop uploader (`src/components/photos/photo-upload.tsx`), gallery with lightbox (`photo-gallery.tsx`), 5-step intake form (`intake-form.tsx` + `wardrobe/intake/page.tsx`), wardrobe grid with thumbnails (`wardrobe/page.tsx`), item detail with photo section (`wardrobe/[id]/page.tsx`). Confirmed by founder. |

Add new rows at the top as Code completes additional tasks. Cowork updates this log when the founder reports build progress.

---

## Current state assessment

### What's already implemented in the codebase

**Foundation:**
- ✅ Next.js 16 App Router project on Vercel-targeted stack [CR-8]
- ✅ Tailwind v4 + Shadcn/UI on Base UI (17 components installed) [CR-7]
- ✅ Three Supabase client factories: browser, server, admin (`src/lib/supabase/`)
- ✅ Auth middleware enforcing `/client`, `/provider`, `/admin` path prefixes (`src/middleware.ts`)
- ✅ Route groups present: `(auth)`, `(client)`, `(provider)`, `(admin)` with role-verifying layouts
- ✅ Inngest client (`src/lib/inngest/client.ts`) and `/api/inngest` route stub [CR-6]
- ✅ Design system foundation: `globals.css`, Cormorant Garamond + Inter via `next/font` [CR-10]

**Data layer (six migrations live):**
- ✅ Enums: `user_role`, `item_status` (9 values), `item_category` (14), `condition_level` (5), `service_type`
- ✅ Tables: `profiles`, `client_profiles`, `addresses`, `providers`, `items`, `item_photos`, `item_conditions`
- ✅ Auto-generated SKU trigger (`LLV-000001` format)
- ✅ RLS policies on all tables
- ✅ Storage buckets with RLS: `item-photos` (private, 10 MB, jpg/png/webp/heic), `avatars` (public, 2 MB)
- ✅ Triggers, functions, indexes

**Server actions:**
- ✅ `src/actions/auth.ts`, `src/actions/items.ts` (admin-only status transitions enforced)

**Auth UI:**
- ✅ Login, signup, demo-login components

**Type system:**
- ✅ `src/types/database.ts` (Supabase-generated), `src/types/app.ts` (label maps + transition map)

### What is partial or missing from Phase A scope

Per blueprint Section 6.1, Phase A delivers:

| Phase A line item | Status | What remains |
|---|---|---|
| Database schema design and core data models | ✅ Done | None |
| Authentication and role-based access control | ✅ Done | Polish only (see Tasks F-1, F-2) |
| Client portal UI framework and design system | ⚙️ Partial | Dashboards are placeholders; design system needs documentation; navigation flows incomplete |
| Basic item intake and inventory management | ⚙️ Partial | `intake-form` component exists but no end-to-end intake page, no inventory list/detail views |
| Photo upload and cataloging system | ⚙️ Partial | Buckets exist; no upload UI, no AI categorization wiring |

The task list below covers what's needed to close Phase A and reach the Phase B handoff (scheduling engine, provider dispatch, notifications, billing).

---

## Sprint structure

Three sprints, roughly two weeks each, getting Phase A to "ready for Phase B" by end of July 2026.

- **Sprint A1 — Foundation polish, inventory UI, intake-to-cataloged loop, admin operations console.** ✅ **Complete (May 24, 2026).** Delivered: F-1, F-2, F-3, CX-1, CX-2, CX-3, CX-4, CX-5, CX-6, OE-1, OE-2, PN-1, DI-1, DI-2, DI-3. UI-1 was added late and rolled to Sprint A2.
- **Sprint A2 — UI primitives, item operations, condition logging, concierge channel.** ✅ **Complete (May 24, 2026).** Delivered: UI-1, OE-3, OE-5, CX-7, DI-4 (DI-4 unblocked May 25, 2026 — Chat ruled Supabase Storage only).
- **Sprint A3 — Phase B preparation.** ✅ **Complete (May 24, 2026).** Delivered: OE-4 (location enum migration 007), PN-2. Phase B planning is the next Chat session deliverable.

Founder approves sprint composition before Claude Code begins. Sprints are not hard boundaries — Claude Code may pull from later sprints if blocked.

---

## Foundation layer (F)

### F-1. Bring `CLAUDE.md` and `AGENTS.md` into alignment with codebase reality [CR-8] — ✅ Done (May 24, 2026)

- **Why:** `CLAUDE.md` documents the stack as "Next.js 15"; `package.json` is on `next@16.2.6`. `AGENTS.md` already warns Next.js 16 is post-training-cutoff. A future Claude Code session reading `CLAUDE.md` will be misled.
- **Done when:** `CLAUDE.md` says Next.js 16 (App Router, Server Actions). Any Next.js 15-specific guidance (Server Action conventions, dynamic API typing, route handler patterns) is reviewed against the Next.js 16 docs in `node_modules/next/dist/docs/` per the AGENTS.md instruction. Discrepancies are corrected.
- **Dependencies:** None.
- **Estimated effort:** 30 minutes.

### F-2. Document the design system in `docs/cowork/` [CR-10] — ✅ Done (May 24, 2026, Cowork — `docs/cowork/llv_design_system.md`)

- **Why:** Color palette ("Obsidian & Ivory with gold accent"), typography (Cormorant Garamond headings, Inter body), spacing, and Shadcn-on-Base-UI quirks (`asChild` not supported, use `buttonVariants`) live in code-only knowledge. Phase B contributors and design QA need a reference.
- **Done when:** `docs/cowork/llv_design_system.md` exists with: palette (CSS variable name + hex + usage), type scale (heading/body sizes and weights), spacing tokens, Shadcn integration notes, Base UI gotchas, dark/light mode rules.
- **Dependencies:** None (this is documentation Cowork can produce; flagged here so Code knows where to point reviewers).
- **Owner:** Cowork, not Code.

### F-3. Add `tsc --noEmit` and `lint` to a single `verify` script — ✅ Done (May 24, 2026)

- **Why:** Pre-commit / pre-push verification needs one command. Currently `lint` and `tsc --noEmit` are separate; no `test` script defined.
- **Done when:** `npm run verify` runs lint + tsc cleanly. Documented in `CLAUDE.md`.
- **Dependencies:** None.

---

## UI Primitives layer (UI)

Cross-cutting building blocks that other layers consume. Sequenced early in Sprint A1 so subsequent UI work adopts them from the start.

### UI-1. Typography utility component — ✅ Done (May 24, 2026; `src/components/ui/typography.tsx` shipped, `/admin/styleguide` page live for design QA, design system Section 3 updated to mark scale as enforced)

- **Why:** The design system (see `docs/cowork/llv_design_system.md` Section 3) defines a recommended type scale — Display, H1, H2, H3, Body, Body small, Caption, Mono — but the scale is not enforced anywhere in code. Without a primitive, every page will improvise its own classes, and the "elegant typography" principle (blueprint Section 2.3) will erode within a sprint. This task locks the scale in before the heavy UI sprints land. [CR-10]
- **What to build:** `src/components/ui/typography.tsx` exporting a set of polymorphic components that wrap the recommended scale:
    - `<Display>` — `text-5xl font-serif font-light` (Cormorant 300)
    - `<H1>` — `text-4xl font-serif font-normal` (Cormorant 400), defaults to `<h1>`
    - `<H2>` — `text-2xl font-serif font-normal`, defaults to `<h2>`
    - `<H3>` — `text-xl font-serif font-medium` (Cormorant 500), defaults to `<h3>`
    - `<Body>` — `text-base leading-relaxed`, defaults to `<p>`
    - `<BodySmall>` — `text-sm leading-relaxed`, defaults to `<p>`
    - `<Caption>` — `text-xs font-medium uppercase tracking-wider`, defaults to `<span>`
    - `<Mono>` — `font-mono text-sm`, defaults to `<span>` (used for SKUs, dollar amounts, timestamps per design system Section 3)
- **Component API:**
    - Each component accepts standard HTML attributes for its default tag plus `className` (merged via `cn()`).
    - Each accepts an optional `as` prop to render a different element while preserving the typographic treatment (e.g., `<H2 as="h1">` for a Display-sized H1 on a marketing page without breaking heading hierarchy).
    - Italic variants exposed via `italic` boolean prop on the serif components — italic Cormorant is the "signature voice" per design system Section 3.
- **Done when:**
    - `src/components/ui/typography.tsx` exists with all eight components and TypeScript types.
    - At least one existing page (recommend the client dashboard at `src/app/(client)/client/page.tsx`) is refactored to use the new components as a reference implementation.
    - Storybook is not required at Phase A; a simple `src/app/(admin)/admin/styleguide/page.tsx` rendering each variant is sufficient and useful for design QA.
    - Design system doc (`docs/cowork/llv_design_system.md` Section 3) is updated to mark the type scale as "enforced via `<Typography>` primitives in `src/components/ui/typography.tsx`."
- **Dependencies:** None. Should land before CX-1.
- **Sprint:** A1, sequenced early.
- **Footnote:** [CR-10] — the underlying palette and font choices are not yet ratified in the blueprint. UI-1 codifies the scale but does not commit Chat to it; if Chat later revises the type system, UI-1's implementation is the single point of update.

---

## Customer Experience layer (CX)

### CX-1. Client dashboard — actual content, not placeholder — ✅ Done (May 24, 2026)

- **Why:** `src/app/(client)/client/page.tsx` is a placeholder. The client's landing experience is the first impression of the "private concierge, not shipping dashboard" positioning (blueprint Section 2).
- **Done when:** Client dashboard shows: greeting + current address summary, count of items by status (received, in cleaning, stored, in transit, delivered), upcoming scheduled deliveries placeholder (Phase B will wire this), quick-action tiles for "Browse my wardrobe" and "Request an item" (Tier 3 entry point — link disabled with Coming Soon if Tier 3 routing not wired). Photography-forward design per blueprint Section 2.3.
- **Dependencies:** Status counts require a query helper (add to `src/lib/queries/items.ts` if not present).

### CX-2. Wardrobe catalog page (`/client/wardrobe`) — ✅ Done (May 24, 2026)

- **Why:** This is the Tier 3 differentiator surface — the client's browsable personal catalog. Without it, Tier 3 has nothing to ship against. Blueprint Section 2.1 first bullet.
- **Done when:** `/client/wardrobe` lists items the client owns with primary photo thumbnail, name, category, current status, current location. Grid layout, photography-forward. Filter by category, status, location. Sort by recently added / name. Pagination or infinite scroll. RLS-enforced (clients see only their own items). Empty state copy is concierge-toned, not utilitarian.
- **Dependencies:** CX-3 (item detail), DI-3 (photo upload — for items to have photos).

### CX-3. Item detail page (`/client/wardrobe/[id]`) — ✅ Done (May 24, 2026)

- **Why:** Click-through target from the wardrobe grid. Lets the client see full photo set, condition history, full metadata, and (in Phase B) request actions like "send to Arizona" or "schedule cleaning."
- **Done when:** Page renders item metadata (name, SKU, category, brand, color, size, season, purchase year), all photos (multi-angle gallery), condition history table, location/status timeline. RLS-enforced.
- **Dependencies:** None blocking.

### CX-4. Client intake submission page (`/client/wardrobe/intake`) — ✅ Done (May 24, 2026)

- **Why:** `intake-form` component exists in `src/components/client/` but isn't wired to a page or a server action that creates `items` + uploads photos in one flow. Without this, the client can't add to their own wardrobe.
- **Done when:** `/client/intake` lets a client (or admin acting on their behalf) submit a new item: required fields = name, category; optional = brand, color, size, material, season, purchase year, purchase price, care instructions, description; photo upload (multi-file, HEIC supported via `heic2any`). On submit, creates `items` row, uploads to `item-photos` bucket, creates `item_photos` rows, navigates to item detail. Toast confirmation via `sonner`.
- **Dependencies:** DI-3 (photo upload primitive).

### CX-5. Address management page (`/client/addresses`) — ✅ Done (May 24, 2026)

- **Why:** Corridor model depends on the system knowing both residences. The `addresses` table is built and supports multiple per client with an `is_primary` flag.
- **Done when:** Client can list, add, edit, mark-primary, delete addresses. Form captures label (e.g., "Brookfield primary," "Scottsdale winter"), street/city/state/postal, country (default US), delivery instructions. RLS-enforced.
- **Dependencies:** None.

### CX-6. Onboarding completion flow — ✅ Done (May 24, 2026)

- **Why:** `profiles.onboarding_complete` flag exists but nothing sets it. Per blueprint Section 2.2, onboarding is a defined sequence: application → consultation → intake → review → schedule → payment. Phase A should at minimum gate the dashboard until critical fields are captured.
- **Done when:** First login routes to `/client/onboarding` with a stepper: (1) profile basics (full name, phone, preferred contact), (2) primary residence address, (3) (optional) seasonal residence address, (4) tier selection placeholder. On completion, `onboarding_complete = true` and user is routed to `/client`. Subsequent logins bypass onboarding.
- **Dependencies:** CX-5 (address form components reusable here).
- **Note:** Payment (Stripe subscription setup) is deferred to Phase B per blueprint Section 6.1.

### CX-7. Concierge messaging stub — ✅ Done (May 24, 2026, table-backed implementation)

- **Why:** Blueprint Section 2.1 promises "direct concierge messaging with response-time guarantees." Phase A doesn't need a full inbox, but a "Contact your concierge" entry point should exist so clients know the channel exists.
- **Done when:** Persistent footer link or dashboard tile that opens a simple form (subject, message) → creates a record in a new `concierge_messages` table OR sends an email via the configured email provider [CR-4]. Acknowledgment confirms receipt. Admin sees an open queue in admin dashboard.
- **Dependencies:** Decision needed: table-backed (own queue) or email-only (Resend send) for Phase A. Recommend table-backed, since the queue feeds Phase B notification infrastructure.

---

## Operations Engine layer (OE)

### OE-1. Admin dashboard — operations console — ✅ Done (May 24, 2026)

- **Why:** Admin (founder + daughter) needs an operations cockpit before founding members can onboard. Currently `/admin/page.tsx` is a placeholder.
- **Done when:** Admin landing shows: count of clients by onboarding status, items by status across all clients, concierge message queue (depth + most recent), recent intake submissions, recent status transitions. Quick links to client roster, item search, provider roster.
- **Dependencies:** CX-7 (for message queue widget) is helpful but not blocking — placeholder card works.

### OE-2. Client roster (`/admin/clients`) — ✅ Done (May 24, 2026)

- **Why:** Admin needs to see every client, click into their profile, see their wardrobe, edit addresses on their behalf, edit `client_profiles.internal_notes`.
- **Done when:** List of all client profiles with search and filter (by onboarding status, tier). Detail view shows profile, addresses, wardrobe count, internal notes (editable), Stripe customer link (Phase B), full item list.
- **Dependencies:** None.

### OE-3. Item search and admin item detail (`/admin/items`, `/admin/items/[id]`) — ✅ Done (May 24, 2026)

- **Why:** Admin operates across all clients' items — searching by SKU, status, category, owner. Status transitions are admin-only (already enforced in `src/actions/items.ts` per `ITEM_STATUS_TRANSITIONS`).
- **Done when:** Admin can search/filter items globally; detail view exposes status-transition controls per the transition map, location label editing, internal notes, full photo set, condition history with ability to add new condition record.
- **Dependencies:** None.

### OE-4. Wisconsin / Arizona location vocabulary — ✅ Done (May 24, 2026; migration 007 shipped — 8 migrations total — `item_location` enum committed with controlled values for client/storage/provider/in-transit on both WI and AZ sides)

- **Why:** `items.location_label` is a free-text field. The corridor model needs a controlled vocabulary so the system can answer "what's in AZ right now?" reliably. Blueprint Section 4 (corridor) and Section 3.3 (location tracking) both depend on this.
- **Done when:** Either (a) introduce an `item_location` enum (`with_client_wi`, `with_client_az`, `storage_wi`, `storage_az`, `provider_wi`, `provider_az`, `in_transit_wi_to_az`, `in_transit_az_to_wi`) and migrate `location_label` to it, **or** (b) keep free text but add a structured `location_region` column (`WI` / `AZ` / `TRANSIT`) plus UI dropdown enforcement. Recommend (a) for query reliability; pure-text breaks Tier 3's "where is my evening gown right now" use case.
- **Dependencies:** Migration 007. Schema decision needs founder sign-off before Code commits — flag in `llv_needs_chat_review.md` if Code wants to defer.

### OE-5. Condition audit logging on status transition — ✅ Done (May 24, 2026; incorporated into OE-3 admin item detail. Filesystem-verified May 24, 2026: `StatusTransitionPanel` enforces condition entry on `received` / `cleaning_complete` / `delivered` / `damaged` transitions per spec via a `CONDITION_REQUIRED` map; standalone `AddConditionForm` provides the independent "add condition" affordance; `adminAddCondition` server action and condition history display on `/admin/inventory/[id]` all wired through the `item_conditions` table.)

- **Why:** Blueprint Section 3.3 requires "detailed condition documentation at intake and each service touchpoint." The `item_conditions` table exists; the wiring doesn't.
- **Done when:** Status transitions to `received`, `cleaning_complete`, `delivered`, `damaged` prompt for a condition record (level + notes + optional issues jsonb). Admin UI surfaces an "add condition" affordance independently as well.
- **Dependencies:** OE-3 (admin item detail page is where this lives).

---

## Provider Network layer (PN)

### PN-1. Provider roster (`/admin/providers`) — ✅ Done (May 24, 2026)

- **Why:** Founder needs to add RAVE FabriCARE, European Couture Cleaners, Mastel Dry Cleaning, and eventual WI providers into the system before Phase B's dispatch engine has anything to dispatch to. Table exists; UI doesn't.
- **Done when:** Admin can list, add, edit, deactivate providers. Form captures business name, contact, email, phone, full address, services offered (multiselect from `service_type` enum), capacity per week, turnaround min/max days, notes. Stripe Connect linkage deferred to Phase B.
- **Dependencies:** None.

### PN-2. Provider portal — landing page only (Phase A scope) — ✅ Done (May 24, 2026)

- **Why:** Phase A includes auth and role-based access for providers. The portal itself (queue, status updates, photo upload, SLA dashboard) is Phase B per blueprint Section 6.1. But the landing page should not be a placeholder when a provider logs in for the first time.
- **Done when:** `/provider/page.tsx` shows: welcome message naming the provider, "Your dashboard will be activated when the dispatch engine launches in Phase B" copy, contact channel to LLV admin, list of items currently assigned (placeholder if none — Phase B wires the assignments table).
- **Dependencies:** Provider must be linked to a `profiles` row via `providers.profile_id` to log in.

---

## Data & Intelligence layer (DI)

### DI-1. Query helpers for common reads — ✅ Done (May 24, 2026)

- **Why:** Several UI tasks (CX-1, CX-2, OE-1, OE-2) need the same queries — items by status for a client, items by location, item with photos + conditions joined, etc. Currently every page would re-implement. Extract once.
- **Done when:** `src/lib/queries/` directory exists with: `items.ts` (getItemsByClient, getItemById with photos and conditions, getItemStatusCounts, getItemsByLocation), `clients.ts` (getClientWithAddresses, getAllClientsWithItemCounts), `providers.ts` (getActiveProviders). All RLS-respecting (use server-side client). Server-component-friendly (no client hooks).
- **Dependencies:** None.

### DI-2. Photo upload primitive — ✅ Done (May 24, 2026)

- **Why:** Several tasks (CX-2, CX-3, CX-4, OE-3, OE-5) all upload photos. Same logic in five places is a bug factory.
- **Done when:** `src/lib/storage/upload-photo.ts` exports `uploadItemPhoto({ itemId, file, photoType, sortOrder, caption })`. Handles: HEIC→JPEG conversion via `heic2any`, max 10 MB enforcement, MIME validation against bucket policy, storage path convention (`{client_id}/{item_id}/{uuid}.{ext}`), creates `item_photos` row, returns public/signed URL. Server-side or client-side helpers both available.
- **Dependencies:** None.

### DI-3. AI photo categorization (item suggestion) [CR-9] — ✅ Done (May 24, 2026, using Haiku 4.5 via Inngest)

- **Why:** Blueprint Section 3.2: "intelligent item categorization from photos." This is real leverage at intake — uploading a photo and getting suggested category, brand text, color, suggested name.
- **Done when:** Inngest function `categorize-item-photo` triggers on `item_photos` insert. Calls Anthropic Claude API with the photo and a structured prompt. Response is parsed into `item_photos.ai_analysis` (jsonb): `{ suggestedCategory, suggestedName, detectedBrand, detectedColor, conditionFlags, confidence }`. Intake UI (CX-4) shows the AI suggestions inline as editable defaults.
- **Dependencies:** DI-2.
- **Footnote:** Model selection ratified by Chat (May 25, 2026) — **Haiku 4.5** for photo categorization (cost-efficient at high volume). Sonnet 4.6 available for higher-tier concierge features but no decision needed yet. See `llv_needs_chat_review.md` Resolved Item 9.

### DI-4. Photo storage strategy — active vs. archival [CR-3] — ✅ Done (May 25, 2026)

- **Chat ruling (May 25, 2026):** Supabase Storage only. No Cloudflare R2 for Phase A or B.
- **Implemented:**
  - `src/lib/storage/constants.ts` — bucket names (`item-photos`, `item-photos-archive`), `PhotoStorage` interface, `PhotoType`, validation config. All bucket references centralised here.
  - `src/lib/storage/server.ts` — `PhotoStorage` implementation using admin client. Exports: `getSignedUrl`, `getSignedUrls`, `downloadPhoto`, `deletePhoto`, `listPhotosByItem`, `moveToArchive`. Swap-ready: replacing Supabase Storage with R2 is a change to this file only.
  - `src/lib/storage/upload-photo.ts` — browser upload unchanged, now imports constants from `constants.ts`.
  - Migration `009_photo_archive_bucket.sql` — creates `item-photos-archive` bucket with admin write + client read-own policies.
  - All server-side signed URL calls (wardrobe page, item detail, admin detail) updated to use `getSignedUrls` from `server.ts` instead of direct Supabase calls.
  - Inngest `categorize-photo` function updated to use `downloadPhoto` from `server.ts`.

---

## Out of Phase A scope (do not start; listed for traceability)

These belong to Phase B (Aug 2026) per blueprint Section 6.1 and should not be picked up during Phase A unless founder explicitly redirects:

- Scheduling and seasonal calendar engine
- Provider portal full feature set (queue, SLA dashboard, capacity management)
- Provider dispatch workflow + assignment table
- Status-change notification system (Resend email + Twilio SMS triggers)
- Stripe subscription management + per-request billing
- Inngest workflow library beyond DI-3 (scheduled dispatch, seasonal triggers)

---

## Cross-cutting non-functional requirements

Apply to every task above:

- **RLS first.** Every query must respect row-level security. Never use the admin client from a client-facing route. Re-verify `auth.getUser()` in every server action.
- **Photography-forward visual design.** Blueprint Section 2.3. Tasks affecting client-facing surfaces must use generous whitespace, large photo treatments, and the Cormorant Garamond / Inter type pairing.
- **Three-tap maximum.** Any core client task should be reachable within three interactions from `/client`.
- **Dark/light mode.** All new components support both via the existing theme infrastructure.
- **Accessible.** Base UI primitives provide accessibility — preserve it. Form fields labeled, focus states visible, color contrast WCAG AA.

---

## Footnote index — Chat-review items referenced above

**All resolved by Chat on May 25, 2026.** Retained here for historical traceability of the task breakdown. See `llv_needs_chat_review.md` Resolved section for full rulings.

- **[CR-3]** Photo storage strategy. **Resolved:** Supabase Storage only; R2 cold archival deferred to Phase 4+. Tasks affected: DI-4 (now Done).
- **[CR-4]** Email provider. **Resolved:** Resend (replaces SendGrid in blueprint). Tasks affected: CX-7.
- **[CR-6]** Inngest absent from blueprint. **Resolved:** Inngest added to blueprint Section 5 as Background Jobs. Tasks affected: DI-3 and all Phase B background jobs.
- **[CR-7]** Shadcn/UI on Base UI absent from blueprint. **Resolved:** UI Components row added to blueprint Section 5. Tasks affected: all CX and OE UI tasks.
- **[CR-8]** Next.js 16 vs. blueprint/CLAUDE.md "Next.js 15". **Resolved:** Next.js 16 confirmed as the runtime; CLAUDE.md fixed via F-1. Tasks affected: F-1 (done), all tasks (the runtime).
- **[CR-9]** AI model selection. **Resolved:** Haiku 4.5 for photo categorization; Sonnet 4.6 available for higher-tier features. Tasks affected: DI-3 (ratified).
- **[CR-10]** Design system absent from blueprint. **Resolved:** Design System row added to blueprint Section 5 referencing `docs/cowork/llv_design_system.md`. Tasks affected: F-2 (done), all CX tasks (the application).

See `llv_needs_chat_review.md` at project root for the full per-item rulings.

---

*End of Phase A task breakdown. Cowork will update this document when founder revises sprint composition, when needs-chat-review items resolve, or when Code reports tasks complete.*
