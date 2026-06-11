# QA Utility — Redirect seeded test emails to your Gmail (plus-addressing)

**Purpose:** Make QA emails readable. Rewrites every seeded **`@test.llv.com`** account's email into a unique **Gmail plus-alias** so all lifecycle/provider emails land in your one inbox (`jamesloganmueller@gmail.com`) and nothing bounces.

**Why SQL (not the seeder):** production has `SEED_TOOLS_ENABLED` unset, so the in-app reseed tool is disabled there. This SQL does the redirect directly. Run it in the **Supabase SQL Editor** (same place as the delete-user script).

**What it does / doesn't touch:** it only changes **`profiles.email`** — which is the address the app sends lifecycle emails *to*. It does **not** change `auth.users.email`, so your demo / quick-login still works exactly as before.

---

## 1. Redirect (run this)
```sql
update profiles
set email = 'jamesloganmueller+' || split_part(email, '@', 1) || '@gmail.com'
where email like '%@test.llv.com';
```
Example: `client3@test.llv.com` → `jamesloganmueller+client3@gmail.com` (all of these deliver to `jamesloganmueller@gmail.com`, each a distinct, filterable address). Providers seeded under `@test.llv.com` get redirected too, so provider-assignment emails also reach you.

> If any seeded test accounts use a domain other than `@test.llv.com`, widen the `where` (e.g. add `or email like '%@example.com'`). Your real admin (`jamesloganmueller@gmail.com`) is **not** matched, so it's safe.

## 2. Verify
```sql
select full_name, email from profiles
where email like 'jamesloganmueller+%@gmail.com'
order by email;
```
You should see each test client/provider with its new `+alias`.

## 3. Test it
Walk an order (confirm → shipped → delivered) and activate a membership for one of these clients. The emails should arrive in `jamesloganmueller@gmail.com`. In Gmail, filter with `to:(jamesloganmueller+client3@gmail.com)` etc. to isolate a given client.

## 4. Revert (optional — restores the original `@test.llv.com` addresses)
```sql
update profiles
set email = split_part(split_part(email, '+', 2), '@', 1) || '@test.llv.com'
where email like 'jamesloganmueller+%@gmail.com';
```

---

**Note:** This redirects existing records. If you also want **future** seeds (in local/test, where reseeding is enabled) to use this pattern by default, that's a small change to the seed scripts (`src/lib/seed/…`) — ask and I'll write that Code prompt.
