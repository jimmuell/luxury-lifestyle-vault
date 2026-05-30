# Engineering Polish — Deferred TODOs

Running list of code-level cleanups and polish items surfaced during testing that aren't blocking the current sprint but should be addressed before the founding-member launch. Keep this list lean — only items with concrete scope. Strategy items belong in `llv_session_handoff.md` Section 13.

Items move from here to a Code prompt under `docs/cowork/llv_code_prompt_*.md` when they're ready to be scheduled.

---

## Open

### Photo seeding architecture (added May 30, 2026)
**Problem:** `src/lib/seed/fetch-unsplash-photos.ts` hits the Unsplash API at seed time, which has a 50 req/hr demo cap and creates a fragile external dependency. With ~118 seed item photos, a single seed run risks burning the entire hourly quota. The script also has a rate-limit detection bug (only catches HTTP 429; Unsplash returns 403 for over-quota responses, which falls through to the catch block and continues looping — explained the "-56/50 remaining" overage we saw on May 30).

**Decision (Jim, May 30):** Use placeholder photos for now. Defer the proper fix until later.

**Interim disable (May 30, 2026):** To unblock seed runs while the photo architecture rewrite is queued, `fetchUnsplashPhotos()` is commented out in `seed-all.ts` (replaced with a stub returning zero counts). The standalone "Fetch Wardrobe Photos" button on the admin Seed Data page now opens a confirmation dialog explaining the temp disable instead of running the broken script. Dialog content: "Photo fetching is temporarily disabled due to Unsplash rate limit issues. The seed completes successfully without photo URLs — items will display placeholder graphics. We're planning to replace this with a static `public/seed-photos/` bundle (see polish todo). Re-enable by uncommenting the call in `seed-all.ts` and reverting the button handler in `seed-runner.tsx`."

**UX badges deferred to the rewrite (May 30, 2026):** When the proper static-photos rewrite ships, the Code prompt for that work should also add two visual indicators on the Fetch Wardrobe Photos card in `src/components/admin/seed-runner.tsx`:
1. Static badge always visible: "Runs separately from Seed All" (drop the "Currently disabled" suffix once re-enabled).
2. Dynamic warning badge: after `handleSeedAll` completes, set component state like `photoFetchPending: true` and render an amber "⚠️ Did not run with Seed All — run separately" badge on the card. Clear the flag when the user runs photo fetch successfully (or on page refresh, in-memory state is fine for this admin tool). The dynamic badge applies even after the rewrite because photo fetch will still be a separate step from Seed All.

**Proposed proper fix when scheduled:**
1. Create `public/seed-photos/{category}/` folders matching the 14 item categories
2. Curate 2–4 luxury fashion photos per category (~30–50 total) from Pexels or Pixabay (commercial use, no attribution required)
3. Commit photos to the repo so all environments (local, Vercel, future testers' clones) get identical seed visuals
4. Rewrite `fetch-unsplash-photos.ts` → `assign-seed-photos.ts`. Pick a photo from the matching category folder via round-robin or random. ~20 lines replacing ~250 lines of Unsplash logic.
5. Update item_photos.public_url to local paths like `/seed-photos/eveningwear/02.jpg`
6. Remove `UNSPLASH_ACCESS_KEY` from required env vars
7. Update README to document the folder structure and curation pattern

**Side effects:**
- Eliminates Unsplash dependency for seed data (real user uploads still go through Supabase Storage as designed)
- Faster, deterministic seeds
- Zero rate-limit anxiety
- Unblocks free re-seeding for testers

**Decision still needed:**
- Who curates the photos? Recommend Jim (luxury brand voice matches better than algorithmic picks). ~30–60 min one-time investment.

### Unsplash production access (added May 30, 2026)
**Status:** Application not started. Would unlock 1,000 req/hr instead of 50.
**Blocking items if pursued:**
1. Implement "trigger download" calls when photos are displayed in the UI (per Unsplash production guidelines)
2. Add photographer + Unsplash attribution in the UI on every photo display
3. Submit screenshots + app description for review (24–72 hour review)

**Recommendation:** Only pursue if we decide to keep Unsplash for seed data. If we go with the static `public/seed-photos/` approach above, this becomes unnecessary.

### "Clear All Seed Data" badge label says "seeded" (added May 30, 2026)
**Problem:** When `Clear All Seed Data` runs, the result badge displays "X seeded" because the `SeedResult` type uses a `seeded` field for both seed and clear operations. Confusing: "468 seeded" actually means "468 records deleted." Cosmetic but misleading.

**Fix:** Either rename `SeedResult.seeded` to `count` with a separate label, OR add an `operation: 'seeded' | 'cleared'` flag to the result and update `formatResult()` in `seed-runner.tsx` to render the right verb.

### Theme toggle: 3-state (Light / Dark / System) + visibility fix (added May 30, 2026)
**Problem:** `src/components/shared/theme-toggle.tsx` is a 2-state button (Light ↔ Dark only) even though the underlying `ThemeProvider` in `src/app/layout.tsx` is configured with `defaultTheme="system"` + `enableSystem` (so the third option is plumbed but not exposed in the UI). Also, the button placement at the bottom-left of the client nav and admin layout sidebars puts it directly underneath where Next.js renders its dev-mode floating indicator icon — the dev "N" badge visually covers the toggle in local development. Jim couldn't find the toggle in his client portal during May 30 testing because of this collision.

**Fix:**
1. Replace the 2-state button with a 3-option control — could be a dropdown, segmented control, or three-button group. Labels: `Light` / `Dark` / `System`. `setTheme('system')` reverts to OS-following behavior.
2. Increase the icon visibility — ghost variant at size `h-4 w-4` is too subtle, especially in dark mode where the moon icon is dark gray on a dark background.
3. Either move the toggle out of the bottom-left flex row (where it collides with Next.js dev badge) OR add `right-X` positioning to give it more room. Worth considering a dedicated "Settings" or "Preferences" menu entry that holds it.
4. Follow the coding standard added to `CLAUDE.md` — use Lucide icons (`Sun`, `Moon`, `Monitor`) not emoji.

### `clear-all.ts` and `clear-test-accounts.ts` miss 7 FK-to-profiles tables (added May 30, 2026)
**Problem:** Both cleanup functions walk 19 tables in FK-safe order but don't delete from 7 additional tables that have FKs to `profiles(id)`. Discovered when running `llv_sql_delete_user.sql` against an admin who had synced tiers — `pricing_change_log.actor_profile_id` FK blocked the profile delete. Same gap exists in `clear-all.ts` (would hit the same error when clearing any seed admin who has any history in these tables) and `clear-test-accounts.ts` (would hit when a non-admin had been recorded in these tables, which is rare but possible — e.g., `ai_search_logs.client_id`, `reminder_sends.client_id`).

**Missing tables and their FKs to profiles:**
- `pricing_change_log.actor_profile_id`
- `email_sends.recipient_profile_id`
- `admin_settings.updated_by`
- `reminder_sends.client_id`
- `ai_search_logs.client_id`
- `notification_template_config.updated_by`
- `admin_broadcasts.sent_by`

**Fix:** Add deletes for these 7 tables to both `clear-all.ts` and `clear-test-accounts.ts`, between the existing `addresses` step and the final `profiles`/auth delete. Reference `llv_sql_delete_user.sql` Step 19 (lines added May 30) for the pattern.

### Tier list "active" indicator conflates active vs. synced (added May 30, 2026)
**Problem:** `src/components/admin/tier-list.tsx` line 73 shows a green check based only on `tier.active`. Reads as "Stripe sync OK" when it really means "this tier is enabled." Admins get confused (e.g., when a tier shows ✓ but also "Not synced to Stripe" — both true, but the green check semantics are misleading).

**Fix:** For subscription tiers, show green check only when `active && stripe_price_id_current`. For non-subscription tiers (on-demand, future per-request types), show a different indicator like "Per-request" or no Stripe-related indicator.

---

## In progress

*(none right now)*

---

## Completed

*(items move here once a Code prompt has shipped the fix, with a link to the Bug Fix Cycle entry in `llv_session_handoff.md`)*
