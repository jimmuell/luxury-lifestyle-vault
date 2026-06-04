# Code Prompt — QA low-severity bug cluster (June 1 test run)

**Date:** 2026-06-01
**Severity:** Low (polish)
**Surfaced by:** QA test run against the Vercel deployment. Independent fixes — ship in any order.

## 1. New Corridor modal — prefilled code defaults not in form state (T2.2)
The New Corridor modal pre-fills Origin "WI" / Destination "AZ", but those defaults aren't registered in the form/React state, so submitting without retyping them throws "All fields are required." Fix: initialize form state with the prefilled default values (or treat prefilled inputs as valid). Verify: open New Corridor, fill display name only, leave WI/AZ defaults, Create → succeeds.

## 2. Outfit delete — spurious error toast (T4.4)
Deleting an outfit succeeds (record removed, confirmed after reload) but shows a red **"Failed to delete outfit"** error toast. The delete server action likely succeeds then the client handler misreads the response (or a post-delete redirect/revalidate throws). Fix the success/error handling so a successful delete shows a success (or no) toast, never an error. Verify: create + delete an outfit → no error toast, outfit gone, other outfits intact.

## 3. Requested-delivery date off-by-one on review screens (T5.1 / T5.2 / T6.2)
The requested-delivery date renders **one day earlier** on the mid-flow review/details screens and the admin dispatch modal note (e.g., field 06/06 → review "June 5"; field 06/03 → "June 2"), while the final saved order shows the correct date. Classic UTC-vs-local parsing: a `YYYY-MM-DD` string is being `new Date()`'d as UTC then formatted in local time. Fix the date parse/format in the review/details/dispatch-modal components to be timezone-safe (parse as local date, or format in UTC consistently). Note the dispatch modal computes the provider deadline default from this date, so the off-by-one has functional reach. Verify: entered date matches review, order detail, and dispatch-modal note.

## 4. Notification bell badge not reactive after "Mark all read" (T9.1)
Clicking "Mark all read" on `/client/notifications` clears the list and persists server-side (bell shows 0 after reload), but the **bell badge stays at the prior count until a page reload.** Single-notification reads DO update the bell reactively. Fix: have "Mark all read" update the shared unread-count state (revalidate / optimistic set to 0) the same way single reads do. Verify: mark all read → bell badge resets to 0 without a reload.

---
Add a Bug Fix Cycle entry to `llv_session_handoff.md` per item (or one grouped entry) when shipped.

---
## Related non-code config item (not for Code)
**AI search unavailable on Vercel (T4.2, High).** The Haiku natural-language wardrobe search returns "AI search unavailable — showing best-effort matches" on the deployment; the keyword fallback works. Almost certainly a **missing `ANTHROPIC_API_KEY` env var on the Vercel project.** Founder/DevOps: add `ANTHROPIC_API_KEY` to Vercel env vars and redeploy, then re-test (`/client/wardrobe` → search "black tie outfit for a December gala" should return tuxedos/gowns with AI reasoning). If the key is present and it still fails, escalate as a code bug.
