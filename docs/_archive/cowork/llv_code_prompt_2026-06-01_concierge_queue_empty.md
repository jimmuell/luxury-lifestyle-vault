# Code Prompt — Admin Concierge Queue shows zero messages

**Date:** 2026-06-01
**Severity:** High
**Surfaced by:** QA test run (T6.4) against the Vercel deployment.

## Symptom
`/admin/concierge` shows **"No active messages"** (and "No open messages" / "No resolved messages" under every status + source filter), yet:
- The admin Operations dashboard tile counts **"3 open messages"** and its "View all →" links to this same empty page.
- Client-side concierge threads clearly exist (Margaret Hartwell's recent activity shows "Update from RAVE FabriCARE", "Gown cleaning order confirmed", etc.).

So the message data exists; the **admin concierge queue list query returns nothing.** This blocks the founder's ability to read/respond to client + provider messages (T6.4 steps 2–5 untestable).

## Likely cause (investigate)
The dashboard count query and the queue-page list query diverge. Candidates:
1. **Null author on provider messages.** `seedProviders()` never sets `providers.profile_id` (it's null — see the provider-auth seed prompt). `seed-concierge.ts` resolves provider message `author_profile_id` from `providerProfileMap[business_name] = prov.profile_id` → **null**. If the queue list query inner-joins on `author_profile_id → profiles` (or otherwise requires a non-null author), those rows drop out. Fix the join (LEFT JOIN / null-safe author resolution) AND seed provider `profile_id`.
2. A status/source filter mismatch — the list query may filter on a status enum value or `source` that doesn't match the seeded rows (the dashboard count uses different criteria).
3. An admin-scoping/RLS predicate (e.g., `assigned_admin_id = currentUser`) that excludes unassigned messages.

## Asks
1. Compare the dashboard "open messages" count query vs the `/admin/concierge` list query (`src/actions/concierge.ts` + the admin concierge page) and find why the list returns 0 while the count returns 3.
2. Fix so the queue lists all client + provider messages with working status (Active/Open/In Progress/Resolved) and source (Client/Provider) filters. Provider-authored messages with a null/derived author must still appear.
3. Re-seed concierge after fixing provider `profile_id` so provider messages have a real author.
4. Add the Bug Fix Cycle entry when shipped.

## Verify
- `/admin/concierge` lists the seeded messages; counts match the dashboard tile; Client vs Provider source filter separates correctly; status transitions Open → In Progress → Resolved work; order-linked provider messages show a "View order" link to the correct order.
