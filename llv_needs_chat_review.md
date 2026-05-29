# LLV — Needs Chat Session Review

**Owner:** Claude Cowork (maintained)
**Resolver:** Claude Chat (during strategy sessions)
**Last updated:** May 25, 2026

Living log of drift, conflicts, and open questions between the strategic blueprint, any addendums, and what Claude Code has actually built. Items here require a Claude Chat session to officially resolve. The blueprint is then updated to reflect the resolution, and the item is moved to the "Resolved" section below.

## Source-of-truth hierarchy

Per `DIVISION_OF_LABOR.md`:

1. **`docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx`** — strategic source of truth for architecture and stack. Only Claude Chat may revise.
2. **The codebase** — implementation source of truth for libraries, versions, and configurations.
3. **`CLAUDE.md`** (project root) — Claude Code working instructions. Reflects current codebase reality, not strategic decisions.

> The former addendum `docs/tech-stack/Tech Stack Claude Code.docx` has been **retired** (May 25, 2026) and moved to `docs/archive/`. The blueprint is now the single source of truth for all stack decisions.

---

## Open items

*(none — all items resolved May 25, 2026)*

---

## Resolved items

All twelve open items were resolved by Claude Chat on **May 25, 2026**. The blueprint Section 5 (Recommended Technology Stack) and `llv_session_handoff.md` Section 7 have been updated to match.

### ✅ 0. Tech Stack Claude Code.docx exists as an unsanctioned addendum — Resolved May 25, 2026

- **Ruling:** **RETIRED.** The file is moved from `docs/tech-stack/` to `docs/archive/` and removed from the document reference table in the handoff. The blueprint is the single source of truth for all stack decisions. Accepted proposals from the addendum have been folded into the blueprint as official revisions; the file is retained in archive only for historical traceability.

---

### ✅ 1. Database — PlanetScale option still listed in blueprint — Resolved May 25, 2026

- **Ruling:** **Supabase (PostgreSQL).** "or PlanetScale" removed from the blueprint. Supabase is the committed database. PlanetScale is eliminated on the grounds that it is MySQL-protocol (not true Postgres) and dropped its free tier.

---

### ✅ 2. Authentication — Auth0 option still listed in blueprint — Resolved May 25, 2026

- **Ruling:** **Supabase Auth.** "or Auth0" removed from the blueprint. Auth0 is eliminated as redundant once Supabase is in.

---

### ✅ 3. File storage — blueprint and addendum and codebase all differ — Resolved May 25, 2026

- **Ruling:** **Supabase Storage only for Phase A/B.** Cloudflare R2 cold archival is **deferred to Phase 4+**. Phase A operates on Supabase Storage with a clean abstraction layer (storage service interface) so a future R2 migration is straightforward. **This unblocks DI-4.**

---

### ✅ 4. Email — SendGrid vs. Resend — Resolved May 25, 2026

- **Ruling:** **Resend.** SendGrid is replaced. Blueprint Section 5 Notifications row updated.

---

### ✅ 5. Hosting — Amplify option still listed — Resolved May 25, 2026

- **Ruling:** **Vercel.** "or AWS Amplify" removed from the blueprint. AWS Amplify is eliminated.

---

### ✅ 6. Background jobs — Inngest in codebase, absent from blueprint — Resolved May 25, 2026

- **Ruling:** **Inngest.** Added to the blueprint as the Background Jobs / Async Execution layer in Section 5. Inngest's role in Section 3.1's workflows (provider dispatch, automated client communication, AI categorization) is acknowledged.

---

### ✅ 7. Component library — Shadcn/UI in codebase, absent from blueprint — Resolved May 25, 2026

- **Ruling:** **Shadcn/UI on Base UI.** Added to the blueprint Section 5 as a dedicated UI Components row. The Shadcn-on-Base-UI implementation quirks (`asChild` not supported on Button; use `buttonVariants` on `<Link>`) remain documented in `CLAUDE.md` and `docs/cowork/llv_design_system.md`.

---

### ✅ 8. Next.js version — blueprint and CLAUDE.md both wrong — Resolved May 25, 2026

- **Ruling:** **Next.js 16 (App Router + Server Actions).** Confirmed as the runtime. `CLAUDE.md` correction was tracked separately to Claude Code (F-1, completed May 24, 2026). The blueprint's "Next.js with React" language remains accurate at the strategic level; the version specifics live in `CLAUDE.md` and `package.json` where they belong.

---

### ✅ 9. AI model selection — Resolved May 25, 2026

- **Ruling:** **Claude Haiku 4.5 via Anthropic API for photo categorization.** Higher-tier models (Sonnet 4.6) are available for future concierge features — no decision needed yet. Blueprint Section 5 AI Integration row updated to record the model tier strategy. DI-3 (already shipped on Haiku 4.5 via Inngest) is ratified.

---

### ✅ 10. Design system — typography and palette in codebase, absent from blueprint — Resolved May 25, 2026

- **Ruling:** **Ratified as-is.** Obsidian & Ivory palette with gold accent; Cormorant Garamond + Inter typography primitives; Shadcn/UI components; admin styleguide page at `/admin/styleguide`. Added as a Design System row in blueprint Section 5 with a reference to `docs/cowork/llv_design_system.md` as the full reference.

---

### ✅ 11. Phase A timing — codebase is ahead of the schedule — Resolved May 25, 2026

- **Ruling:** **Phase A confirmed complete (except DI-4, now unblocked).** Founder chose to use the buffer for polish/testing and Phase B planning. Blueprint Section 6.1 timeline language is not revised — the schedule reflects target windows; getting ahead of schedule is acceptable. Handoff Section 13 Item 6 (detailed tech build plan / Phase A) is marked DONE.

---

*Add new items above the "Resolved items" section. Keep entries terse, factual, and three-part: what blueprint says, what codebase/addendum says, Cowork recommendation.*
