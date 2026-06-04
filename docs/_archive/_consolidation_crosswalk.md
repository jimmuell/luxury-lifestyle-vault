# LLV — Documentation Consolidation Crosswalk
**Prepared:** June 2, 2026 (Claude Code, read-only audit pass)
**Scope:** All files under local `/docs` vs. canonical Google Drive folders 01–07.
**No files moved, edited, or deleted — inventory and comparison only.**

---

## Drive Folder Map (canonical source of truth)

| Folder | Canonical document | Drive file ID | Modified |
|---|---|---|---|
| **01 Vision & Strategy** | LLV Vision & Strategy | `1H9R0Baw2cusU2lFrJefxS6167KdJF7MLdrwSmhz0TPE` | 2026-06-02 |
| **02 Investor Materials** | LLV Executive Summary | `1ovbRXqvUn6nNf0ewAD3lyVxYFRBCEsJ8IlaOZyr9gE0` | 2026-06-02 |
| **03 Financial Model & Projections** | LLV Financial Model (High-Level) _(spreadsheet)_ | `1j7_-KDumIOYzOmFDOvm1yyllNJZorxxRtWqmrgti14A` | 2026-06-02 |
| **03 Financial Model & Projections** | LLV Financial & Strategic Glossary | `1D7NM3aAa8xRpo-1itCP01TbF3lRB1QIw5ux0wuJf45g` | 2026-06-02 |
| **04 Operations & Logistics** | LLV Operations & Logistics | `13n6zbn5CSc6Y75fVrNN3V3dA2rD34F-adqSPQlBOWo8` | 2026-06-02 |
| **05 RealReal Partnership & Integration** | LLV RealReal Partnership & Integration Strategy | `1KTy7tQk6EiK62FjaH53Ieevkt1bmxIuRon0PpV16yts` | 2026-06-02 |
| **06 Source Material & Filings** | TRR 10-K 2025 (PDF) | `1UKPt9FWhQSp9dy-4uMkmXCoriCsFwMJZ` | 2026-05-29 |
| **06 Source Material & Filings** | TRR Q1 2026 Press Release (PDF) | `19bGPHI8ghrpHW4UgEHHg5REAaxheUd3p` | 2026-05-29 |
| **07 Technology & Platform** | LLV Technology & Platform | `1cXAlarvy6JjOYE_bXF83ZR2whe8ops5NhAZzWOzcoMA` | 2026-06-02 |
| **99 Archive** | _(all superseded working drafts — see section C below)_ | — | — |

The Drive declares its own supersession rules: each canonical doc's header names the local/archive files it replaces. Every working draft in the 99 Archive folder is a named predecessor of one of the seven canonical documents above.

---

## A. Full Inventory + Classification

| # | Relative path | Type | Modified | One-line summary | Classification |
|---|---|---|---|---|---|
| 1 | `docs/archive/Tech Stack Claude Code.docx` | .docx | 2026-05-24 | Claude's recommended tech stack with rationale (Supabase-first, Inngest, Resend, Vercel) — the predecessor to Drive 07 | **DUPLICATE/STALE** |
| 2 | `docs/cowork/llv_arizona_provider_outreach_kit.md` | .md | 2026-06-01 | Cold-intro email, discovery-call script, and one-page proposal for RAVE FabriCARE / European Couture / Mastel (AZ side of pilot corridor) | **BUSINESS/STRATEGY** |
| 3 | `docs/cowork/llv_chat_session_prep.md` | .md | 2026-05-24 | Phase A working brief for a Chat session to resolve 12 open architecture decisions — all items now resolved | **DUPLICATE/STALE** |
| 4 | `docs/cowork/llv_client_onboarding_sop.md` | .md | 2026-05-24 | 12-stage operational SOP for onboarding a founding member — lead qualification through first seasonal delivery | **BUSINESS/STRATEGY** |
| 5 | `docs/cowork/llv_code_prompt_2026-05-29_deploy_debug.md` | .md | 2026-05-29 | Claude Code prompt: debug first Vercel deploy (env vars, RLS, seed) | **ENGINEERING** |
| 6 | `docs/cowork/llv_code_prompt_2026-05-29_seed_demo_cleanup.md` | .md | 2026-05-30 | Claude Code prompt: harden seed runner, add clear-all, demo-login gate | **ENGINEERING** |
| 7 | `docs/cowork/llv_code_prompt_2026-05-30_onboarding_redirect_fix.md` | .md | 2026-05-30 | Claude Code prompt: fix post-onboarding redirect and session timing | **ENGINEERING** |
| 8 | `docs/cowork/llv_code_prompt_2026-05-30_subscription_payment_fix.md` | .md | 2026-05-30 | Claude Code prompt: fix Stripe subscription creation and webhook sync | **ENGINEERING** |
| 9 | `docs/cowork/llv_code_prompt_2026-05-30_temp_disable_unsplash.md` | .md | 2026-05-30 | Claude Code prompt: temp-disable Unsplash fetch to unblock seed runs | **ENGINEERING** |
| 10 | `docs/cowork/llv_code_prompt_2026-05-31_accessories_glyph_inference.md` | .md | 2026-05-31 | Claude Code prompt: infer sub-category glyph for accessories in art cards | **ENGINEERING** |
| 11 | `docs/cowork/llv_code_prompt_2026-05-31_cleanup_fk_gap.md` | .md | 2026-05-31 | Claude Code prompt: add 7 missing FK tables to clear-all and clearAllTestAccounts | **ENGINEERING** |
| 12 | `docs/cowork/llv_code_prompt_2026-05-31_photo_seeding_art_cards.md` | .md | 2026-05-31 | Claude Code prompt: replace Unsplash seeding with Category Art Cards | **ENGINEERING** |
| 13 | `docs/cowork/llv_code_prompt_2026-05-31_seeded_badge_label.md` | .md | 2026-05-31 | Claude Code prompt: fix "X seeded" label misnomer on seed runner | **ENGINEERING** |
| 14 | `docs/cowork/llv_code_prompt_2026-05-31_theme_toggle_3state.md` | .md | 2026-05-31 | Claude Code prompt: add 3-state Light/Dark/System theme toggle | **ENGINEERING** |
| 15 | `docs/cowork/llv_code_prompt_2026-05-31_tier_active_synced_indicator.md` | .md | 2026-05-31 | Claude Code prompt: fix tier green-check active-vs-synced semantics | **ENGINEERING** |
| 16 | `docs/cowork/llv_code_prompt_2026-06-01_bell_badge_and_corridor_dup.md` | .md | 2026-06-01 | Claude Code prompt: notification bell badge reactivity + duplicate corridor error | **ENGINEERING** |
| 17 | `docs/cowork/llv_code_prompt_2026-06-01_concierge_queue_empty.md` | .md | 2026-06-01 | Claude Code prompt: fix admin concierge queue FK ambiguity | **ENGINEERING** |
| 18 | `docs/cowork/llv_code_prompt_2026-06-01_corridor_dup_refix.md` | .md | 2026-06-01 | Claude Code prompt: re-fix duplicate corridor error (return vs. throw) | **ENGINEERING** |
| 19 | `docs/cowork/llv_code_prompt_2026-06-01_native_dialogs.md` | .md | 2026-06-01 | Claude Code prompt: replace window.confirm with in-app confirm dialogs | **ENGINEERING** |
| 20 | `docs/cowork/llv_code_prompt_2026-06-01_pexels_migration.md` | .md | 2026-06-01 | Claude Code prompt: migrate seed photos from Unsplash to Pexels with attribution | **ENGINEERING** |
| 21 | `docs/cowork/llv_code_prompt_2026-06-01_provider_auth_seed.md` | .md | 2026-06-01 | Claude Code prompt: enable provider portal auth and seed provider accounts | **ENGINEERING** |
| 22 | `docs/cowork/llv_code_prompt_2026-06-01_provider_order_rls.md` | .md | 2026-06-01 | Claude Code prompt: add provider RLS for order access | **ENGINEERING** |
| 23 | `docs/cowork/llv_code_prompt_2026-06-01_qa_low_bugs.md` | .md | 2026-06-01 | Claude Code prompt: fix 4 low-severity QA bugs (Bug Fix Cycle #28) | **ENGINEERING** |
| 24 | `docs/cowork/llv_code_prompt_2026-06-01_save_pricing_freeze.md` | .md | 2026-06-01 | Claude Code prompt: fix save-pricing freeze (Bug #25) | **ENGINEERING** |
| 25 | `docs/cowork/llv_code_prompt_2026-06-01_unsplash_fetch_hardening.md` | .md | 2026-06-01 | Claude Code prompt: harden Unsplash fetch with retry, fallback, and diagnostics | **ENGINEERING** |
| 26 | `docs/cowork/llv_design_system.md` | .md | 2026-05-24 | Ratified design system spec: palette, typography, component patterns, icon policy | **ENGINEERING** |
| 27 | `docs/cowork/llv_engineering_polish_todos.md` | .md | 2026-05-31 | Running list of code-level cleanup items surfaced during testing — mostly resolved | **DUPLICATE/STALE** |
| 28 | `docs/cowork/llv_next_session_brief_2026-06-02.md` | .md | 2026-06-01 | Session handoff brief — QA complete, open items, login quick-reference | **ENGINEERING** |
| 29 | `docs/cowork/llv_phase_a_task_breakdown.md` | .md | 2026-05-25 | Phase A task list with completion status — historical record | **ENGINEERING** |
| 30 | `docs/cowork/llv_phase_b_task_breakdown.md` | .md | 2026-05-25 | Phase B task list with completion status (all 31 features shipped) — historical record | **ENGINEERING** |
| 31 | `docs/cowork/llv_sql_delete_user.sql` | .sql | 2026-05-30 | Dev utility SQL to hard-delete a Supabase auth user (bypasses RLS) | **ENGINEERING** |
| 32 | `docs/cowork/llv_tech_gap_report_2026-06-02.md` | .md | 2026-06-02 | Today's codebase-vs-blueprint gap report (SMS gap, seed gate, error monitoring) | **ENGINEERING** |
| 33 | `docs/cowork/llv_wisconsin_provider_outreach_kit.md` | .md | 2026-06-01 | Cold-intro email, call script, and one-page proposal for Martinizing / Klinke / London Cleaners (WI side) | **BUSINESS/STRATEGY** |
| 34 | `docs/strategy/llv_business_strategy_assumptions_register.docx` | .docx | 2026-06-01 | Living register of 10 open business decisions and working assumptions the codebase is built against | **BUSINESS/STRATEGY** |
| 35 | `docs/strategy/llv_launch_readiness.md` | .md | 2026-06-01 | Combined engineering + business pre-launch checklist with open items from assumptions register | **BUSINESS/STRATEGY** |
| 36 | `docs/strategy/llv_phase_b_feature_checklist.docx` | .docx | 2026-05-25 | Phase B feature spec with acceptance criteria — all features shipped; historical record | **ENGINEERING** |
| 37 | `docs/strategy/llv_strategic_analysis.docx` | .docx | 2026-05-24 | Competitive landscape analysis (RealReal, RTR, FASHIONPHILE, Vivrelle, MY WARDROBE HQ) | **DUPLICATE/STALE** |
| 38 | `docs/strategy/llv_strategy.docx` | .docx | 2026-05-24 | Early executive strategy + MVP blueprint — "mobile lifestyle logistics platform" framing | **DUPLICATE/STALE** |
| 39 | `docs/strategy/llv_target_companies.docx` | .docx | 2026-05-24 | Directory of strategic target companies with HQ, website, LinkedIn, and strategic relevance | **DUPLICATE/STALE** |
| 40 | `docs/strategy/llv_wisconsin_providers_research.md` | .md | 2026-06-01 | Desk research shortlist of WI garment-care providers: Martinizing (lead), Klinke, London Cleaners | **BUSINESS/STRATEGY** |
| 41 | `docs/strategy/luxury_lifestyle_vault_infrastructure_partners.docx` | .docx | 2026-05-24 | Evaluation of national infrastructure partners (Iron Mountain, Public Storage, FedEx, Amazon, etc.) | **DUPLICATE/STALE** |
| 42 | `docs/strategy/luxury_lifestyle_vault_infrastructure_storage.docx` | .docx | 2026-05-24 | Same content as infrastructure_partners (appears to be a duplicate of #41) | **DUPLICATE/STALE** |
| 43 | `docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx` | .docx | 2026-05-25 | Original technology architecture blueprint — working draft, May 2026 | **DUPLICATE/STALE** |
| 44 | `docs/testing/llv_dashboard_qa_verification_checklist.md` | .md | 2026-06-01 | QA checklist for the admin/client dashboards, used during June 1 test run | **ENGINEERING** |
| 45 | `docs/testing/llv_platform_test_plan.docx` | .docx | 2026-06-01 | Full test plan: 13 sections, 30 scenarios, ~150 steps | **ENGINEERING** |
| 46 | `docs/testing/llv_test_run_results_2026-06-01.md` | .md | 2026-06-01 | Results of the June 1 full-platform QA run; all critical/high bugs resolved | **ENGINEERING** |

---

## B. Business/Strategy Files Mapped to Drive

### B1. `docs/cowork/llv_client_onboarding_sop.md`
**Drive counterpart:** Partial — Drive 04 (Operations & Logistics) Section 2 covers the 8-step corridor workflow at a summary level.
**(a) Matching Drive doc:** Drive 04 `LLV Operations & Logistics`
**(b) Content in local NOT in Drive:** The local SOP has 12 stages with per-stage lead assignment, time estimates, system-support requirements, deliverables, and risk checkpoints. Drive 04 has only the high-level 8-step sequence. Specifically missing from Drive 04: Stage 1 (application/lead qualification), Stage 2 (concierge consultation script), Stage 3 (service agreement and Stripe payment setup), the per-tier intensity variations (T1 vs. T2 vs. T3 cataloging depth), the Stage 9 provider routing workflow, and Stage 12 (in-residence closet placement). This is genuine operational content the Drive 04 doc needs.
**(c) Drift/conflict:** None — the local doc and Drive 04 are consistent; Drive 04 is just less detailed.
**(d) Superseded?** No — local doc has unique operational content not yet reflected in Drive.

### B2. `docs/cowork/llv_arizona_provider_outreach_kit.md`
**Drive counterpart:** NO COUNTERPART IN DRIVE.
**(a)** Drive 04 references RAVE FabriCARE, European Couture, and Mastel by name in Section 7 (Provider Network), but the outreach kit itself (email template, discovery call script, one-page proposal, per-provider research notes, daughter/founder variant) does not exist in any Drive folder.
**(b)** Content absent from Drive: the full reusable provider-acquisition playbook for the AZ corridor.
**(c)** No conflict — content is additive.
**(d)** Not superseded.

### B3. `docs/cowork/llv_wisconsin_provider_outreach_kit.md`
**Drive counterpart:** NO COUNTERPART IN DRIVE.
**(a)** Drive 04 Section 7 says "Wisconsin providers to be identified." The kit exists only locally.
**(b)** The full kit (email, call script, proposal, per-provider notes for Martinizing/Klinke/London Cleaners) is not in Drive.
**(c)** No conflict.
**(d)** Not superseded.

### B4. `docs/strategy/llv_wisconsin_providers_research.md`
**Drive counterpart:** NO COUNTERPART IN DRIVE.
**(a)** Drive 04 Section 7 says "Wisconsin providers to be identified using the same research approach." The research output exists only locally.
**(b)** Absent from Drive: the full shortlist with qualification notes, addresses, capacity questions, and recommended "primary + secondary + specialist" pilot structure.
**(c)** No conflict — Drive 04 effectively has a blank where this content belongs.
**(d)** Not superseded.

### B5. `docs/strategy/llv_business_strategy_assumptions_register.docx`
**Drive counterpart:** Referenced in Drive 01 Section 12 ("Pilot for proof") and Drive 04 implicitly, but no dedicated Drive doc exists for the register.
**(a)** Closest counterpart: Drive 01 `LLV Vision & Strategy` (mentions working assumptions in passing).
**(b)** Content absent from Drive: the full 10-item register with item-by-item working assumptions, platform-impact assessments, open/resolved status, and resolution guidance. Drive 01 mentions key positions (custody-core, pricing, daughter's role) but not the structured register format. The register is the operational source of truth for which business decisions are still open. **This document should be added to Drive — either folder 01 or 04.**
**(c)** No conflict in content; minor framing drift: the register refers to the original "$249/$449" pricing as the working assumption with a note that the live platform runs "$299/$599." Drive 03 (Financial Model) should be checked to confirm alignment.
**(d)** Not superseded — it is a living document.

### B6. `docs/strategy/llv_launch_readiness.md`
**Drive counterpart:** Partial — Drive 07 (Technology & Platform) Section 10 contains a launch checklist covering engineering items only.
**(a)** Matching Drive doc: Drive 07 `LLV Technology & Platform` (Section 10).
**(b)** Content in local NOT in Drive: The local file is a combined business + engineering launch tracker. It adds: the legal checklist (LLC, trademark, insurance), provider network checklist (WI/AZ provider sign), pricing validation, founder-daughter team setup, founding-member recruitment materials, CAN-SPAM/ToS/Privacy content items, and the "Business Strategy (OPEN)" summary of the 10 assumptions register items. Drive 07 Section 10 has only the engineering half. **The full tracker should live in Drive — either 01 or 04 as the business-readiness home, with Drive 07 keeping its engineering section.**
**(c)** Drive 07 Section 7 (Build State) says "39 routes" and "24 migrations" — the local launch readiness doc references the same outdated counts. Both need updating: actual counts are 54 routes and 27 migrations (per the June 2 tech gap report).
**(d)** Not superseded — has unique business-readiness content.

### B7. `docs/strategy/llv_strategy.docx`
**Drive counterpart:** Drive 01 `LLV Vision & Strategy` (explicitly supersedes this file).
**(a)** Drive 01 is the canonical replacement.
**(b)** Content absent from Drive 01: the original document describes a slightly broader MVP scope ("platform enables customers to … eventually resell luxury personal assets"). Drive 01 deliberately positions resale as Phase 3 in the roadmap (not "eventually"). Minor nuance, not a gap worth preserving.
**(c)** **Key conflict/drift:** Local file uses "managed mobile lifestyle logistics platform" and "asset-light" framing throughout. Drive 01 has reconciled this: LLV owns the custody layer (intake, climate-controlled storage, chain-of-custody) and rents only cleaning/transport. The local doc pre-dates the custody-core reconciliation. **Do not carry the old framing forward.**
**(d)** Fully superseded by Drive 01.

### B8. `docs/strategy/llv_strategic_analysis.docx`
**Drive counterpart:** Drive 01 Section 8 (Competitive Landscape) + Drive 05 `LLV RealReal Partnership & Integration Strategy`.
**(a)** Split counterpart — Drive 01 covers the competitive landscape; Drive 05 covers RealReal specifically.
**(b)** Content absent from Drive: The local doc includes specific 2025 financial metrics for Rent the Runway (~144k subscribers, ~$91.7M Q4 revenue) and Vivrelle/MY WARDROBE HQ details that aren't in Drive 01. These are useful competitive-intelligence data points.
**(c)** **Key conflict/drift:** Local doc treats The RealReal as the straightforward "best overall strategic fit" with no discussion of the acquisition-guardrail, the storage-trap risk, or the "built to stand alone, TRR is upside not a dependency" principle. Drive 05 Section 9 (Risks and Guardrails) has these clearly. The old framing could be misleading if shown to a partner or investor. **The local doc carries a strategic risk if used as-is.**
**(d)** Substantively superseded. The RTR/Vivrelle/MWHQ financial details are the only potentially useful remnant — and those belong in Drive 06 (Source Material) if preserved at all.

### B9. `docs/strategy/llv_target_companies.docx`
**Drive counterpart:** Drive 01 Section 8 + Drive 05.
**(a)** Superseded by Drive 01 + 05.
**(b)** Content absent from Drive: HQ cities, websites, LinkedIn URLs for Rent the Runway, FASHIONPHILE, Vivrelle, MY WARDROBE HQ. Drive 01 covers these at a strategic level only, not as a contact directory.
**(c)** No strategic drift — the strategic relevance assessments align with Drive 01. The directory could be useful for future outreach but doesn't belong in the strategy canon.
**(d)** Substantively superseded. If the contact directory is worth keeping, it belongs in Drive 06 (Source Material) not Drive 01.

### B10. `docs/strategy/luxury_lifestyle_vault_infrastructure_partners.docx` and `…_infrastructure_storage.docx`
**Drive counterpart:** Drive 04 `LLV Operations & Logistics` Section 3 (Custody Nodes and Storage Strategy).
**(a)** Drive 04 is the canonical replacement. Note: both local files appear to contain identical content — `infrastructure_partners.docx` is likely a naming variant of `infrastructure_storage.docx` created during an earlier session.
**(b)** Drive 04 incorporates all key points: Iron Mountain as most strategically aligned, Public Storage limitations, FedEx for logistics, Amazon FBA rejected with explicit rationale. No unique content remains in the local files.
**(c)** No substantive conflict; Drive 04 adds the explicit reasoning for rejecting Amazon FBA (incompatible with chain-of-custody moat) which is an improvement over the local files' more neutral tone.
**(d)** Fully superseded by Drive 04.

### B11. `docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx`
**Drive counterpart:** Drive 07 `LLV Technology & Platform` (explicitly supersedes this file).
**(a)** Drive 07 is the canonical replacement.
**(b)** Unique content in local doc: Phase A–D timeline detail, the original draft technology stack table (which Drive 07 explicitly supersedes). Drive 07 has already incorporated and updated all substantive content.
**(c)** **Drift worth noting:** The local blueprint (Section 5 draft stack table) lists "AI Integration: Anthropic Claude API — Haiku 4.5 for photo categorization; Sonnet 4.6 available for higher-tier concierge features." Drive 07 carries this forward. However, the June 2 tech gap report found that Sonnet 4.6 is not actually implemented — the codebase only uses Haiku. This is a Drive 07 accuracy issue, not a local-vs-Drive conflict. Drive 07 Section 7 acknowledges "(confirm against the repository by Cowork)" — the gap report is that confirmation.
**(d)** Fully superseded by Drive 07.

---

## C. GAPS TO BRING TO CHAT

Business content in `/docs` not yet reflected in the Drive canon, or Drive docs that need updating from local sources.

**1. Client Onboarding SOP → Bring to Drive 04**
Source: `docs/cowork/llv_client_onboarding_sop.md` (May 24, 2026)
Drive 04 (Operations & Logistics) has a summary 8-step workflow but lacks the operational SOP: 12 stages with lead assignment, time estimates, per-tier intensity variations, system-support requirements, deliverables, and risk checkpoints. This is the founder's playbook for onboarding the first founding members. It should be added to Drive 04 (or as a companion doc in Drive 04's folder).

**2. Wisconsin Provider Research → Bring to Drive 04**
Source: `docs/strategy/llv_wisconsin_providers_research.md` (June 1, 2026)
Drive 04 Section 7 currently says "Wisconsin providers to be identified." The desk research is complete (Martinizing lead, Klinke secondary, London Cleaners specialist) with per-provider qualification notes, addresses, and B2B question lists. Belongs in Drive 04 as a companion to the AZ provider list.

**3. WI Provider Outreach Kit → Bring to Drive 04**
Source: `docs/cowork/llv_wisconsin_provider_outreach_kit.md` (June 1, 2026)
Full reusable kit (intro email, discovery call script, one-page proposal) for WI provider outreach. No Drive counterpart. Belongs in Drive 04.

**4. AZ Provider Outreach Kit → Bring to Drive 04**
Source: `docs/cowork/llv_arizona_provider_outreach_kit.md` (June 1, 2026)
Same kit format for RAVE FabriCARE / European Couture / Mastel. Together with the WI kit, these are the reusable provider-acquisition playbook for every future corridor. Both belong in Drive 04.

**5. Business Strategy Assumptions Register → Add to Drive (01 or 04)**
Source: `docs/strategy/llv_business_strategy_assumptions_register.docx` (June 1, 2026)
Structured 10-item register of every open business decision with working assumptions and platform-impact assessments (pricing, insurance, entity, daughter's role, capital strategy, WI providers, etc.). Drive 01 and 04 reference these decisions at a high level but the register itself — the working document that tracks what's open and what the codebase is built against — has no Drive home. Recommend Drive 01 as its home (it's a strategy operating document).

**6. Launch Readiness Tracker → Add to Drive (01 or 04), and update Drive 07**
Source: `docs/strategy/llv_launch_readiness.md` (June 1, 2026)
The local file is a combined business + engineering pre-launch checklist that covers legal, provider network, pricing, team setup, founding-member recruitment, infrastructure, and content. Drive 07 Section 10 has only the engineering half. The business half (LLC, trademark, insurance, provider contracts, founding-member outreach) should live in Drive 01 or 04. Additionally, Drive 07 Section 7 Build State says "39 routes / 24 migrations" — both are now outdated (54 routes / 27 migrations per June 2 tech gap report). Drive 07 needs this correction.

**7. Drive 07 accuracy updates (from June 2 tech gap report)**
Source: `docs/cowork/llv_tech_gap_report_2026-06-02.md` (June 2, 2026)
Three Drive 07 items need correction after the gap report:
- Section 5 stack lists "Unsplash, integrated into the seed pipeline" — Unsplash was replaced by **Pexels** on June 1, 2026.
- Section 7 (Build State) says "39 routes / 24 migrations" — actual state is 54 routes / 27 migrations.
- Section 5 SMS: Twilio is listed in the ratified stack, but SMS sending is not implemented (package installed, UI exists, no sends fire). Should note "scaffolded, not yet active at launch."
These are factual corrections that keep the single source of truth accurate.

**8. Protection Membership Tiers → Not yet in platform, but in Drive 05**
Source: Drive 05 (RealReal Partnership) Section 8
Drive 05 has a detailed protection-membership pricing model (Basic $299/yr, Premium $999/yr, Vault $2,499/yr, Signature $4,999/yr) that does NOT appear in the platform's `service_tiers` table or the assumptions register. This may be an intentional deferral (bailee insurance not yet obtained), but it is business content in Drive that hasn't been built and isn't tracked as an open item. Worth confirming whether protection memberships are in scope before launch or explicitly deferred.

---

## D. RETIRE / ARCHIVE (local files to move to archive or delete)

These files are fully superseded by the canonical Drive documents. They should be moved to `docs/archive/` or deleted. **No action taken here — confirmation from the founder required before moving.**

| File | Superseded by | Action |
|---|---|---|
| `docs/strategy/llv_strategy.docx` | Drive 01 `LLV Vision & Strategy` | Move to `docs/archive/` |
| `docs/strategy/llv_strategic_analysis.docx` | Drive 01 (§8) + Drive 05 | Move to `docs/archive/` |
| `docs/strategy/llv_target_companies.docx` | Drive 01 (§8) + Drive 05 | Move to `docs/archive/` (or Drive 06 if contact directory is wanted) |
| `docs/strategy/luxury_lifestyle_vault_infrastructure_partners.docx` | Drive 04 `LLV Operations & Logistics` | Move to `docs/archive/` |
| `docs/strategy/luxury_lifestyle_vault_infrastructure_storage.docx` | Drive 04 (duplicate of above) | Move to `docs/archive/` |
| `docs/strategy/tech-stack/llv_technology_architecture_blueprint.docx` | Drive 07 `LLV Technology & Platform` | Move to `docs/archive/` |
| `docs/archive/Tech Stack Claude Code.docx` | Drive 07 | Already in archive — confirm can delete |
| `docs/cowork/llv_chat_session_prep.md` | All open items resolved; historical | Delete or archive |
| `docs/cowork/llv_engineering_polish_todos.md` | Mostly resolved; remaining items in tech gap report | Delete (items captured elsewhere) |

---

## E. ENGINEERING — STAYS IN REPO

These files belong in the repository. They are implementation artifacts, development tools, or session-coordination docs — not business strategy docs. Do not move to Drive.

| File | Reason to keep in repo |
|---|---|
| `docs/cowork/llv_code_prompt_*.md` (14 files) | Claude Code implementation prompts — dev process artifacts |
| `docs/cowork/llv_design_system.md` | Ratified design system spec referenced by Drive 07 and CLAUDE.md |
| `docs/cowork/llv_next_session_brief_2026-06-02.md` | Session coordination — current state, not strategy |
| `docs/cowork/llv_phase_a_task_breakdown.md` | Phase A historical task record |
| `docs/cowork/llv_phase_b_task_breakdown.md` | Phase B historical task record (all 31 features) |
| `docs/cowork/llv_sql_delete_user.sql` | Dev utility SQL |
| `docs/cowork/llv_tech_gap_report_2026-06-02.md` | Codebase gap report — engineering artifact |
| `docs/strategy/llv_phase_b_feature_checklist.docx` | Phase B acceptance criteria — engineering history |
| `docs/testing/llv_dashboard_qa_verification_checklist.md` | QA checklist — testing artifact |
| `docs/testing/llv_platform_test_plan.docx` | Full test plan referenced in Drive 07 |
| `docs/testing/llv_test_run_results_2026-06-01.md` | June 1 QA run results |

---

## F. Drift Summary (key conflicts between local docs and Drive canon)

| Issue | Local doc | Drive canon | Severity |
|---|---|---|---|
| "Asset-light-everything" framing | `llv_strategy.docx` | Drive 01: LLV owns custody, rents cleaning/transport | HIGH — stale framing if doc used externally |
| RealReal as dependency, no guardrail | `llv_strategic_analysis.docx` | Drive 05: TRR is upside, not dependency; "storage trap" risk named | HIGH — strategic risk if old doc used with partners |
| "39 routes / 24 migrations" build state | `llv_launch_readiness.md`, Drive 07 §7 | Actual: 54 routes / 27 migrations (June 2 gap report) | MEDIUM — factual inaccuracy in two docs |
| Unsplash in tech stack | Drive 07 §5 | Pexels replaced Unsplash June 1, 2026 | MEDIUM — Drive 07 needs updating |
| Sonnet 4.6 "available" | Drive 07 §5, local blueprint | Codebase: Haiku only; Sonnet not wired | MEDIUM — Drive 07 needs a note |
| SMS listed as implemented | Drive 07 §5 | SMS scaffolded (package + UI), not sending | MEDIUM — Drive 07 needs a note |
| Protection membership tiers in Drive 05 | Not in platform or assumptions register | Drive 05 §8 has 4-tier model with pricing | LOW — may be intentional deferral, needs confirmation |
| Infrastructure_partners and _storage are identical | Two local .docx files | Covered by Drive 04 | LOW — cosmetic duplicate to clean up |
