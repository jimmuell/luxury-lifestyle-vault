# Code Prompt — Bell badge reactivity (#32 re-fix) + duplicate-corridor error (#35)

**Date:** 2026-06-01
**Severity:** Low (both)
**Surfaced by:** Cowork re-test of the low-bug batch (#32 fix did not resolve; #35 newly surfaced during #29 re-test).

Two independent fixes — ship in any order. Bugs #29, #30, #31 from the prior low-bug batch are re-tested and verified fixed; only #32 remains, plus the new #35.

---

## 1. #32 — Notification bell badge still not reactive after "Mark all read"

**Status:** The earlier fix (added an UPDATE event listener to the Supabase realtime channel in `notification-bell.tsx` alongside INSERT) **did not resolve it.**

**Re-test (Cowork, June 1, on the deployment):** gave the client one unread notification (confirmed an order admin-side), bell showed "1", clicked **"Mark all read"** on `/client/notifications`. The page cleared the unread state (header + dot gone) but the **bell badge stayed at "1" for 14+ seconds and only reset to 0 after navigating to another page.** Same symptom as before the fix.

**Key clue:** single-notification reads DO update the bell reactively. With a single unread, "Mark all read" updates exactly one row — so it *should* behave identically to a single read, yet it doesn't. This points at the bulk `markAllRead` path, not the listener wiring per se.

**Investigate / fix:**
1. Confirm the `notifications` table is in the Supabase realtime publication and that the bulk UPDATE actually emits realtime UPDATE events the client receives (vs. single-row updates, which evidently do).
2. If `markAllRead` uses a different query/RPC than the single-read path (e.g., a bulk `.update()` with a different filter, or an RPC that bypasses the realtime-published path), make it emit the same UPDATE the listener catches.
3. **Most robust fix:** have the "Mark all read" action *also* optimistically set the bell's unread count to 0 in shared client state (e.g., the store/context the bell reads), rather than relying solely on realtime. Single reads can keep their current behavior; this just guarantees the bell reflects mark-all-read immediately.

**Verify:** with ≥1 unread, click "Mark all read" → bell badge resets to 0 with **no reload/navigation**. Also re-confirm a single-notification read still decrements the bell.

---

## 2. #35 — Duplicate-corridor creation throws an ungraceful error

**Surfaced while re-testing #29.** Now that the New Corridor form submits with the prefilled WI/AZ defaults in state, creating a corridor that **already exists** (e.g., WI↔AZ) throws a generic toast: *"An error occurred in the Server Components render. The specific message is omitted in production builds…"* The unique-constraint violation isn't caught. Creating a *unique* corridor (e.g., WI↔TX) works fine.

**Fix:** in the corridor create server action, catch the duplicate / unique-constraint violation and return a friendly result the client surfaces as a toast — e.g., *"A corridor for WI ↔ AZ already exists."* Don't let it bubble up as a Server Components render error.

**Verify:** attempt to create WI↔AZ (already exists) → friendly "already exists" message, no generic error toast; the modal stays open so the user can adjust.

---

Run `npm run verify` and add Bug Fix Cycle entries to `llv_session_handoff.md` (#32 corrected, #35) when shipped. Cowork will re-verify both on the deployment.

**Test residue to clean up (optional):** a test corridor "Defaults Fixed Check" (WI↔TX) and a confirmed on-demand order #DC62EF27 (Margaret) were left by the re-test — both harmless and deletable.
