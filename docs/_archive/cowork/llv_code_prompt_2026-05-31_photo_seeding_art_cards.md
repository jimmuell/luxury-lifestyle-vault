# Code Prompt — Replace Unsplash seed photos with deterministic Category Art Cards + harden the upload pipeline

**Date:** 2026-05-31
**Author:** Cowork (per DIVISION_OF_LABOR.md — Cowork specs, Code implements)
**Polish todo:** `docs/cowork/llv_engineering_polish_todos.md` → "Photo seeding architecture" + "Unsplash production access"
**Bug Fix Cycle:** add a new entry (see end of this prompt) after shipping.

---

## Context

Seed wardrobe photos currently come from a runtime Unsplash fetch (`fetchUnsplashPhotos()`), which is temp-disabled because the Unsplash demo key (50 req/hr) returns **403** when over-quota (not 429), defeating the rate-limit guard and burning the whole quota on a single ~118-photo seed run. The interim stub leaves seed items with no displayable photo, so the wardrobe falls back to bare category **text** on a gray box.

Founder decision (Jim, May 31): **drop Unsplash entirely.** Instead of stock photography, render a deterministic, theme-aware **Category Art Card** for any item that has no real uploaded photo — a bespoke gold line glyph + the item's brand/name in the brand serif, inside the Obsidian & Ivory design system. The card is replaced automatically the instant a client uploads a real photo.

This is a **display-layer** solution, not a data hack: it applies to every item without a photo (seeded OR a real client's empty wardrobe), needs zero image assets, zero network calls, and is fully deterministic across all environments.

Jim also flagged a real storage concern: confirm the app uploads/stores images efficiently so we don't accrue tech debt. We do not today — see Part E.

---

## Scope (six parts)

- **A.** Build a reusable `CategoryArtCard` component (+ the 14 category glyphs).
- **B.** Wire it into every render site that currently shows a photo-or-text-fallback.
- **C.** Keep seed `ai_analysis` (AI search depends on it) but ensure seed rows never render a broken image.
- **D.** Delete the Unsplash pipeline.
- **E.** Harden the real upload path: client-side downscale + re-encode before upload.
- **F.** `next.config.ts` cleanup.

Stack reminders from `CLAUDE.md`: Next.js 16 App Router, Tailwind v4, Base UI (no `asChild` — use `buttonVariants`), Lucide for UI icons (custom single-purpose SVG is explicitly allowed where Lucide lacks an icon — that is the case here, garments). Run `npm run verify` before committing.

---

## Part A — `CategoryArtCard` component

Create `src/components/wardrobe/category-art-card.tsx` (new `wardrobe/` folder under components is fine).

**Requirements**

- Props:
  ```ts
  interface CategoryArtCardProps {
    category: ItemCategory          // from '@/types/app'
    name?: string                   // item name — the focal serif text
    brand?: string | null           // small uppercase eyebrow
    className?: string              // so callers control aspect ratio / sizing
    size?: 'grid' | 'list' | 'detail'  // controls glyph size + which text shows
  }
  ```
- Theme-aware via existing CSS variables / Tailwind tokens — **do not hardcode hex.** Map the mockup's brand colors to the design tokens already in `globals.css`:
  - card background → `bg-card` (ivory `#F8F4EE` light / charcoal `#1A1A1A` dark)
  - glyph stroke + monogram + hairline frame + category label → `text-accent` / `border-accent` (gold `#C9A96E`, already a token)
  - item name → `text-foreground` in the serif face
  - brand eyebrow → `text-muted-foreground`
  Gold is theme-stable (same `--accent` in both modes), so it reads on both ivory and obsidian — confirm visually.
- Structure (matches the approved mockup):
  1. Relative container filling the caller's box (`className` sets aspect ratio).
  2. Inset hairline frame: absolutely positioned, `inset-[9px]`, `border border-accent/40 rounded-[3px]`.
  3. Small `LLV` monogram top-left, `text-[9px] tracking-[0.34em] text-accent`.
  4. Centered category glyph (see glyph set below), stroked in `currentColor` with the parent setting `text-accent`.
  5. Category label: `text-[9px] tracking-[0.32em] uppercase text-accent`.
  6. `brand` eyebrow (if present): `text-[8.5px] tracking-[0.26em] uppercase text-muted-foreground`.
  7. `name` (if present): serif (`font-serif` — Cormorant Garamond is already loaded via `next/font` in the root layout; confirm the class/variable name used in `globals.css`), `text-foreground`.
- `size` controls glyph px + which text shows: `grid` ≈ 46px glyph, brand+name+category; `list` ≈ 22px glyph, category only (compact); `detail` ≈ 64px glyph, all text larger.
- The component is presentational and **server-safe** (no `'use client'`, no hooks) so it can render in Server Components (wardrobe page, item detail, admin inventory) without shipping JS.

**Glyph set — `src/components/wardrobe/category-glyphs.tsx`**

Export `CATEGORY_GLYPHS: Record<ItemCategory, React.FC<{ className?: string }>>`. Each glyph is an inline `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">` so it inherits gold from the parent and scales with `width`/`height` set by `CategoryArtCard`. Consistent 1.3 stroke across all 14.

These six are the **canonical style reference** — use them verbatim (drawn for the approved mockup):

```tsx
// eveningwear — flared gown
<path d="M20 9 L22.5 16 M28 9 L25.5 16"/><path d="M22.5 16 L19 30 L15 44 L33 44 L29 30 L25.5 16 Z"/><path d="M19 30 L29 30"/>

// suiting — jacket with lapels
<path d="M16 10 L24 22 L32 10"/><path d="M16 10 L14 44 L24 40 L34 44 L32 10"/><path d="M24 22 L24 40"/><circle cx="24" cy="29" r="0.9" fill="currentColor"/><circle cx="24" cy="34" r="0.9" fill="currentColor"/>

// handbags — Kelly-style bag + handle
<path d="M14 20 L34 20 L31 40 L17 40 Z"/><path d="M19 20 C19 12 29 12 29 20"/>

// footwear — pump
<path d="M14 31 C21 31 27 29 32 25 L35 25 C37 28 35 31 31 31 Z"/><path d="M31 31 L32 40 L35 40"/>

// outerwear — long coat with belt ticks
<path d="M18 10 L24 16 L30 10 L34 14 L31 44 L17 44 L14 14 Z"/><path d="M24 16 L24 44"/><path d="M14 27 L17 27 M31 27 L34 27"/>

// accessories — bow tie
<path d="M16 18 L24 24 L16 30 Z"/><path d="M32 18 L24 24 L32 30 Z"/><rect x="22" y="21.5" width="4" height="5" rx="1"/>
```

Draw the remaining **eight** in the same restrained, single-weight line style (no fills except tiny accent dots; keep within a centered ~20–34px band of the 48px box):

- **shirts_blouses** — dress shirt: collar V, button placket centerline with 2–3 dots, two sleeves.
- **trousers_skirts** — trousers: waistband + two tapering legs.
- **dresses** — A-line day dress (simpler/shorter than the eveningwear gown; cap sleeves).
- **knitwear** — crewneck sweater with ribbed cuffs/hem (short horizontal tick lines at wrists + waist).
- **activewear** — athletic tank top (scooped neck, racer straps).
- **swimwear** — one-piece swimsuit silhouette.
- **lingerie** — camisole (thin straps, gentle scalloped hem) — keep tasteful and abstract.
- **other** — a clothes hanger (universal garment mark).

Keep every glyph legible at 22px (list size). Founder will review the final set visually; match the discipline of the six above.

---

## Part B — Wire `CategoryArtCard` into all render sites

Replace the current "if photo exists show `<Image>`, else show category **text**" branches with "…else show `<CategoryArtCard>`." Sites:

1. `src/components/client/wardrobe-catalog-shell.tsx`
   - Grid view (~lines 231–246): the `aspect-[4/5]` tile — replace the text fallback (`<div className="absolute inset-0 …">{ITEM_CATEGORY_LABELS[...]}`) with `<CategoryArtCard category={item.category} name={item.name} brand={item.brand} size="grid" className="absolute inset-0" />`.
   - List view (~lines 198–211) and search-results list (~lines 146–159): the small `w-12 h-12` / `w-10 h-10` thumb — use `size="list"` (glyph only).
2. `src/components/client/item-photo-carousel.tsx` — when the item has **no** photos at all, render a `size="detail"` `CategoryArtCard` in place of the carousel. (It currently assumes `signedUrl`s exist.)
3. `src/app/(client)/client/wardrobe/[id]/page.tsx` — item detail: pass the no-photo case through the carousel change above (and/or render the card directly if the page composes photos itself).
4. `src/app/(client)/client/outfits/page.tsx`, `outfits/[id]/page.tsx`, `outfits/[id]/edit/page.tsx`, `outfits/new/page.tsx` — outfit item thumbnails: `size="list"`. (Bug #3 history: outfit cards once showed "No items" due to a photo-query gap — the art card removes the empty-thumbnail failure mode entirely.)
5. `src/app/(client)/client/orders/page.tsx` — order line-item thumbnails: `size="list"`.
6. `src/app/(admin)/admin/inventory/[id]/page.tsx` — admin item detail: `size="detail"` when no photo.

After this, `ITEM_CATEGORY_LABELS[...]`-as-image-placeholder usages should be gone (the labels are still used as real text labels elsewhere — leave those).

---

## Part C — Seed rows: keep analysis, never render a broken image

`src/lib/seed/seed-photos.ts` inserts an `item_photos` row per seed item with a **fake** `storage_path` (`…/seed-main.jpg`, no file) plus `ai_analysis`. **Keep inserting the `ai_analysis` row** — `src/actions/search.ts` reads `item_photos.ai_analysis` to enrich AI search, so removing it would degrade seeded search.

Make the "no displayable image" path explicit rather than relying on Supabase silently returning a null signed URL for the missing object:

- In `src/app/(client)/client/wardrobe/page.tsx` photo-resolution (~lines 41–69): also select `is_seed_data` from `item_photos`, and **skip signing** any row that is a seed/placeholder row (or, more general: skip rows whose `storage_path` ends in `seed-main.jpg`). Seed rows therefore never enter `needSigning`, `photoMap[itemId]` stays unset, and the render site shows the `CategoryArtCard`. Apply the same skip logic anywhere else that signs seed photo paths.
- Net effect: AI search keeps its seeded analysis; the UI deterministically shows art cards for seed items; no dependency on signing-failure side effects.

(Optional, cleaner-but-bigger: add an `is_placeholder boolean` column to `item_photos` and key off that. Not required — the `is_seed_data`/path check is sufficient and migration-free. Your call.)

---

## Part D — Remove the Unsplash pipeline

- Delete `src/lib/seed/fetch-unsplash-photos.ts` and `src/scripts/fetch-seed-photos.ts`.
- `src/lib/seed/seed-all.ts`: remove the `fetchUnsplashPhotos` import, the `unsplashPhotos` stub (Tier 8 block), the `unsplashPhotos` field from `AllSeedsResult`, and its terms from the `totalSeeded/totalSkipped/totalErrors` sums.
- `src/components/admin/seed-runner.tsx`: remove the standalone **"Fetch Wardrobe Photos"** button/card and its temp-disabled `Dialog` (the one explaining the Unsplash disable, ~line 523+). With art cards there is **no separate photo step**, which also makes the deferred "runs separately from Seed All" / amber warning badges in the polish todo unnecessary — do not build them; note in the todo that they're obsoleted by this rewrite.
- Remove `UNSPLASH_ACCESS_KEY` from any required-env validation and from `.env.example` / README if listed.
- Check `src/lib/seed/manifest.ts` and `src/actions/seed.ts` for any photo-fetch wiring (`SEED_MANIFEST` entry, server action) and remove those too.
- Grep the repo for `unsplash` (case-insensitive) and clear stragglers.

---

## Part E — Harden the real upload pipeline (Jim's tech-debt caveat)

Today `src/lib/storage/upload-photo.ts` stores the **full-resolution original** (up to `MAX_PHOTO_BYTES` = 10MB), converting only HEIC→JPEG. No downscale, no re-encode, no thumbnail. A client's 8MB phone photo is stored and served at full size into a 200px grid tile.

Add a client-side downscale/re-encode step in `uploadItemPhoto`, **after** the existing `toJpeg()` HEIC step and **before** `validate()`/upload:

- Decode via `createImageBitmap(file)` (fallback to an `<img>`+`onload` if needed).
- If the longest edge > **2048px**, scale down to a 2048px long edge (preserve aspect); otherwise keep dimensions.
- Re-encode through a `canvas`/`OffscreenCanvas` `toBlob` to **WebP at quality ~0.82**, with a **JPEG ~0.85 fallback** for browsers without WebP encode support. Update the filename extension + `contentType` accordingly.
- Re-run `validate()` on the result (it will now almost always be well under 10MB).
- Skip downscale for non-raster types if any slip through; keep the existing MIME allowlist.
- Keep the upload path/RLS prefix (`${clientId}/${itemId}/…`) and the `item_photos` insert unchanged.

Thumbnails: a separate stored thumbnail variant (and an `item_photos.thumbnail_path` column) is **optional future work** — for now the single downscaled original plus `next/image` responsive `sizes` is sufficient (grid already passes a good `sizes`; verify list/detail use `next/image` sensibly). Do **not** add a migration for thumbnails in this prompt unless you find the grid is still over-fetching.

Confirm `MAX_PHOTO_BYTES`/`ALLOWED_PHOTO_MIME_TYPES` in `src/lib/storage/constants.ts` still make sense (WebP is already allowed ✓).

---

## Part F — `next.config.ts`

- Remove the `images.unsplash.com` remote pattern (no longer used after Part D).
- Keep the local (`127.0.0.1:54321`) and hosted (`*.supabase.co`) Supabase patterns.
- Note: Vercel image optimization fetches the signed Supabase URL server-side; signed URLs expire (1h TTL). This is acceptable now; if cache-miss-after-expiry 404s show up later, revisit (e.g., longer TTL for display or public read on the active bucket). Out of scope here.

---

## Verification

1. `npm run verify` clean (lint + types). Watch for now-unused imports after deletions.
2. Admin → Seed Data → **Clear All**, then **Seed All**. Confirm: no "Fetch Wardrobe Photos" button, seed completes with no Unsplash step, no errors.
3. Client wardrobe (seeded client, e.g. `client1@test.llv.com`): grid + list both show gold **Category Art Cards** with correct glyph/brand/name per item — no gray text boxes, no broken images. Toggle Light/Dark — cards read correctly in both.
4. Item detail, an outfit, and an order line — all show art cards where no photo exists.
5. AI search still returns sensible seeded results (proves `ai_analysis` survived).
6. Real upload: upload a large (>3MB, >2048px) photo as a client. Confirm the stored object in Supabase Storage is WebP/JPEG, materially smaller, ≤2048px long edge; the real photo replaces the art card in grid + detail.
7. `grep -ri unsplash src` returns nothing meaningful.

## Bug Fix Cycle entry to add to `llv_session_handoff.md` after shipping

> | NN | 2026-05-31 | Medium | Seed / Wardrobe UX | Replaced the Unsplash runtime seed-photo fetch with deterministic, theme-aware **Category Art Cards** (bespoke gold line glyph + brand/name in Cormorant, per the 14 item categories) rendered wherever an item has no real photo. Removed `fetch-unsplash-photos.ts`, `scripts/fetch-seed-photos.ts`, the seed-runner photo-fetch button/dialog, the `unsplashPhotos` plumbing in `seed-all.ts`, and the `images.unsplash.com` next.config pattern; dropped `UNSPLASH_ACCESS_KEY`. Seed `ai_analysis` retained for AI search; seed photo rows are explicitly skipped during URL signing. Also hardened `uploadItemPhoto`: client-side downscale to ≤2048px long edge + WebP/JPEG re-encode before upload, ending full-resolution-original storage. | ✅ FIXED |
