# LLV — Client Onboarding Standard Operating Procedure

**Author:** Claude Cowork
**Date:** May 24, 2026
**Source documents:** `docs/strategy/llv_technology_architecture_blueprint.docx` (Section 2.2 Onboarding Flow), `llv_session_handoff.md` (Sections 3 Three-Tier Service Model, 4 Bi-Directional Corridor Model, 5 Pilot Market Details).
**Scope:** End-to-end process for a founding member from first contact through first seasonal delivery. Covers the bi-directional WI ↔ AZ corridor. Designed to support all three service tiers, with intake intensity scaling by tier.

---

## How to use this document

This SOP is dual-purpose. It is (1) the operational playbook the founder (Wisconsin) and daughter (Arizona) execute when onboarding a founding member, and (2) the source of truth for what the technology platform must support. Tasks in `llv_phase_a_task_breakdown.md` map back to the system support called out in each stage below.

Each stage lists: who does it, where, time estimate, system support required, deliverable produced, and explicit risks/checkpoints. Stages are sequential — do not skip ahead without a documented reason.

Tier callouts use shorthand:
- **T1** = Seasonal Wardrobe Rotation (subscription)
- **T2** = Total Wardrobe Management (premium add-on)
- **T3** = On-Demand Occasion Fulfillment (per-request)

A founding member is enrolled in T1 by default and may add T2 and/or T3 during or after onboarding.

---

## Stage map at a glance

| # | Stage | Lead | Tier scope | Typical duration |
|---|---|---|---|---|
| 1 | Application & lead qualification | Founder | All | 1–3 days |
| 2 | Concierge consultation call | Founder | All | 60–90 min call + 1 day follow-up |
| 3 | Service agreement & payment setup | Founder | All | 1–3 days |
| 4 | Intake logistics & scheduling | Founder + Daughter | All | 1 week |
| 5 | On-site wardrobe intake (primary residence) | Founder (WI) or Daughter (AZ) | All | 4–8 hours per residence |
| 6 | Cataloging, photography, condition documentation | Same as Stage 5 | All; T2/T3 most thorough | Performed during Stage 5 |
| 7 | Digital inventory review & client confirmation | Client + Founder | All | 24–72 hours |
| 8 | Seasonal schedule & delivery preferences | Client + Founder | All | 30 min call |
| 9 | Provider routing & first cleaning cycle | Founder + Provider | All items needing care | 5–10 days |
| 10 | Storage placement | Founder (WI) or Daughter (AZ) | All | Same day as cleaning completion |
| 11 | First seasonal corridor delivery | Founder + Daughter + Carrier | T1/T2 seasonal items | 3–7 days end to end |
| 12 | In-residence placement at destination | Daughter (AZ) or Founder (WI) | All | 2–4 hours per residence |
| 13 | Post-delivery confirmation & feedback | Founder | All | 7 days post-delivery |
| 14 | Steady-state relationship setup | Founder | All | Ongoing |

Total elapsed time from application to first seasonal delivery completed: **6–10 weeks** for a typical founding member, longer if intake spans both residences (T2 norm).

---

## Stage 1 — Application & lead qualification

**Who:** Founder (Brookfield, WI).
**Where:** Phone, email, or web form.
**Duration:** 1–3 days from inquiry to qualification decision.

A prospective founding member arrives via referral channel (property manager, real estate agent, country club, wealth advisor, personal referral). They submit an application — either through the LLV web form (when the public site is live) or via a founder-facilitated intake email.

**Qualification criteria (informal for founding members, formalized over time):**
- Maintains primary and seasonal residences (or has a comparable mobile-lifestyle need)
- Wardrobe value and volume justifies the service economics (rough screen: $25K+ in luxury garments; 50+ items in seasonal rotation)
- Comfortable with concierge-tier pricing (set in Section 13 Open Item 2 — currently TBD)
- Willing to be a founding member: provide testimonials, tolerate operational learning, feedback frequently

**System support required:**
- Public landing page with founding member application form (CX-1 area; full marketing site is out of Phase A)
- Lead/applicant table or document — for Phase A, a spreadsheet in `docs/cowork/` is acceptable. Promote to a CRM table in Phase B if volume justifies.

**Deliverable produced:** Qualified prospect file with contact info, residence locations, rough wardrobe scale estimate, source of referral.

**Checkpoints:**
- Do not advance to Stage 2 without confirming both residence locations are within the WI ↔ AZ corridor (until expansion).
- Do not advance to Stage 2 if the founder lacks bandwidth to deliver concierge service to a new member (pilot capacity ceiling: 15 founding members).

---

## Stage 2 — Concierge consultation call

**Who:** Founder leads. Daughter joins by phone if the prospect's primary or seasonal residence is in AZ (most cases).
**Where:** Video call preferred; in-person at the WI residence if feasible.
**Duration:** 60–90 minutes for the call; follow-up summary email within one business day.

This is the relationship-establishing conversation. It is sales, discovery, and trust-building combined. It should not feel like a logistics interview.

**Agenda:**
1. Personal introduction (founder background, UHC exit, why LLV exists)
2. Understand the client's seasonal pattern: when they arrive at each residence, how long they stay, what they bring
3. Wardrobe inventory at a high level: rough count, dominant categories, presence of couture or heirloom pieces, current storage situation
4. Pain points with current arrangement (most prospects have a current makeshift system; understand the gap)
5. Walk through the three-tier service model in plain language. Most founding members will start with T1 + T3; T2 is for highest-tier clients
6. Concierge channel expectations — how the client prefers to communicate (email, phone, text) and response-time expectations
7. Insurance and chain-of-custody — speak to it confidently; refer to current Open Item 4 for formal answers if pressed
8. Founding member terms (still being finalized in Section 13 Open Item 2)
9. Next steps and what the intake visit will look like

**System support required:**
- None at the platform level for the call itself
- Consultation call notes captured in `client_profiles.internal_notes` once the account is created (Stage 3)
- Calendar booking — Phase A uses founder's existing calendar; Phase B may integrate Cal.com or similar

**Deliverable produced:** Written summary email to the prospect confirming what was discussed, recommended tier(s), proposed pricing (once Open Item 2 resolves), proposed intake date, formal agreement to follow.

**Checkpoints:**
- Confirm the prospect's expectation of when they need to be "ready" at each residence — this drives the first seasonal delivery deadline working backwards.
- Flag any item types that exceed founder/provider competence (e.g., antique furs, museum-grade couture) so they can be excluded from intake or routed to a specialty partner before Stage 5.

---

## Stage 3 — Service agreement & payment setup

**Who:** Founder + prospect.
**Where:** Email + DocuSign or equivalent.
**Duration:** 1–3 days.

Convert the prospect into a paying founding member.

**Activities:**
1. Founder sends the founding member service agreement (template to be drafted by Cowork once Open Item 4 — insurance and liability structure — resolves)
2. Client signs
3. Founder creates the client account in LLV platform: invites them via email, they complete signup (creates `profiles` row, role = `client`)
4. Client completes onboarding flow in app: profile basics, primary residence, seasonal residence, tier selection (CX-6 in Phase A task breakdown)
5. Stripe customer is created; subscription enrollment (T1, T2 add-on) is staged in Stripe but **not activated for billing** until first seasonal cycle completes (founding member courtesy — confirm with founder)
6. Founder records consultation notes in `client_profiles.internal_notes`

**System support required:**
- Working signup + auth (✅ done)
- Onboarding wizard (CX-6 — Phase A in progress)
- Address management (CX-5 — Phase A in progress)
- Stripe customer creation (Phase B; for Phase A founding members, founder can create manually in Stripe dashboard and store the ID in `client_profiles.stripe_customer_id`)

**Deliverable produced:** Active `profiles` and `client_profiles` rows with both addresses, signed agreement filed, Stripe customer created.

**Checkpoints:**
- Both addresses must be entered and primary designated before advancing.
- Internal notes must capture: tier elections, special handling instructions, any items pre-excluded from intake, founder's read of the relationship (high-touch vs. light-touch preferences).

---

## Stage 4 — Intake logistics & scheduling

**Who:** Founder coordinates. Daughter coordinates the AZ side if applicable.
**Where:** Email/phone between founder ↔ client ↔ daughter.
**Duration:** Up to one week of coordination, then the intake visit is scheduled 1–4 weeks out depending on season.

This is the operational planning stage before any physical handling of items.

**Decisions to make:**
1. **Where does intake happen?** For T1 founding members in steady residence, intake occurs at the residence where the wardrobe currently lives at the start of the engagement. For T2, intake happens at **both** residences (typically separated by weeks). Most snowbird clients begin the engagement in May–August at the WI residence, with the AZ residence intake happening in October–November after the client travels south.
2. **Who leads the visit?** Founder leads WI intake. Daughter leads AZ intake. If both are needed, schedule sequentially with shared inventory access between them.
3. **What gets brought?** Intake supply kit: camera + lighting equipment, garment racks (for staging), measuring tools, gentle handling materials (acid-free tissue, garment bags), barcode/SKU label printer (or stickers + handwritten until printer is sourced), laptop for live cataloging into the LLV admin app.
4. **How long?** 4–8 hours per residence depending on wardrobe size. Book a full day to avoid rushing. Couture and heirloom items take longer per piece.
5. **Provider coordination:** If items will be sent directly from intake to a cleaning partner (typical), confirm provider capacity for the post-intake week. Notify RAVE FabriCARE / European Couture Cleaners (AZ) or to-be-identified WI providers of inbound volume.

**System support required:**
- Admin can view full client profile and addresses (OE-2 — Phase A)
- Admin can pre-create item shell records or batch-create at intake (OE-3 — Phase A)

**Deliverable produced:** Confirmed intake date(s), location(s), supply kit ready, provider downstream capacity confirmed.

**Checkpoints:**
- Confirm the client will be present for at least the first hour of intake (relationship moment + clarification on heirloom or contested items).
- Confirm parking, freight elevator access, or other building logistics if applicable.

---

## Stage 5 — On-site wardrobe intake (primary residence)

**Who:** Founder (WI residence) or Daughter (AZ residence).
**Where:** Client's residence.
**Duration:** 4–8 hours.

The defining first impression of the service. Execution quality at this stage cascades through every subsequent stage.

**Sequence:**
1. **Arrival & client greeting** (15 min). Brief recap of what will happen today. Set up staging area (racks, photography backdrop, laptop).
2. **Walk-through with client** (30 min). Client points out heirloom or sentimental pieces, items that should NOT be cleaned, items currently in poor condition, anything excluded from the engagement.
3. **Sort by category and decision** (1–2 hours). Pile structure: (a) take for intake → catalog, photograph, then route to cleaning or storage; (b) catalog-only → photograph and document but leave at residence; (c) exclude → no system record; (d) needs special handling → flag for follow-up provider.
4. **Category-by-category cataloging** (Stage 6 happens during this time — see next stage).
5. **Confirm what physically leaves with the LLV team** (30 min). Print or write the take-list, have client review and sign acknowledgment. Take photos of the take-list contents in a single batch as chain-of-custody evidence.
6. **Pack items** for transport to cleaning or storage (30–60 min depending on volume).
7. **Departure** (15 min). Thank the client. Confirm the next communication touchpoint (when their digital inventory review will be ready, Stage 7).

**System support required:**
- Live intake interface on tablet or laptop (CX-4 + OE-3 — Phase A)
- Photo upload primitive (DI-2 — Phase A)
- HEIC support (built into DI-2)
- Offline-tolerant if intake happens in poor connectivity environments — **noted as a future hardening item; not blocking Phase A.** For now, mitigate by capturing photos to camera roll first, uploading after departure if needed.

**Deliverable produced:** All items either cataloged or excluded; physical items in LLV custody packed and ready for transport; signed take-list as chain-of-custody.

**Checkpoints:**
- Every item taken from the residence must have a corresponding `items` row + at least one photo BEFORE leaving the residence. No exceptions. This is the firewall against the "what happened to my green dress" failure mode that would kill the business.
- Condition record (`item_conditions`) created at intake for every item taken, with `assessed_by` = founder/daughter and `condition_level` set.
- Take-list signed (digital or paper, scan if paper) and stored.

---

## Stage 6 — Cataloging, photography, condition documentation

**Who:** Same as Stage 5 (the person executing intake). May add a second hand (assistant, the other LLV principal joining remotely via video for QA) at scale.
**Where:** At the client residence, performed concurrently with Stage 5.
**Duration:** Embedded within Stage 5's 4–8 hours.

This is the data capture stage that powers Tier 3. Every shortcut here degrades the catalog's value for years.

**Per-item protocol:**
1. **Photograph** (3–5 photos per item):
   - Full front, on hanger or form, properly lit
   - Full back
   - Brand label / inner tag
   - Any condition concerns (wear, repairs, alterations) — close-up with annotation
   - Optional: detail shot of distinctive feature (embroidery, buckle, lining)
2. **Capture metadata** in the intake form (CX-4):
   - Required: name (concise, distinctive — "Black silk Armani evening gown" not "dress"), category (from 14-value enum), client_id (already known)
   - Recommended: brand, color, size, material, season, purchase year (estimate is fine), care instructions, location_label
   - Optional: purchase price, description, internal notes
3. **Run AI categorization** (DI-3, Phase A): on photo upload, the categorization function suggests category/brand/color. Person executing intake confirms or overrides. This is a speed lever; the human is the source of truth.
4. **Condition record** (`item_conditions`): condition_level (pristine / excellent / good / fair / poor) + notes + structured issues if any.
5. **SKU printed or written** on intake tag affixed to garment for physical tracking until item is sleeved and stored.

**Tier-specific intensity:**
- **T1:** Catalog only the seasonal-rotation portion of the wardrobe (the items that will move between residences). Other items can be deferred.
- **T2:** Catalog the entire wardrobe at both residences. This is the premium offering; thoroughness is the differentiator.
- **T3:** Requires the catalog to be **complete** for the items the client will want to summon on demand. If the client is T1 + T3, ensure the T3-relevant items (formalwear, special occasion pieces) are cataloged with extra metadata richness.

**System support required:** See Stage 5 system support. All Phase A tasks DI-2 (upload), DI-3 (AI categorization), CX-4 (intake form), OE-3 (admin item creation) are on the critical path here.

**Deliverable produced:** Every taken item has a complete `items` row, 3+ photos in `item_photos`, an `item_conditions` row, and a physical SKU tag.

**Checkpoints:**
- Photo quality spot-check every 10 items. Bad photos taken now cannot be fixed remotely after the item ships to a provider.
- AI suggestions accepted blindly degrade the catalog. Confirm or override every one.
- The catalog is a luxury product. Names should read like a curated boutique inventory, not a logistics ledger.

---

## Stage 7 — Digital inventory review & client confirmation

**Who:** Client + Founder.
**Where:** Client uses the LLV web app; founder available by phone or email for questions.
**Duration:** 24–72 hours typical; up to one week if client travel intervenes.

The client sees their wardrobe through the platform for the first time. This is the moment that proves the technology delivers on the promise. It is also the QA gate where errors are surfaced.

**Activities:**
1. Founder triggers "inventory ready for review" notification (Phase B email; for Phase A, manual email or text from founder)
2. Client logs in to `/client/wardrobe` and browses the catalog
3. Client reviews each item: photo correct, name correct, category correct, missing items reported, items in catalog that should not be reported
4. Client confirms (or disputes) via in-app action or direct contact with founder
5. Founder reconciles any disputes (re-photograph, correct metadata, add omitted items via OE-3)
6. Client signs off — flag stored in `client_profiles.preferences.inventory_confirmed_at` (jsonb field, no schema change needed)

**System support required:**
- `/client/wardrobe` (CX-2 — Phase A)
- `/client/wardrobe/[id]` (CX-3 — Phase A)
- Concierge messaging stub for asking questions (CX-7 — Phase A)
- Admin item edit (OE-3 — Phase A)

**Deliverable produced:** Client-confirmed digital inventory.

**Checkpoints:**
- Do not advance to Stage 9 (provider routing for cleaning) until inventory is confirmed. Cleaning an item that wasn't supposed to be in custody, or losing an item the client thought was excluded, is the worst possible failure mode.

---

## Stage 8 — Seasonal schedule & delivery preferences

**Who:** Client + Founder.
**Where:** 30-minute call or detailed email exchange.
**Duration:** 30 minutes of conversation; logged in same day.

Set the cadence for the first year of service.

**Decisions to capture:**
1. Expected arrival date at AZ residence (drives Fall transition deadline working backward)
2. Expected return date to WI residence (drives Spring transition deadline)
3. Lead time the client wants for delivery to arrive (most prefer 3–5 days before arrival so they walk into a fully prepared closet)
4. Delivery preferences: courier vs. freight, signature required, building/concierge instructions
5. Communication preferences for status updates (email cadence, SMS opt-in, threshold for proactive notification)
6. T3 ordering preferences: how far in advance to honor on-demand requests (commit to standard SLA; document exceptions)

**System support required:**
- Address fields with `delivery_instructions` (✅ done)
- `client_profiles.preferences` jsonb (✅ done) — stores seasonal arrival dates and lead times until Phase B introduces a dedicated scheduling table
- `preferred_contact_method` field (✅ done)

**Deliverable produced:** Documented seasonal calendar for the year, delivery preferences, communication preferences.

**Checkpoints:**
- Working backward from the AZ arrival date, confirm there is sufficient time for the cleaning cycle (Stage 9, 5–10 days) and the corridor delivery (Stage 11, 3–7 days). If the inquiry comes too close to the season transition for a full cleaning cycle, propose a partial delivery (items already in storage) with a follow-up shipment.

---

## Stage 9 — Provider routing & first cleaning cycle

**Who:** Founder dispatches to providers; provider performs service.
**Where:** Provider facilities (Wisconsin or Arizona depending on where intake occurred and where item will be stored next).
**Duration:** 5–10 days end to end.

**Process:**
1. Founder reviews intake batch, decides per item: (a) clean now → ship to provider, (b) clean later → store as-is, (c) skip (item didn't need cleaning at intake)
2. Items routed for cleaning are batched by provider and service type (dry clean, leather care, special handling)
3. Items physically delivered to provider with packing slip listing SKU, item name, requested service, and any special notes from the condition record
4. Item status transitions: `received` → `in_cleaning` (via admin status transition, OE-3)
5. Provider performs service; communicates completion
6. Item status: `in_cleaning` → `cleaning_complete` (when provider notifies and items return) → `stored` (when placed in storage)
7. Post-cleaning condition record created (OE-5) — comparison against intake condition is the chain-of-custody evidence

**System support required:**
- Admin item detail with status transition controls (OE-3 — Phase A)
- Condition logging on status transition (OE-5 — Phase A)
- Phase B will add formal provider dispatch (assignments, SLAs, provider portal queue). Phase A uses email + spreadsheet + manual status transitions.

**Deliverable produced:** All seasonal items cleaned, in storage, status = `stored`, post-cleaning condition documented.

**Checkpoints:**
- Pre-cleaning vs. post-cleaning condition comparison performed for every item. Any degradation flagged immediately to provider for resolution before storage.
- Lost or damaged items invoke a separate workflow (insurance, client notification, replacement or compensation) that needs to be defined per Open Item 4.

---

## Stage 10 — Storage placement

**Who:** Founder (WI storage) or Daughter (AZ storage).
**Where:** Climate-controlled storage facility on the relevant side (Brookfield/Milwaukee area — TBD per Section 13 Open Item 11; Scottsdale equivalent — to be identified).
**Duration:** Same-day with cleaning completion (Stage 9 completion).

**Process:**
1. Items received from provider, verified against packing slip
2. Items sleeved or boxed per category convention
3. Items physically placed in storage with location label
4. `items.location_label` updated to the specific storage location (OE-4 controlled-vocabulary recommended)
5. Status confirmed as `stored`

**System support required:**
- Controlled location vocabulary (OE-4 — Phase A)
- Admin item detail (OE-3 — Phase A)

**Deliverable produced:** Items physically placed and trackable by location.

**Checkpoints:**
- Storage layout convention documented (Cowork can produce a storage SOP in a follow-on document once founder confirms WI facility — currently Section 13 Open Item 11).

---

## Stage 11 — First seasonal corridor delivery

**Who:** Founder originates (WI), daughter receives (AZ), carrier in between.
**Where:** WI storage → carrier → AZ residence.
**Duration:** 3–7 days door to door.

The defining moment of the service. The client should arrive at their AZ residence and find their wardrobe waiting, pressed, organized, and ready.

**Process:**
1. Working backward from client arrival date (captured Stage 8), founder schedules the corridor shipment
2. Items selected for shipment: the seasonal rotation portion + any T3 items the client may want during the season
3. Items packed for transit (garment boxes, padding, labeled cartons)
4. Carrier engagement: insured shipping with tracking. For founding members, founder may drive the corridor personally on at least the first delivery as both a quality assurance measure and a relationship gesture
5. Status transitions: `stored` → `delivery_scheduled` (when packed) → `delivered` (when received at AZ residence by daughter; client not yet arrived)
6. Daughter performs receiving inspection and condition documentation at AZ end

**System support required:**
- Status transition controls (OE-3)
- Location vocabulary supporting "in transit" (OE-4)
- Phase B notifications would automate the client-facing status updates; Phase A uses founder-sent emails per the preferences captured in Stage 8

**Deliverable produced:** Wardrobe physically present at AZ residence, condition verified, ready for Stage 12.

**Checkpoints:**
- Daughter performs full receiving inspection: photo evidence of carton condition on arrival, photo evidence of contents matching manifest, condition record for any item that traveled poorly.
- Discrepancies between manifest and arrived items trigger immediate founder notification.

---

## Stage 12 — In-residence placement at destination

**Who:** Daughter (AZ residence) or Founder (WI residence on the spring return).
**Where:** Client's destination residence.
**Duration:** 2–4 hours.

The "white-glove" moment. Items are unpacked, pressed if needed (a portable steamer is standard kit), placed in the client's closets organized by category.

**Process:**
1. Daughter accesses residence per arranged building access
2. Items unpacked and inspected one final time
3. Touch-up pressing or steaming as needed
4. Closet organization per client's preferences (captured in `client_profiles.preferences`)
5. Photo documentation of the prepared closets for the founder's records and for the client's review
6. Final concierge note left for the client (handwritten card is a high-leverage detail)

**System support required:** None at the platform level for this stage; the platform's role is to have made the preceding 11 stages reliable enough that this stage feels like the natural conclusion.

**Deliverable produced:** Prepared closet, photo documentation, client greeting note.

**Checkpoints:**
- Pre-arrival walkthrough timing must beat client arrival by at least 24 hours so any final corrections can be made.

---

## Stage 13 — Post-delivery confirmation & feedback

**Who:** Founder.
**Where:** Phone or email.
**Duration:** 7 days post-arrival.

**Activities:**
1. Day 1 after client arrival: confirmation message — "Welcome to Scottsdale. Your wardrobe is in your closet. Reply to this message any time you need something."
2. Day 3: brief check-in — anything missing, anything out of place, anything not as expected
3. Day 7: structured feedback request — what worked, what didn't, what would make it better. Captured in `client_profiles.internal_notes` and aggregated for service improvement
4. Any issues raised invoke a service-recovery workflow (founder calls personally within 4 hours, resolution path defined per case)

**System support required:**
- Concierge messaging (CX-7 — Phase A)
- Admin client detail with notes (OE-2 — Phase A)

**Deliverable produced:** Documented client feedback for the first season delivery.

---

## Stage 14 — Steady-state relationship setup

**Who:** Founder.
**Where:** Ongoing.

After the first successful seasonal transition, the relationship transitions from "onboarding" to "steady-state":
- T3 (on-demand) requests can begin — client browses `/client/wardrobe` and uses the request flow (Phase B) to summon specific items
- Spring transition will reverse the corridor (AZ → WI) — Stages 8 through 13 repeat in the opposite direction with daughter originating and founder receiving
- Annual relationship review at end of pilot season (April 2027) to discuss continued enrollment, tier changes, referrals
- Founding member testimonial captured for marketing

**System support required:**
- T3 on-demand request flow (Phase B)
- Spring transition cycle (same Phase A foundation, run in reverse)

---

## Cross-cutting principles

These apply at every stage. Failure on any of them is a serious incident.

1. **Chain of custody is sacred.** Every item is either in client custody, in known LLV custody (with location), in known provider custody (with provider name and SKU), or in known transit. There is no "unknown." A lost item is a business-ending event with a founding member.
2. **Photographic evidence at every transition.** Intake, pre-cleaning, post-cleaning, pre-transit, post-transit, in-residence. The platform's `item_photos` table supports this; the operational discipline must match.
3. **Condition documentation at every touchpoint.** The `item_conditions` table tracks degradation over the service lifecycle. Disputes about damage are resolved by the documented record, not by memory.
4. **Concierge tone in every communication.** Founder and daughter set the standard. Internal notes can be operational; client-facing communication is warm, anticipatory, and brief.
5. **The technology is invisible to the client.** The platform exists to make the founder and daughter look effortless. The client sees beautiful photos and a calm experience, not a logistics dashboard.

---

## Open dependencies and acknowledgments

This SOP can be executed as-is for the first founding members with the following gaps still being resolved:

- **Pricing not finalized** (Section 13 Open Item 2) — Stages 2 and 3 reference pricing that is still TBD. Update this SOP when Chat resolves.
- **Insurance and liability structure** (Section 13 Open Item 4) — service agreement template in Stage 3 depends on this; chain-of-custody dispute resolution in Stage 9 depends on this.
- **Wisconsin providers** (Section 13 Open Item 1) — Stages 4, 9, 10 assume providers exist on both sides; only AZ is researched. Until WI providers are identified, intake at the WI residence may need to ship to AZ for cleaning, which complicates timing.
- **WI storage facility** (Section 13 Open Item 11) — Stage 10 assumes a known WI storage facility.
- **Daughter's formal role** (Section 13 Open Item 5) — many stages assume the daughter executes operational responsibilities; this should be formalized.
- **Founding member service agreement** (template not yet drafted) — Stage 3 references it; Cowork will draft once Open Item 4 resolves.

---

*End of client onboarding SOP. Cowork will revise as Chat resolves open items, as the founder iterates on the actual first-member experience, and as Code delivers each Phase A task referenced above.*
