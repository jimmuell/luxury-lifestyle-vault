# Luxury Lifestyle Vault — Division of Labor

## Purpose

This document defines the roles and responsibilities between the two Claude instances working on the Luxury Lifestyle Vault (LLV) project. Both serve the same founder but operate in different environments with different strengths. This document should be read by any Claude instance before starting work to avoid duplication, scope confusion, or conflicting outputs.

**This was previously a three-tool model** (Claude Chat + Cowork + Code). As of May 30, 2026, Cowork has absorbed Claude Chat's responsibilities — web research, strategic writing, and architecture decisions — into its scope. Cowork has direct web search capability and direct file system access in the project folder, which removed most of the original justification for keeping Chat as a distinct active role. Chat remains available as an optional escalation channel (see "When to use Claude Chat" near the bottom).

---

## Claude Cowork (Desktop App)

**Environment:** Claude Desktop app with full read/write access to the local LLV project folder on the founder's computer. Has direct web search via WebSearch and a sandboxed Linux shell for running ad-hoc commands.

**Role:** Strategic advisor, document owner, project coordinator, researcher, and bridge to engineering.

### Setup

Create a Cowork session pointed at the local LLV project folder (`~/Documents/Claude/Projects/luxury-lifestyle-vault/`). Place `DIVISION_OF_LABOR.md` (this file) in that folder so Cowork reads it automatically at the start of every session via the project's `CLAUDE.md` directive. The session handoff document (`llv_session_handoff.md`) at the project root is the primary memory across sessions.

### Responsibilities

**Strategy and research:**

- Business strategy and planning — market analysis, competitive landscape, partnership strategy, investor positioning, pricing and packaging decisions.
- Web research — market data, competitor information, provider research (dry cleaners, storage, logistics partners), investor landscape, industry trends, third-party documentation lookup (Stripe, Supabase, Vercel, etc.).
- Operational design — service tier definitions, customer journey mapping, provider qualification standards, workflow design at the conceptual level.
- Investor materials strategy — narrative direction for pitch decks, executive summaries, financial projection logic, fundraising strategy.
- Technology architecture — high-level system design, component selection, architecture decisions, and the technology blueprint. Cowork defines what gets built and why.

**Documents and coordination:**

- Document management — read, update, revise, and maintain all project documents (.docx, .md, spreadsheets, PDFs) in the local project folder. This includes the session handoff, technology architecture blueprint, strategy documents, and any new documents.
- Initial document drafts — Cowork drafts strategy documents directly into the project folder (no save-and-import dance, because Cowork has file system access).
- Handoff document updates — after every meaningful working session, Cowork updates `llv_session_handoff.md` with new decisions, resolved items, changed priorities, and bug fix cycle entries.
- Document versioning — maintain document history, create backups before major revisions, track what changed and when via git plus inline change notes.
- Project organization — keep the project folder structured, organized, and clean. Ensure naming conventions are consistent.
- Report generation — compile information across multiple project documents into new deliverables (investor one-pagers, provider outreach materials, operational checklists, comparison tables).
- Data entry and formatting — take rough notes or conversation summaries from the founder and format them into polished project documents.
- Spreadsheet work — build and maintain budget spreadsheets, pricing models, provider comparison matrices, timeline trackers, and client tracking sheets.
- Provider outreach materials — draft emails, proposals, and partnership term sheets for approaching RAVE FabriCARE, European Couture Cleaners, and Wisconsin providers.
- Operational checklists — create pre-launch checklists, onboarding workflows, quality control protocols, and standard operating procedures.

**Bridge to engineering:**

- Translate the technology architecture blueprint into structured requirements that Claude Code can consume. Cowork reads the blueprint and produces sprint-level breakdowns, user stories, feature specs, and Code prompts.
- Write focused Code prompts in `docs/cowork/` (named `llv_code_prompt_<date>_<topic>.md`) that hand off specific implementation tasks to Code, including context, expected fix, verification steps, and the next Bug Fix Cycle entry to add.
- Receive Code's report-backs and update `llv_session_handoff.md` Bug Fix Cycle table to reflect what shipped.

### Does NOT do

- Write production application code (that's Claude Code's job — Cowork writes prompts, Code writes code).
- Run the local development environment (`pnpm dev`, migrations, etc. — Code's terminal context is where those live).
- Make git commits or pushes (Code does these as part of its work; Cowork edits files and Code/founder commits them).
- Deploy applications or manage live servers (Code's DevOps role).
- Change the technology stack or architecture without founder confirmation captured in the project folder.

---

## Claude Code (VS Code / Terminal)

**Environment:** VS Code with terminal access, working directly in the application codebase repository.

**Role:** Software engineer and technical implementer.

### Responsibilities

- **Application development** — write all production code for the LLV platform including frontend (Next.js/React), backend (API routes), database schemas, and integrations.
- **Database design and implementation** — create and run migrations, define models, set up Supabase schemas based on architecture decisions captured in the project folder.
- **Frontend implementation** — build the client portal, provider portal, and admin dashboard UI using Next.js, React, and Tailwind CSS following the design principles in `docs/cowork/llv_design_system.md` and the icon standard in `CLAUDE.md`.
- **API development** — build all API endpoints for inventory management, scheduling, notifications, provider dispatch, and client communication.
- **Authentication and authorization** — implement role-based access control (client, provider, admin) using Supabase Auth.
- **AI integration** — implement Anthropic Claude API calls for item categorization, concierge assistance, and operational intelligence features.
- **Payment integration** — implement Stripe for subscription billing, per-request charges (Tier 3), invoicing, and webhook handling.
- **Photo and file management** — implement image upload, storage (Supabase Storage), CDN delivery, and the browsable wardrobe catalog interface.
- **Testing** — write and run unit tests, integration tests, and end-to-end tests.
- **DevOps** — configure hosting (Vercel), environment variables, CI/CD pipelines, and deployment. Manage hosted Supabase, Inngest cloud, Stripe webhook endpoints.
- **Bug fixes and debugging** — troubleshoot issues, fix errors, optimize performance. Read Code prompts produced by Cowork and ship the changes.
- **Git operations** — commits and pushes happen in Code's terminal context as part of shipping work.
- **Technical README and `CLAUDE.md`** — create and maintain `README.md` (setup/dev instructions) and `CLAUDE.md` (working instructions for any Claude touching the codebase).

### Does NOT do

- Make business strategy decisions or change the service model.
- Create or modify business strategy documents, investor materials, or business plans without a Cowork-produced spec.
- Conduct independent market research or competitive analysis.
- Change the technology stack or architecture without the founder confirming via a Cowork-tracked decision.
- Communicate with providers, investors, or customers on behalf of the founder.

---

## How the Two Tools Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                          FOUNDER                                │
│         (Makes all final decisions, coordinates tools)          │
└──────────────────────┬─────────────────────┬────────────────────┘
                       │                     │
                       ▼                     ▼
       ┌─────────────────────────┐ ┌─────────────────────────┐
       │     CLAUDE COWORK       │ │      CLAUDE CODE        │
       │                         │ │                         │
       │  Strategy + Research    │ │  Engineering            │
       │  Architecture           │ │  Implementation         │
       │  Documents              │ │  Testing                │
       │  Code prompts           │ │  DevOps                 │
       │  Coordination           │ │  Git operations         │
       │                         │ │                         │
       │  Outputs:               │ │  Outputs:               │
       │  Polished docs +        │ │  Working code in        │
       │  Code prompts           │ │  the same repo          │
       │  (same project folder)  │ │                         │
       └──────────┬──────────────┘ └────────┬────────────────┘
                  │                         │
                  │     Founder hands       │
                  │     prompt from         │
                  │     Cowork to ──────────►
                  │     Code in VS Code     │
                  │                         │
                  │  ◄──── Code reports ────│
                  │  back; founder relays   │
                  │  outcomes to Cowork     │
                  │  to update handoff doc  │
                  └─────────────────────────┘
```

### Typical Workflow Cycles

**Strategy / Research Cycle:**

1. Founder opens a Cowork session.
2. Cowork conducts research (web search, document reads), drafts or updates strategy documents directly in the project folder.
3. Cowork updates `llv_session_handoff.md` to reflect the new state.
4. Founder reviews and confirms; revisions happen inline.

**Build Cycle:**

1. Founder asks Cowork to break a feature or fix into a development task.
2. Cowork produces a structured Code prompt at `docs/cowork/llv_code_prompt_<date>_<topic>.md`.
3. Founder pastes the prompt into Claude Code in VS Code.
4. Code reads the prompt, ships the changes, commits, pushes.
5. Code reports back to the founder with what changed.
6. Founder relays the outcome to Cowork; Cowork updates `llv_session_handoff.md` Bug Fix Cycle.

**Document Update Cycle:**

1. After any session (Cowork or Code), the founder confirms changes.
2. Cowork updates the handoff document with new decisions, learnings, and open items.
3. Cowork ensures all project documents are consistent and current.

---

## When to use Claude Chat (optional escalation)

Claude Chat is no longer part of the daily workflow but remains useful in specific situations. Cowork should suggest the founder open a Chat session when:

- **Founder is mobile** — away from the Mac, wants to think through something with Claude on phone or tablet. Chat works offline-of-project, Cowork doesn't.
- **Fresh perspective without project context wanted** — e.g., reviewing a business decision with a Claude that hasn't been in the weeds of the implementation. Reduces anchoring bias.
- **Cowork itself is unavailable** — service issue, machine swap, or any other reason the daily setup isn't running. Chat is the always-available backup.
- **Pure intellectual exploration disconnected from the project** — open-ended thinking that benefits from Claude's general capabilities without the gravity of the project folder.

Cowork is allowed (and encouraged) to suggest escalating to Chat when one of these conditions clearly applies. Most of the time, Cowork handles the request directly.

---

## Shared Reference Documents

### Naming and location conventions

- Cowork-managed content documents use the `llv_` prefix with snake_case (e.g., `llv_strategy.docx`).
- Convention documents at project root keep their conventional casing: `DIVISION_OF_LABOR.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`.
- Standing-instruction files (read at start of every Cowork session) live at the project root for visibility.
- All other Cowork-produced or Cowork-maintained docs live under `docs/` in a topical subfolder.

### Folder layout

- `./` (project root) — convention docs and standing-instruction files (`llv_session_handoff.md`, `DIVISION_OF_LABOR.md`, `CLAUDE.md`, `README.md`, `AGENTS.md`)
- `docs/strategy/` — strategic deliverables (strategy, analysis, target companies, technology architecture blueprint, launch readiness, assumptions register)
- `docs/cowork/` — Cowork-produced operational deliverables (provider outreach, SOPs, task breakdowns, sprint plans, checklists, Code prompts, engineering polish todos, ad-hoc SQL utilities)
- `docs/testing/` — test plans, test results, QA logs
- `docs/archive/` — retired documents kept for historical reference

### Reference document index

| Document | Location | Purpose | Owned By |
|----------|----------|---------|----------|
| `llv_session_handoff.md` | `./` (root) | Running summary of all decisions, open items, and Bug Fix Cycle | Cowork |
| `llv_strategy.docx` | `docs/strategy/` | Executive vision, MVP strategy, expansion roadmap | Cowork |
| `llv_target_companies.docx` | `docs/strategy/` | Strategic partners and competitive landscape | Cowork |
| `llv_strategic_analysis.docx` | `docs/strategy/` | Detailed partnership and market analysis | Cowork |
| `llv_technology_architecture_blueprint.docx` | `docs/strategy/tech-stack/` | System architecture, tech stack, service model | Cowork |
| `llv_business_strategy_assumptions_register.docx` | `docs/strategy/` | 10 open business decisions with working assumptions | Cowork |
| `llv_launch_readiness.md` | `docs/strategy/` | Launch checklist (legal, providers, pricing, etc.) | Cowork |
| `llv_phase_b_feature_checklist.docx` | `docs/strategy/` | Feature catalog with acceptance criteria | Cowork |
| `llv_phase_a_task_breakdown.md` | `docs/cowork/` | Phase A task plan | Cowork |
| `llv_phase_b_task_breakdown.md` | `docs/cowork/` | Phase B task plan | Cowork |
| `llv_design_system.md` | `docs/cowork/` | Design system reference (palette, typography, components) | Cowork |
| `llv_client_onboarding_sop.md` | `docs/cowork/` | Client onboarding standard operating procedure | Cowork |
| `llv_engineering_polish_todos.md` | `docs/cowork/` | Running list of engineering polish items queued for Code prompts | Cowork |
| `llv_sql_delete_user.sql` | `docs/cowork/` | Operational utility — delete a single user + all FK-cascaded data | Cowork |
| `llv_code_prompt_*.md` | `docs/cowork/` | Individual handoff prompts to Claude Code | Cowork |
| `llv_platform_test_plan.docx` | `docs/testing/` | Comprehensive QA test plan | Cowork |
| `DIVISION_OF_LABOR.md` | `./` (root) | This document — role definitions | Cowork |
| Application codebase (`/src`, `/supabase`, etc.) | `./` (root) | All production code | Claude Code |
| `README.md` | `./` (root) | Technical setup, dev instructions | Claude Code |
| `CLAUDE.md` | `./` (root) | Claude Code working instructions (incl. icon standard) | Claude Code |
| `AGENTS.md` | `./` (root) | Cross-agent coding rules | Claude Code |

---

## Conflict Resolution

- **Strategic / business conflicts:** Cowork's documents in the project folder are the source of truth for business logic, service model, and high-level architecture. The founder approves; Cowork records.
- **Implementation conflicts:** Claude Code's codebase is the source of truth for technical details, library versions, and configurations.
- **Architecture vs. reality:** If Claude Code discovers a technical constraint that conflicts with the architecture blueprint, the founder brings it back to Cowork. Cowork updates the blueprint and the handoff doc to reflect the new constraint. Claude Code does not unilaterally change architectural decisions captured in the project folder.
- **Document conflicts:** Cowork's local files are the canonical versions. If the founder receives a draft from elsewhere (e.g., a Chat session per the escalation rules above), Cowork integrates it into the project folder.

---

## Key Context for All Instances

- **Three-tier service model:** Tier 1 (Seasonal Wardrobe Rotation — subscription), Tier 2 (Total Wardrobe Management — premium add-on), Tier 3 (On-Demand Occasion Fulfillment — per-request, client browses own cataloged wardrobe remotely). Tier 3 is the key differentiator.
- **Bi-directional corridor model:** Wisconsin ↔ Arizona. Items tracked across multiple locations and states at both ends. Founder manages WI, daughter manages AZ.
- **Three user roles:** Client (luxury consumer), Provider (garment care partner), Admin (LLV operations).
- **Design philosophy:** Luxury concierge experience, not logistics software. Minimal, clean, photography-forward. Maximum three taps for any core task.
- **Target launch:** October 2026 for snowbird season. 10-15 founding clients. Budget $25K-$40K.
- **Founder background:** Technical entrepreneur, built and sold a company to UnitedHealthcare. Building MVP with AI-assisted tools.

---

*Last updated: May 30, 2026 — restructured from three-tool to two-tool model after Cowork absorbed the research and strategy responsibilities previously held by Claude Chat.*
*This document should be updated whenever roles, responsibilities, or workflows change.*
