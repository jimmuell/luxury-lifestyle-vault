# Code Prompt — Align the repo with the LLV source-of-truth convention

**For:** Claude Code (repo `~/dev/luxury-lifestyle-vault`)
**Date:** 2026-06-12
**Companion (authority):** *LLV Source-of-Truth Map* — Drive vault, `00 CoWork / 01 Master Document Spec`. That document is the canonical statement of the convention below; this prompt mirrors it into the repo.

## Background — the single-source setup

LLV documents live in three systems, each canonical for different things:

- **Drive vault** ("Luxury Lifestyle Vault") — business, strategy, brand, investor, operations, and legal documents (folders 00–20). Governed by the Master Document Standard. *Not in this repo.*
- **Notion** ("LLV Launch — Project Tracker") — launch task status and operational runbooks (e.g., Founder Dashboard Verifications).
- **This repository** — source code; developer docs under `docs/`; and the legal markdown (`docs/legal/*.md`) that renders the live `/terms` and `/privacy` pages.

The repo is deliberately kept outside Drive (git + cloud sync corrupt each other). Claude Code only sees this repo, so the convention must live here too — that is what this prompt sets up.

## Task 1 — Add the convention to the repo

Create or update **`CLAUDE.md`** at the repo root with a "Document source of truth" section. If `CLAUDE.md` already exists, **add** this section rather than overwriting the file.

```markdown
## Document source of truth

LLV docs live in three systems. Before creating or trusting a document, know which is canonical:

- **Drive vault** ("Luxury Lifestyle Vault") — business/strategy/brand/investor/operations/legal docs. Governed by the Master Document Standard. Not in this repo.
- **Notion** ("LLV Launch — Project Tracker") — launch task status + operational runbooks (e.g., Founder Dashboard Verifications). The single task board — do NOT keep parallel task lists or status docs in this repo.
- **This repo** — source code; developer docs under `docs/`; and `docs/legal/*.md`, which render the live /terms and /privacy pages (canonical here).

**One-canonical-copy rule:** when the same content exists in more than one system, exactly one copy is canonical and every other copy carries a banner at the top naming the canonical location. A repo doc that duplicates canonical Drive/Notion content gets a `> **⚠️ SUPERSEDED — …**` banner pointing to the canonical home (and may be renamed `*.SUPERSEDED.md`). Never silently maintain a second live copy.

The authority for this convention is the Drive vault doc "LLV Source-of-Truth Map" (00 CoWork / 01 Master Document Spec).
```

## Task 2 — Audit `docs/` for stale duplicates and banner them

Inventory `docs/` (and any other in-repo markdown that mirrors Drive/Notion content). For each file whose content is now canonical in Drive or Notion, prepend:

```markdown
> **⚠️ SUPERSEDED (YYYY-MM-DD) — do not use as the live version.**
> Single source of truth: <canonical location + link>.
```

…and optionally rename it `<name>.SUPERSEDED.md`.

Known candidates (confirm each before bannering — some may already be retired):

- `docs/testing/llv_dashboard_qa_verification_checklist.md` — **superseded** (see Task 3 for the exact banner).
- `docs/cowork/llv_founder_step_2026-06-07_inngest_durable_autosync.md` — describes the **abandoned** `INNGEST_SERVE_ORIGIN` auto-sync approach. The chosen approach is manual Resync (Option B). Banner it, pointing to the Inngest Manual Sync Runbook (Drive `00 CoWork`).
- `docs/cowork/2026-06-10/` prompts and other `docs/cowork/llv_*` notes — point-in-time prompts/notes. Leave historical prompts as-is, but banner any file that reads as **current status** when that status now lives in Notion.

**Do NOT banner `docs/legal/*.md`** — those are canonical in the repo (they render the site).

## Task 3 — Banner the QA checklist (specific instance of Task 2)

Prepend to `docs/testing/llv_dashboard_qa_verification_checklist.md`:

```markdown
> **⚠️ SUPERSEDED — 2026-06-12. Do not use as the live checklist.**
>
> Single source of truth: the Notion tracker row **"Founder dashboard verifications — Stripe / Resend / Inngest"** in *LLV Launch — Project Tracker* → https://app.notion.com/p/375225a113658189b7efe81a8b0e2390
>
> Status as of 2026-06-12: Resend (§2) ✅ and admin return-processing (§4) ✅ verified. **Remaining = the 5 Stripe checks (§1) + Inngest §3.1 / §3.2.** The full step-by-step runbook now lives in that Notion row.
```

## Commit

Suggested commits:

- `docs: add document source-of-truth convention to CLAUDE.md`
- `docs: mark superseded duplicates with pointers to canonical source`

Note: `docs/legal/*.md` are intentionally left untouched (they render the live site).
