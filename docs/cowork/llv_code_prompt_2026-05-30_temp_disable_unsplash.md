# Claude Code Prompt — Temporarily Disable Unsplash Photo Fetch
**Date:** May 30, 2026
**Author:** Cowork (per DIVISION_OF_LABOR.md)
**For:** Claude Code in VS Code, working in `~/Documents/Claude/Projects/luxury-lifestyle-vault`
**Priority:** Small but blocking — Jim can't re-seed cleanly until this is done.

---

## Context

The `fetchUnsplashPhotos()` script (`src/lib/seed/fetch-unsplash-photos.ts`) has two real problems:

1. **Rate-limit detection bug.** It only catches HTTP `429` for rate-limited responses. Unsplash's demo tier (50 req/hr) returns `403` when over quota. The 403 falls through to the `if (!resp.ok) throw new Error(...)` branch, gets caught by the for-loop's catch block, logged to `errors[]`, and **the loop continues to the next photo**. Result: one over-quota state turns into ~118 wasted requests instead of bailing cleanly. Today Jim's Unsplash dashboard showed `-56/50 remaining this hour` because of this.

2. **Demo tier doesn't scale.** Even when working correctly, 50 req/hr × seed of 118 photos means a single Seed All run can't complete on the demo key. Production tier (1,000/hr) requires applying for production access with code changes (trigger-downloads, photo attribution UI) and a multi-day review.

The proper fix (queued in `docs/cowork/llv_engineering_polish_todos.md` under "Photo seeding architecture") is to replace runtime Unsplash fetching with a static `public/seed-photos/` bundle. That's a separate work item to be scoped later.

**Until then**, Jim needs Seed All to complete cleanly without the broken photo fetch. This prompt covers the interim disable.

---

## What to do

### Change 1 — Stub `fetchUnsplashPhotos` call in the Seed All pipeline

In `src/lib/seed/seed-all.ts`, find the call to `fetchUnsplashPhotos()` in Tier 8. **Comment out the actual call** and replace with a stub result so the rest of the pipeline (totals computation, return shape) continues to work without changes.

Something along these lines (final naming/style your call):

```typescript
// ── Tier 8: Fetch Unsplash photo URLs for seed items ─────────────────────
// ⚠️ TEMPORARILY DISABLED — Unsplash demo key 50 req/hr cap + 403 rate-limit
//    detection bug make this step unreliable and slow. See
//    docs/cowork/llv_engineering_polish_todos.md → "Photo seeding architecture"
//    for the proper fix (static public/seed-photos/ bundle).
//    To re-enable: uncomment the line below and remove the stub.
// const unsplashPhotos = await fetchUnsplashPhotos()
const unsplashPhotos: PhotoFetchResult = {
  seeded: 0,
  skipped: 0,
  errors: ['Photo fetch temporarily disabled — see polish todo'],
  fetched: 0,
  rateLimitHit: false,
  remaining: 0,
}
```

Keep the `import { fetchUnsplashPhotos }` at the top of the file — don't remove it. Easier to re-enable later.

### Change 2 — Replace the individual "Fetch Wardrobe Photos" button behavior

In `src/components/admin/seed-runner.tsx`, when the user clicks **Run** on the script with `id === 'fetch-photos'` (from `SEED_MANIFEST`), open a confirmation/info dialog instead of calling `runSeedScript('fetch-photos')`. The script call itself stays in the codebase but is bypassed.

Dialog content:

> **Photo fetching is temporarily disabled**
>
> The Unsplash photo fetch script is paused while we replace it with a more reliable architecture. The seed pipeline completes successfully without photo URLs — items will display placeholder graphics in the UI.
>
> The fix is tracked in `docs/cowork/llv_engineering_polish_todos.md` → "Photo seeding architecture." Until that ships, this button is a no-op.
>
> [OK button to dismiss]

Pick whichever modal/dialog primitive you already use elsewhere in admin UI (Shadcn `Dialog` is fine). Don't introduce a new dependency for this.

The intercept needs to fire only for `id === 'fetch-photos'` — all other script buttons (`providers`, `clients`, `items`, etc.) still run their respective scripts normally.

### Change 3 — Add visual state indicators to the Fetch Wardrobe Photos card

Jim asked for UX clarity on the card itself. The card should always communicate that this script is separate from Seed All, and after a Seed All run completes, the card should warn that photo fetch was not included.

**Static badge — always visible on the card:**

Add a small badge/chip rendered inside the card for the `fetch-photos` script (only this one — other script cards in `SEED_MANIFEST` stay as they are). Text and styling can match other admin pills in the design system; I'd suggest something like:

> `Runs separately from Seed All`

Subtle (muted-foreground border + small text). Communicates the script's special status independent of any run state.

While temp-disabled (per Changes 1 & 2), the badge can additionally read:

> `Runs separately from Seed All · Currently disabled`

So users know both facts at a glance.

**Dynamic indicator — set after Seed All runs:**

In `seed-runner.tsx`, when the `handleSeedAll` transition completes successfully, set a piece of component state (e.g., `photoFetchPending: true`). When this state is true, render a second badge on the Fetch Wardrobe Photos card:

> `⚠️ Did not run with Seed All — run separately`

(Amber/warning styling to draw the eye.)

Clear the `photoFetchPending` flag when:
- The user runs the Fetch Wardrobe Photos script successfully, OR
- The user dismisses the dialog AND elects "Got it — I'll run later" (if you want two dialog options), OR
- The page is refreshed (it's React component state, in-memory only — that's fine for this admin tool)

While in temp-disabled mode (the dialog short-circuits the actual script), the `photoFetchPending` flag stays true after Seed All since photos genuinely didn't run. The warning persists, which is the desired behavior — Jim should be reminded that the seed isn't visually complete.

**Output log mention:**

When Seed All completes, the existing "Seed All" entry in the in-page output log should mention that the photo fetch was skipped. This is partly covered by the stub result returning `errors: ['Photo fetch temporarily disabled — see polish todo']`, which the existing `formatResult` should render. Confirm that copy is visible when the user expands the Seed All log entry.

For the standalone "Fetch Wardrobe Photos" button — when the dialog appears, no log entry is added (it's not really a run). When the script is re-enabled later, the existing `runSeedScript('fetch-photos')` already adds a log entry on completion, so no change needed there.

### Change 4 — Verify build is clean

After the changes:
- `npx tsc --noEmit` should be clean
- `npm run lint` should pass
- Loading `/admin/seed-data` shouldn't error
- Fetch Wardrobe Photos card always shows the "Runs separately • Currently disabled" badge
- Clicking "Seed All" should run all 12 prior scripts and skip the photo fetch (output log shows "Photo fetch temporarily disabled" as info)
- After Seed All completes, the Fetch Wardrobe Photos card shows the amber "⚠️ Did not run with Seed All — run separately" warning
- Clicking individual "Fetch Wardrobe Photos" button opens the dialog and does NOT make any Unsplash calls
- Page refresh resets the warning badge to its default static-only state

---

## Reporting protocol

Per the **Bug Fix Cycle** in `llv_session_handoff.md`:

- Next entry is **#19**.
- One commit covers both changes is fine, or split as you prefer.
- Push to `main` so the local dev server picks up the changes on reload.

Suggested table entry:

```
| 19 | May 30, 2026 | Medium | Seed / Unsplash | Interim disable — `fetchUnsplashPhotos()` was burning through the Unsplash 50 req/hr demo cap due to (a) a 403 vs 429 rate-limit detection bug and (b) the cap being insufficient for the ~118-photo seed. Seed All would hang for ~5+ minutes on this step. Commented out the call in `seed-all.ts` and replaced with a stub result. Changed the standalone "Fetch Wardrobe Photos" button to open a dialog explaining the temp disable instead of running the broken script. Added a "Runs separately • Currently disabled" badge on the Fetch Wardrobe Photos card. After Seed All completes, the card shows an amber "⚠️ Did not run with Seed All — run separately" warning. All changes are reversible (one-line uncomment + remove the warning logic). Proper fix (static `public/seed-photos/` bundle) tracked in `llv_engineering_polish_todos.md`. | ✅ FIXED (interim) |
```

---

## What Jim does after you ship

1. Pull latest from main
2. Restart `npm run dev` if needed
3. Re-run Clear All Seed Data + Seed All (should complete in ~30 seconds now, no Unsplash hang)
4. Verify the individual "Fetch Wardrobe Photos" button shows the dialog when clicked
5. Move on to local smoke testing with demo login + fresh signup
