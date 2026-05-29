# Luxury Lifestyle Vault — Division of Labor

## Purpose
This document defines the roles and responsibilities between three Claude instances working on the Luxury Lifestyle Vault (LLV) project. All three serve the same founder but operate in different environments with different strengths. This document should be read by any Claude instance before starting work to avoid duplication, scope confusion, or conflicting outputs.

---

## Claude Chat (claude.ai / Claude App)
**Environment:** Web/mobile chat interface with document creation, web search, and memory across sessions.

**Role:** Strategic advisor, business architect, and researcher.

### Responsibilities
- **Business strategy and planning:** Market analysis, competitive landscape, partnership strategy, investor positioning, pricing and packaging decisions.
- **Research:** Web searches for market data, competitor information, provider research (dry cleaners, storage, logistics partners), investor landscape, and industry trends.
- **Operational design:** Service tier definitions, customer journey mapping, provider qualification standards, workflow design at the conceptual level.
- **Session continuity:** Maintaining memory across sessions, providing the handoff document content, tracking open items and decisions.
- **Investor materials strategy:** Narrative direction for pitch decks, executive summaries, financial projection logic, and fundraising strategy.
- **Technology architecture:** High-level system design, component selection, architecture decisions, and the technology blueprint. Claude Chat defines *what* gets built and *why*.
- **Initial document drafts:** When web search or strategic context is needed to create a document, Claude Chat drafts it and the founder saves it to the local project folder for Cowork to manage going forward.

### Does NOT Do
- Write production application code.
- Manage or update local files on the founder's computer (no file system access).
- Set up development environments or configure tooling.
- Make git commits or manage version control.

---

## Claude Cowork (Desktop App)
**Environment:** Claude Desktop app with full read/write access to the local LLV project folder on the founder's computer. Has Projects feature for persistent context.

**Role:** Document manager, project coordinator, and operational automation.

### Setup
Create a Cowork Project pointed at the local LLV project folder (e.g., `~/Documents/LuxuryLifestyleVault/`). Place this `DIVISION_OF_LABOR.md` file in that folder so Cowork reads it automatically at the start of every session. Set folder-specific instructions to always read this file first.

### Responsibilities
- **Document management:** Read, update, revise, and maintain all project documents (.docx, .md, spreadsheets, PDFs) in the local project folder. This includes the session handoff, technology architecture blueprint, strategy documents, and any new documents.
- **Handoff document updates:** After the founder completes a Claude Chat strategy session, Cowork updates the local `llv_session_handoff.md` with new decisions, resolved items, and changed priorities.
- **Document versioning:** Maintain document history, create backups before major revisions, track what changed and when.
- **Project organization:** Keep the project folder structured, organized, and clean. Ensure naming conventions are consistent.
- **Report generation:** Compile information across multiple project documents into new deliverables (investor one-pagers, provider outreach materials, operational checklists, comparison tables).
- **Data entry and formatting:** Take rough notes or conversation summaries from the founder and format them into polished project documents.
- **Spreadsheet work:** Build and maintain budget spreadsheets, pricing models, provider comparison matrices, timeline trackers, and client tracking sheets.
- **Provider outreach materials:** Draft emails, proposals, and partnership term sheets for approaching RAVE FabriCARE, European Couture Cleaners, and Wisconsin providers based on strategy defined in Claude Chat sessions.
- **Operational checklists:** Create pre-launch checklists, onboarding workflows, quality control protocols, and standard operating procedures.
- **Bridge between strategy and code:** Translate the technology architecture blueprint into structured requirements or task lists that Claude Code can consume. Cowork reads the blueprint and produces sprint-level breakdowns, user stories, or feature specs.

### Does NOT Do
- Make strategic business decisions (that happens in Claude Chat sessions).
- Write production application code (that's Claude Code's job).
- Conduct web research or competitive analysis (no internet access — that's Claude Chat).
- Deploy applications or manage servers.
- Change the technology stack or architecture without founder confirmation from a Claude Chat session.

---

## Claude Code (VS Code / Terminal)
**Environment:** VS Code with terminal access, working directly in the application codebase repository.

**Role:** Software engineer and technical implementer.

### Responsibilities
- **Application development:** Write all production code for the LLV platform including frontend (Next.js/React), backend (API routes), database schemas, and integrations.
- **Database design and implementation:** Create and run migrations, define models, set up Supabase or PlanetScale schemas based on the architecture blueprint.
- **Frontend implementation:** Build the client portal, provider portal, and admin dashboard UI using Next.js, React, and Tailwind CSS following the design principles in the architecture blueprint.
- **API development:** Build all API endpoints for inventory management, scheduling, notifications, provider dispatch, and client communication.
- **Authentication and authorization:** Implement role-based access control (client, provider, admin) using Supabase Auth or Auth0.
- **AI integration:** Implement Claude API calls for item categorization, concierge assistance, and operational intelligence features.
- **Payment integration:** Implement Stripe for subscription billing, per-request charges (Tier 3), and invoicing.
- **Photo and file management:** Implement image upload, storage (Cloudflare R2/S3), CDN delivery, and the browsable wardrobe catalog interface.
- **Testing:** Write and run unit tests, integration tests, and end-to-end tests.
- **DevOps:** Configure hosting (Vercel/AWS), environment variables, CI/CD pipelines, and deployment.
- **Bug fixes and debugging:** Troubleshoot issues, fix errors, optimize performance.
- **Technical README:** Create and maintain the application `README.md` with setup instructions, environment configuration, and developer documentation.

### Does NOT Do
- Make business strategy decisions or change the service model.
- Create or modify business strategy documents, investor materials, or business plans.
- Conduct market research or competitive analysis.
- Change the technology stack or architecture without the founder confirming the change was decided in a Claude Chat session.
- Communicate with providers, investors, or customers on behalf of the founder.

---

## How the Three Tools Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                        FOUNDER                                  │
│         (Makes all final decisions, coordinates tools)          │
└──────────┬──────────────────┬──────────────────┬────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│   CLAUDE CHAT    │ │  CLAUDE COWORK   │ │    CLAUDE CODE       │
│                  │ │                  │ │                      │
│  Strategy        │ │  Documents       │ │  Engineering         │
│  Research        │ │  Coordination    │ │  Implementation      │
│  Architecture    │ │  Formatting      │ │  Testing             │
│  Decisions       │ │  Task Breakdown  │ │  Deployment          │
│                  │ │  SOPs & Checklists│ │                      │
│  Outputs:        │ │  Outputs:        │ │  Outputs:            │
│  Strategic       │ │  Polished docs   │ │  Working code        │
│  direction &     │ │  in local folder │ │  in app repository   │
│  draft docs      │ │                  │ │                      │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────┘
         │                    │                       │
         │    Founder saves   │   Founder provides    │
         │    drafts to ───►  │   specs to ─────────► │
         │    local folder    │   code repo            │
         │                    │                       │
         │  ◄── Founder       │  ◄── Founder brings   │
         │  pastes handoff    │  implementation        │
         │  into new session  │  learnings back        │
         └────────────────────┴───────────────────────┘
```

### Typical Workflow Cycles

**Strategy Cycle:**
1. Founder opens Claude Chat session with handoff document.
2. Claude Chat conducts research, makes strategic recommendations, drafts documents.
3. Founder downloads outputs to local LLV project folder.
4. Founder opens Cowork, which updates the handoff and polishes documents.

**Build Cycle:**
1. Founder asks Cowork to break the architecture blueprint into development tasks.
2. Cowork produces a structured task list or sprint plan in the local folder.
3. Founder provides the task list to Claude Code in VS Code.
4. Claude Code builds the features.
5. If Claude Code hits an architectural question, founder brings it to Claude Chat.

**Document Update Cycle:**
1. After any session (Chat or Code), founder opens Cowork.
2. Cowork updates the handoff document with new decisions or learnings.
3. Cowork ensures all project documents are consistent and current.

---

## Shared Reference Documents

### Naming and location conventions
- Cowork-managed content documents use the `llv_` prefix with snake_case (e.g., `llv_strategy.docx`).
- Convention documents at project root keep their conventional casing: `DIVISION_OF_LABOR.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`.
- Standing-instruction files (read at start of every Cowork session) live at the project root for visibility.
- All other Cowork-produced or Cowork-maintained docs live under `docs/` in a topical subfolder.

### Folder layout
- `./` (project root) — convention docs and standing-instruction files
- `docs/strategy/` — Claude Chat strategic deliverables (strategy, analysis, target companies, technology architecture blueprint)
- `docs/cowork/` — Cowork-produced deliverables (provider outreach, SOPs, task breakdowns, sprint plans, checklists)
- `docs/tech-stack/` — currently holds the unsanctioned `Tech Stack Claude Code.docx` addendum pending Chat resolution; may be removed after resolution

### Reference document index

| Document | Location | Purpose | Created By | Maintained By |
|----------|----------|---------|------------|---------------|
| `llv_strategy.docx` | `docs/strategy/` | Executive vision, MVP strategy, expansion roadmap | Claude Chat | Cowork |
| `llv_target_companies.docx` | `docs/strategy/` | Strategic partners and competitive landscape | Claude Chat | Cowork |
| `llv_strategic_analysis.docx` | `docs/strategy/` | Detailed partnership and market analysis | Claude Chat | Cowork |
| `llv_technology_architecture_blueprint.docx` | `docs/strategy/` | System architecture, tech stack, service model | Claude Chat | Cowork |
| `llv_session_handoff.md` | `./` (root) | Running summary of all decisions and open items | Claude Chat | Cowork |
| `llv_needs_chat_review.md` | `./` (root) | Log of drift, conflicts, and questions awaiting Chat resolution | Cowork | Cowork |
| `DIVISION_OF_LABOR.md` | `./` (root) | This document — role definitions | Claude Chat | Cowork |
| `Tech Stack Claude Code.docx` | `docs/tech-stack/` | Unsanctioned stack addendum from Claude Code — pending Chat review, not authoritative | Claude Code | (do not modify) |
| Application codebase (`/src`, `/supabase`, etc.) | `./` (root) | All production code | Claude Code | Claude Code |
| `README.md` | `./` (root) | Technical setup, dev instructions | Claude Code | Claude Code |
| `CLAUDE.md` | `./` (root) | Claude Code working instructions | Claude Code | Claude Code |
| `AGENTS.md` | `./` (root) | Cross-agent coding rules (Next.js version warning) | Claude Code | Claude Code |

---

## Conflict Resolution
- **Strategic conflicts:** Claude Chat's documents are the source of truth for business logic, service model, and high-level architecture.
- **Implementation conflicts:** Claude Code's codebase is the source of truth for technical details, library versions, and configurations.
- **Document conflicts:** Cowork's local files are the canonical versions. If Claude Chat creates a new draft, Cowork integrates it into the project folder.
- **Architecture vs. reality:** If Claude Code discovers a technical constraint that conflicts with the architecture blueprint, the founder brings it to Claude Chat to update the blueprint. Claude Code does not unilaterally change architectural decisions.

---

## Key Context for All Instances
- **Three-tier service model:** Tier 1 (Seasonal Wardrobe Rotation — subscription), Tier 2 (Total Wardrobe Management — premium add-on), Tier 3 (On-Demand Occasion Fulfillment — per-request, client browses own cataloged wardrobe remotely). Tier 3 is the key differentiator.
- **Bi-directional corridor model:** Wisconsin ↔ Arizona. Items tracked across multiple locations and states at both ends. Founder manages WI, daughter manages AZ.
- **Three user roles:** Client (luxury consumer), Provider (garment care partner), Admin (LLV operations).
- **Design philosophy:** Luxury concierge experience, not logistics software. Minimal, clean, photography-forward. Maximum three taps for any core task.
- **Target launch:** October 2026 for snowbird season. 10-15 founding clients. Budget $25K-$40K.
- **Founder background:** Technical entrepreneur, built and sold a company to UnitedHealthcare. Building MVP with AI-assisted tools.

---

*Last updated: May 24, 2026*
*This document should be updated whenever roles, responsibilities, or workflows change.*
