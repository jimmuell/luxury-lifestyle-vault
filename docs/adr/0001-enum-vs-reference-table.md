# ADR-0001 — `service_type`: keep as Postgres enum

**Date:** 2026-06-14
**Status:** Active — keep enum. Revisit when a trigger below fires.
**Decider:** Founder / Cowork
**Canonical location:** `docs/adr/0001-enum-vs-reference-table.md` (this repo)

---

## Context

Provider "Services Offered" is backed by the Postgres enum `service_type`, defined in `supabase/migrations/001_extensions_enums.sql`:

```
dry_cleaning | wet_cleaning | hand_wash | pressing_steaming |
alterations  | repair       | storage   | shoe_care         | leather_care
```

Stored as `providers.services service_type[]`. Adding or retiring a value requires a migration + deploy. The question: is that coupling worth removing by converting to a reference table?

---

## Options considered

**Option A — Keep the enum (current, chosen)**
No migration, no new table, no admin UI. Schema change requires a deploy; acceptable while the catalog is stable and engineer-owned.

**Option B — Keep enum, add a companion lookup table for metadata**
Add a `service_type_meta` table for labels, descriptions, sort order — enum stays the source of truth for values. No column type change needed. Useful if per-service attributes are needed without full promotion.

**Option C — Promote to `service_types` reference table**
Replace `service_type[]` with `text[]` of stable keys validated against a new admin-editable `service_types` table (mirroring `service_tiers` / `corridors`). Admin can add/deactivate services without a deploy.
Full implementation prompt parked at: `docs/cowork/2026-06-14/llv_service_type_to_table.md`

---

## Decision

**Option A — keep the enum.**

As of 2026-06-14:

- The service catalog is stable. No "add a service type" request has recurred from operations or the admin.
- No non-engineer needs to manage the service list; the founder can coordinate a deploy.
- No per-service attributes (pricing, description, SLA) are required that would justify a richer table.
- Option C's `text[]` + reference table adds migration complexity, a new admin surface, and key-validation logic in server actions — all overhead with no current payoff.

The conversion is **well-specified and ready to ship** (see Option C prompt) but is parked until a trigger fires.

---

## Triggers to revisit (any one sufficient)

1. **Recurring admin request** — a non-engineer needs to add or retire a service type and a deploy is not feasible or acceptable.
2. **Per-service attributes required** — e.g., per-service pricing, SLA, or description that needs to be editable without a code change.
3. **Service catalog growth** — the list needs to exceed ~15 values, suggesting it is no longer a fixed domain.

When a trigger fires: execute `docs/cowork/2026-06-14/llv_service_type_to_table.md` (Option C). No design work remains — the spec is complete.

---

## Consequences

- Adding a service type requires a migration to `001_extensions_enums.sql` (or a new migration altering the enum) + deploy. Acceptable at current scale.
- `provider-form.tsx` continues to hardcode `SERVICE_OPTIONS` matching the enum. Update it whenever the enum changes.
- `src/types/app.ts` `ServiceType` alias remains derived from the DB enum.
