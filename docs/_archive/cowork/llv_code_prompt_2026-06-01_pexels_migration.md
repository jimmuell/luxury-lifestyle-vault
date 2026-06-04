# Code Prompt — Migrate seed-photo fetch from Unsplash to Pexels
**Date:** 2026-06-01
**Author:** Cowork (for Claude Code)
**Priority:** Medium (seed/demo photo quality)
**Area:** Seed data / wardrobe photos

## Context
The seed-photo pipeline currently fetches from Unsplash. Two problems drove this decision: (1) Unsplash demo tier is capped at **50 req/hr**; (2) an unresolved failure where the app's **server-side fetch returns a non-200** (the code mislabels it "Rate limited after 0 items") even though a `curl` from the same Mac with the same key returns **HTTP 200, x-ratelimit-remaining: 49**. We exhaustively ruled out (June 1 QA): bad/missing key, exhausted quota, wrong app, whitespace in key, shell env override, stale dev server, proxy vars, and User-Agent. The failure lives inside the running server's request/response, which the current code discards.

Decision: **switch the seed-photo source to the Pexels API** (200 req/hr, 20,000/month, commercial use OK, and notably *no* required download-trigger call — simpler than Unsplash). Keep the existing pipeline architecture; swap the provider and add diagnostic logging so any remaining failure is self-describing.

Live files (do NOT rearchitect — edit in place):
- `src/lib/seed/photo-fetch.ts` — `searchUnsplash()` + `fetchOnePhoto()` (server-action core).
- `src/scripts/fetch-seed-photos.ts` — standalone CLI equivalent.
- `src/components/admin/seed-runner.tsx` — "Fetch Wardrobe Photos" card copy.
- `next.config.ts` — image remote patterns.
- `src/actions/seed.ts` — no change (wrapper stays).

Unchanged behaviors to preserve: Category Art Card fallback; the `seed-main.jpg` eligibility filter (`is_seed_data = true AND storage_path LIKE '%/seed-main.jpg' AND public_url IS NULL`); download-image-then-store-in-Supabase; idempotent + resumable; the per-call work unit + client loop.

## Changes

### 1. Provider swap → Pexels
Replace the Unsplash search function with a Pexels equivalent in both `photo-fetch.ts` and `fetch-seed-photos.ts`:
- **Endpoint:** `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`
- **Auth header:** `Authorization: ${process.env.PEXELS_API_KEY}` — the **raw key, with NO `Client-ID`/`Bearer` prefix** (this differs from Unsplash; getting it wrong yields 401).
- Also send a `User-Agent` header, e.g. `'LuxuryLifestyleVault/1.0'`.
- **Response parsing:** image URL = `data.photos?.[0]?.src?.large` (fallback `src.portrait`). Capture attribution: `data.photos[0].photographer`, `data.photos[0].photographer_url`, and `data.photos[0].url` (the Pexels photo page).
- **Rate-limit headers:** Pexels returns `X-Ratelimit-Limit`, `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` — keep the existing floor check (`<= 5` → stop early).
- Keep the existing category/accessory/brand query-building logic (`CATEGORY_TERMS`, `ACCESSORY_TERMS`, `SEARCHABLE_BRANDS`) as-is — it's provider-agnostic.

### 2. Env
- Add `PEXELS_API_KEY` (local `.env` + Vercel). Read it in the fetch path.
- Update the missing-key guard message to name `PEXELS_API_KEY`.
- You may leave `UNSPLASH_ACCESS_KEY` in place but the fetch path no longer uses it.

### 3. Diagnostic logging (REQUIRED — this is why we keep getting stuck)
Before returning the "rate limited" sentinel, capture and surface the real response so the next run is self-explanatory:
- `console.error` (visible in Vercel runtime logs / local `npm run dev` console): `res.status`, raw `X-Ratelimit-Limit` + `X-Ratelimit-Remaining`, the first ~200 chars of the response body, and a masked key fingerprint (length + last 4 chars).
- Thread a short reason string back into the admin seed-runner Output Log entry, e.g. `"Pexels 401 (remaining=199, body=…)"`.
- **Distinguish** the cases — `401` (bad key), `403`, `429`, `200-with-low-remaining`, other — instead of collapsing all of them into "rate limited."

### 4. Attribution
- Migration: add (if not already present) `attribution_name text`, `attribution_url text`, `attribution_source_url text` to `item_photos` (nullable). (A single `attribution jsonb` is fine if it matches conventions.)
- Store the Pexels photographer name / url / photo-page url on each fetched seed photo.
- Display "Photo by &lt;name&gt; on Pexels" (linking the photographer and Pexels) at least on item detail, per Pexels attribution guidelines. Real client uploads have null attribution → render nothing.

### 5. UI + config
- `seed-runner.tsx`: change the "Fetch Wardrobe Photos" card copy from "Downloads Unsplash photos…" to "Downloads Pexels photos…".
- `next.config.ts`: add an `images.pexels.com` remote pattern (harmless even though photos are downloaded into Supabase).

### 6. Efficiency (optional)
Per-category batching (one `per_page=30` search per category, distribute results across that category's items) is still nice-to-have but lower urgency at 200/hr. Keep the 45/run cap + resume as a safety net.

## Acceptance criteria
- Running "Fetch Photos" populates seed photos (item_photos count climbs; photos display in the wardrobe).
- If a fetch fails, the Output Log **and** server console name the real HTTP status + remaining + body snippet (no more opaque "rate limited").
- Attribution stored and shown on item detail.
- Idempotent + resumable preserved; `npm run verify` clean.

## Operational steps for Jim (outside Code)
1. **Get a Pexels API key:** sign up at https://www.pexels.com/api/ → generate an API key (free, instant).
2. **Validate it from your Mac** before wiring anything (this also tells us if the app-side failure is provider-specific):
   ```bash
   curl -s -D - -o /dev/null "https://api.pexels.com/v1/search?query=luxury+coat&per_page=1&orientation=portrait" -H "Authorization: <YOUR_PEXELS_KEY>"
   ```
   Expect `HTTP/2 200` + `x-ratelimit-remaining` headers.
3. **Set `PEXELS_API_KEY`** in local `.env` and in Vercel (Settings → Environment Variables), redeploy.
4. Hand this prompt to Claude Code. After it ships, run "Fetch Photos" from local `npm run dev` (writes to the shared hosted DB; Vercel displays the result). If it still fails, the new logging will tell us exactly why.
