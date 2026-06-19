# Data Room ↔ Vault Source Mapping (provisioning the other 22)

**By Cowork · 2026-06-18.** Maps each investor-room document to its canonical Drive source so the
remaining docs can be provisioned (Drive ref + version + fingerprint + modified-time baseline) and
their conformed PDFs regenerated where stale. Vision & Strategy is already provisioned.

Drive connector: `9f586802-0d0d-467a-9dd0-483bb955c548`. Room PDFs in the seed dir are dated **2026-06-10**.

## A. Clean map — active R-prefixed vault source (16 → regenerate; 1 current)

| Room file | Section | Vault source (`.docx`) | Folder | Drive id | Source modified | Room PDF stale? |
|---|---|---|---|---|---|---|
| exec_one_pager.pdf | concept | R02_LLV_Executive_One_Pager | 02 | 1cLQTQ_Ccl28c4F375v0tzTK_yZcHwxk_ | 2026-06-15 | yes → regen |
| phase_3_positioning.pdf | strategy | R01_LLV_Phase_3_Positioning | 01 | 17VTjdbYVSyIiYM8qFc1GSKlJDHeCGGRA | 2026-06-15 | yes → regen |
| assumptions_register.pdf | strategy | R01_LLV_Business_Strategy_Assumptions_Register | 01 | 1E8dAqeGXNpBlHBT1FYEq8LLyoKF4CVVE | 2026-06-15 | yes → regen |
| trust_liability_guardrails.pdf | strategy | R01_LLV_Trust_and_Liability_Guardrails | 01 | 1WjM4ogMhOeiXXB5HkMvb4ugCu53zNU0n | 2026-06-15 | yes → regen |
| realreal_partnership.pdf | market | R05_LLV_RealReal_Partnership | 05 | 1THPzxyCtAp0vzLh6eKPwmO_w8qVzYbtW | 2026-06-15 | yes → regen |
| trr_research_notes.pdf | market | LLV TRR Strategic Research Notes (Source) | 06 | 1PMOvxpzKbCG8jsF4v_nXFIcOaEZG6FY2 | 2026-06-09 | **no — current** |
| competitive_lessons_realreal.pdf | market | R13_LLV_Competitive_Lessons_RealReal | 13 | 1r4IuU8Qvt89blDVg-vfksOZNYUIhPt_B | 2026-06-17 | yes → regen |
| integrated_strategic_trust_analysis.pdf | financials | R02_LLV_Integrated_Strategic_and_Trust_Analysis | 02 | 1_j7Oq-vHQSiJBXJFTULAX8GBGhWp6nwf | 2026-06-15 | yes → regen |
| technology_and_platform.pdf | product | R07_LLV_Technology_and_Platform | 07 | 1UEgCQ14iEmyQqZnbgSxCEqIXThMfAawF | 2026-06-17 | yes → regen |
| vault_pilot_spec.pdf | product | R07_LLV_Vault_Pilot_Spec | 07 | 1LE2zJKlrSl8XWW36XyzAHHyBAKufhHgj | 2026-06-17 | yes → regen |
| operations_and_logistics.pdf | operations | R04_LLV_Operations_and_Logistics | 04 | 1o-sxQR-qk_rSsFowxD4kla9NCzvqrHoL | 2026-06-15 | yes → regen |
| client_onboarding_sop.pdf | operations | R04_LLV_Client_Onboarding_SOP | 04 | 1JmrRNaQUPXFHCoUGhw0WmSBh2I2_7AQe | 2026-06-15 | yes → regen |
| inventory_intake_strategy.pdf | operations | R13_LLV_Inventory_Intake_Strategy | 13 | 10L6Z_y5xxaj3-maPJEZBIdgBpRhBYvCO | 2026-06-17 | yes → regen |
| wardrobe_concierge_blueprint.pdf | operations | R13_LLV_Wardrobe_Concierge_Blueprint | 13 | 1V8inKZKGMWMuJZDRL42ov4Uu1PNg-SYP | 2026-06-17 | yes → regen |
| launch_implementation_plan.pdf | launch | R08_LLV_Launch_Implementation_Plan | 08 | 1RzL6mVgshegI9SUCw2PxEuTLMtIDzIVs | 2026-06-17 | yes → regen |
| launch_gates_action_plan.pdf | launch | R08_LLV_Launch_Gates_Action_Plan | 08 | 1nJPyp3CqvlBkskb6Item7-83nz50Cz6I | 2026-06-17 | yes → regen |
| client_item_protection.pdf | legal | R12_LLV_Client_Item_Protection | 12 | 1IGUdrekjKCQ5H87psQQr1xdQDLf2gi5T | 2026-06-17 | yes → regen |

## B. External filings — no editable source, byte-hash only (2)

| Room file | Section | Source | Drive id |
|---|---|---|---|
| realreal_press_release.pdf | market | REAL 2026.05.07 EX-99.1 Press Release (external) | 19bGPHI8ghrpHW4UgEHHg5REAaxheUd3p |
| realreal_10k_2025.pdf | market | RealReal Form 10-K 2025 (external) | 1UKPt9FWhQSp9dy-4uMkmXCoriCsFwMJZ |

These never "drift" (no editable source). The publisher byte-hashes the existing PDF; mark `content_status` current.

## C. Needs a decision — no clean active vault source (3)

| Room file | Section | Finding | Question |
|---|---|---|---|
| brochure.pdf | concept | The `02 / Brochure` subfolder is **empty**; no active source located. | Keep in room? If so, what's the source — or treat as `external` (byte-hash the current PDF)? |
| concept_packet.pdf | concept | Only **archived** copies exist (several `LLV_Concept_Packet` Google Docs + `LLV Concept Packet.pdf` in 99 Archive). No active R-doc. | Keep, retire, or supersede by Vision & Strategy? If keep, which archived copy is canonical? |
| pitch_deck.pdf | deck | A **presentation**, no `.docx` source. Belongs to the `/admin/presentations` upload path, not the docx publisher. | Confirm: provision as a presentation (byte-hash, no Drive source), managed via the admin uploader. |

## Plan once decisions are settled
1. **Regenerate** conformed, control-page-stripped house-style PDFs for the 16 stale docs in §A (from their current vault sources), using a generic text→PDF renderer (same style as the V&S room copy).
2. **Provision** all (ref, name, version, revised_at, `text_sha256` via `scripts/dataroom_fingerprint.py`, `source_modified_at`) into `manifest.json`; byte-hash the 2 externals.
3. **Publish** (founder/Code runs `--check` then `--publish`).
4. The daily audit then watches the whole room automatically.
