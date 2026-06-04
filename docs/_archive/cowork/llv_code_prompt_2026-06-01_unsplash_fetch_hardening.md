# Code Prompt — Unsplash seed-photo fetch: efficiency + guideline compliance
**Date:** 2026-06-01
**Author:** Cowork (for Claude Code)
**Priority:** Medium (quality/compliance; not a launch blocker)
**Area:** Seed data / wardrobe photos

## Context (read first)
The Unsplash seed-photo pipeline is **already live**, contrary to what the handoff's Bug Log #19/#23 imply. Git history shows it was disabled (#19), removed with Category Art Cards added (#23), and then **rebuilt** in commits `7c3cdca` ("rebuild Unsplash seed-photo fetch with rate-limit handling") and `ebc533e` ("restore Fetch Wardrobe Photos card to seed runner UI"). Current HEAD has **both**: Category Art Cards as the photo fallback/empty-state, and a working Unsplash fetch behind the admin "Fetch Wardrobe Photos" button. The handoff was never updated to reflect the rebuild — treat the code, not the handoff, as truth.

Live files:
- `src/lib/seed/photo-fetch.ts` — `fetchOnePhoto()`, the server-side core (one item per call; client loops).
- `src/scripts/fetch-seed-photos.ts` — standalone CLI equivalent.
- `src/actions/seed.ts` — `fetchNextSeedPhoto()` server-action wrapper.
- `src/components/admin/seed-runner.tsx` — `handleFetchPhotos()` client loop + "Fetch Photos" button.
- `src/lib/seed/seed-photos.ts` — inserts `item_photos` rows with placeholder `storage_path = <client>/<item>/seed-main.jpg`, `public_url = null`, plus seeded `ai_analysis`.

Eligibility filter used everywhere: `item_photos` WHERE `is_seed_data = true AND storage_path LIKE '%/seed-main.jpg' AND public_url IS NULL`. Once an item is fetched, `storage_path` becomes `…/main.jpg`, so it drops out of the filter (idempotent).

## Problems to fix
1. **Inefficient — one search call per item.** Both `photo-fetch.ts` and `fetch-seed-photos.ts` call `GET /search/photos?...&per_page=1` once per item. ~100 items ⇒ ~100 JSON calls to `api.unsplash.com`, which blows the **demo-tier 50 req/hr** cap. (Image-file downloads from `images.unsplash.com` do NOT count — only `api.unsplash.com` JSON calls do.)
2. **Missing the required `/download` trigger.** Unsplash's API Guidelines require hitting `photo.links.download_location` (with the `Client-ID` header) whenever the app actually uses a photo. We never do this — the developer dashboard shows **0 downloads / 30 days**, confirming the gap. This is mandatory for production-access approval.
3. **No attribution captured or displayed.** Guidelines require crediting the photographer (name + linked profile, with UTM params) and linking back to Unsplash. We store none of this.

## Required changes

### 0. (Priority — diagnostic) Stop masking the real HTTP response
**Symptom under investigation (June 1):** `searchUnsplash()` returns `'rate_limited'` whenever the response is HTTP 403/429 *or* `X-Ratelimit-Remaining <= 5`. During QA, a `curl` from the founder's Mac to the same endpoint with the same key returned **HTTP 200, x-ratelimit-remaining: 49** (healthy), yet the in-app fetch reported "Rate limited after 0 items," and the Unsplash app dashboard (961550) showed **50/50 remaining, no traffic** — i.e. the app's requests aren't reaching/counting on that app, and "rate limited" is almost certainly a **mislabeled 403 or a stale-key 403**, not a real quota hit.

Make the failure self-describing so it can be diagnosed in one run:
- In `searchUnsplash` (both `src/lib/seed/photo-fetch.ts` and `src/scripts/fetch-seed-photos.ts`), before returning `'rate_limited'`, capture and surface: `res.status`, the raw `X-Ratelimit-Limit` and `X-Ratelimit-Remaining` header values, and the first ~200 chars of the response body. `console.error` it (shows in Vercel runtime logs / local console) **and** thread a short reason string back so it lands in the admin seed-runner Output Log entry (e.g. `"Unsplash 403 (remaining=49, body=…)"`).
- Distinguish the three cases in the returned/logged reason: (a) real low quota (`remaining <= floor` on a 200), (b) HTTP 403/429, (c) other non-OK status — instead of collapsing them all into "rate limited."
- Also log (masked) which key is in use at runtime: `UNSPLASH_ACCESS_KEY` length + last 4 chars, so a stale/wrong key is obvious in the log.

This is the fastest path to root cause; do it first.

### 1. Batch searches per category (cut JSON calls ~100 → ~15)
Refactor so the unit of work is a **category**, not a single item:
- For each distinct seed category that still has eligible items, make **one** `GET /search/photos?query=<categoryTerms>&per_page=30&orientation=portrait` call and hold the result pool for that category.
- Assign **distinct** photos from the pool to the items in that category (cycle through results; avoid reusing the same photo within a category where pool size allows).
- Keep the existing accessory sub-term logic (`ACCESSORY_TERMS`) — for accessories, group by resolved sub-term and do one search per sub-term.
- Preserve the existing per-call work-unit pattern that keeps each server action under the Vercel serverless timeout: process **one category (or accessory sub-term) per `fetchNext…` invocation**, and have `handleFetchPhotos()` loop over categories instead of items. If a single category's downloads risk the timeout, cap downloads-per-invocation (e.g. 12) and resume on the next call. Keep the rate-limit floor check (`X-Ratelimit-Remaining`), the 429/403 handling, and the idempotent resume behavior.

### 2. Trigger the Unsplash download endpoint (compliance)
- For every photo actually downloaded/used, call `GET <photo.links.download_location>` with header `Authorization: Client-ID <UNSPLASH_ACCESS_KEY>`. Fire-and-log on failure (don't fail the upload over it), but do attempt it for each used photo.
- Note this is a JSON call that counts against the rate limit (~1 per populated photo). Combined with §1 this keeps total JSON calls ≈ (#categories) + (#photos used). Acceptable on production tier; on demo tier the existing 45/run cap + resume covers it.

### 3. Capture + display attribution
- **Migration:** add columns to `item_photos`: `attribution_name text`, `attribution_username text`, `attribution_link text` (nullable). (Or a single `attribution jsonb` if you prefer — match existing conventions.)
- When uploading a fetched photo, also fetch from the search result and store `photo.user.name`, `photo.user.username`, and `photo.user.links.html`.
- Surface attribution wherever a seeded Unsplash photo is displayed (at minimum item detail; ideally a small caption/overlay on the wardrobe card). Format per guidelines: `Photo by <Name> on Unsplash`, with the photographer link as `<photo.user.links.html>?utm_source=<app_name>&utm_medium=referral` and an Unsplash link `https://unsplash.com/?utm_source=<app_name>&utm_medium=referral`. Use the app name registered with Unsplash for `utm_source`.
- Real client uploads have null attribution → render nothing for them. Art-card fallback path is unchanged.

### 4. Image size / hardening (minor)
- Use `urls.regular` (~1080px) for fetched photos (current `photo-fetch.ts` uses `urls.small` = 400px). Optionally route the downloaded buffer through the same downscale-to-≤2048 / WebP re-encode used by `uploadItemPhoto` (added in Bug #23) so seed photos match real-upload handling. Keep within the per-call timeout budget.

## Out of scope / leave alone
- The Category Art Card fallback system stays exactly as-is (it's the empty-state for items with no real photo).
- The `seed-main.jpg` placeholder convention and the eligibility filter stay the same.
- No change to how real client uploads work, beyond the shared downscale helper if reused.

## Acceptance criteria
- A full seed-photo run for ~100 items makes roughly **(# categories + # accessory sub-terms)** search calls, not ~100 — verifiable in the Unsplash dashboard request count.
- The Unsplash dashboard **Downloads** counter increments (download trigger firing).
- `item_photos` rows for fetched seed photos carry attribution; item detail shows "Photo by … on Unsplash" with correct UTM links.
- Run is still idempotent and resumable; rate-limit floor handling intact.
- `npm run verify` clean.

## Operational steps for Jim (outside Code)
1. **Verify `UNSPLASH_ACCESS_KEY` is set on Vercel** (Project → Settings → Environment Variables), then redeploy. The local `.env` has it, but if you ran "Fetch Photos" on the deployed app and the var is missing there, the action throws before any API call (mirrors the earlier `ANTHROPIC_API_KEY` gap). Check the seed-runner run log: an error there ⇒ key/env problem; "0 uploaded · 0 failed" with no error ⇒ nothing eligible (photos already fetched, or seed data absent — run Seed All, then Fetch Photos).
2. **Apply for Unsplash production access** (dashboard → your app → "Apply for Production") to lift 50 → 5000 req/hr. Approval requires the attribution + download-trigger behavior above, so land the Code changes first, then apply.
