Business Strategy Assumptions Register

This document captures every business-strategy decision that affects platform development. For each item it records the working assumption the platform is built against and tracks the actual decision once validated. The platform is designed so that updating any assumption requires only configuration changes (admin panel or database), not code rewrites — code can keep building while business research happens in parallel.

## 1. Wisconsin Premium Garment-Care Providers

Working assumption: the platform supports multiple providers per corridor endpoint; the WI admin onboards 1–3 premium providers in the Brookfield/Milwaukee area. The system is provider-agnostic. Platform impact: none — provider management is fully built. Status (June 2026): desk research complete; shortlist Martinizing (lead), Klinke (secondary), The London Cleaners (specialist); outreach and qualification pending. Decision: OPEN — target sign 1 primary + 1 secondary ahead of the October 2026 launch. Timeline: June–July 2026.

## 2. Pricing & Service Packaging

Working assumption: Tier 1 (Seasonal Wardrobe Rotation) $299/month during active season; Tier 2 (Total Wardrobe Management) $599/month; Tier 3 (On-Demand) $75 base + $15/item, rush under 48 hours adds 50%; founding-member discount 20% off for 12 months. The deployed platform runs $299/$599 (treat as current). Platform impact: all pricing is stored in the service_tiers table and editable via the admin pricing panel; Stripe products/prices are created from the DB values. Decision: OPEN — requires competitive and provider-cost analysis and founding-member validation. Timeline: July 2026.

## 3. Provider Partnership Terms & Negotiation

Working assumption: LLV pays providers standard retail rates initially, negotiating volume discounts as the base grows; no revenue share at launch; providers are vendors, not partners, and the provider portal restricts client PII. Platform impact: provider portal already restricts PII; the dispatch system is provider-agnostic. Decision: OPEN — requires provider conversations on pricing, capacity, and exclusivity. Timeline: July–August 2026.

## 4. Insurance & Liability Structure

Working assumption: LLV carries general liability and bailee coverage; clients declare item values at intake; in-transit coverage via carrier insurance; maximum liability capped at ~$5,000 per item / ~$50,000 per client. Platform impact: item-value field and condition tracking exist; ToS acceptance is in onboarding; liability caps are configurable. Decision: OPEN — requires a commercial broker experienced in bailee coverage. See LLV Client Item Protection (folder 12). Timeline: July–August 2026.

## 5. AZ Corridor Manager's Formal Role

Working assumption: the AZ Corridor Manager (family operator) handles provider relationships, intake/delivery coordination, and quality control on the Arizona end; compensated via a flat monthly stipend during the pilot ($1,500–$2,500/month), equity deferred. Platform impact: role-based access supports multiple admins with regional assignment. Decision: OPEN — family conversation on employment vs. contractor, equity, title, and scope. Timeline: June 2026.

## 6. Capital Strategy

Working assumption: self-funded pilot with a $25K–$40K budget; no external investment needed for launch; if the pilot validates, an angel conversation happens from a position of strength. Platform impact: none — the stack was chosen for low pilot-stage costs. Decision: OPEN — decision point after pilot launch. Timeline: post-launch (after the April 2027 first full cycle).

## 7. Operational Choke Points

Working assumption: the pilot with 10–15 founding members IS the operational proof — success metrics are on-time delivery above 95%, zero damage incidents, satisfaction above 4.5/5, and positive unit economics; a later choke point will be identified from what the pilot reveals. Platform impact: reporting, the audit trail, and the admin dashboard provide the data. Decision: OPEN — revisit after the first full seasonal cycle (~April 2027). Timeline: post-launch.

## 8. Business Entity Formation

Working assumption: Wisconsin LLC as primary entity; register as a foreign LLC in Arizona; trademark "Luxury Lifestyle Vault" and the tagline, filed before launch to establish priority. Platform impact: none — the entity name appears in ToS and the legal footer (content, not code). Decision: OPEN — requires attorney consultation on formation state, multi-state registration, trademark filing, and the operating agreement. Timeline: June–July 2026.

## 9. Wisconsin Storage Facility

Working assumption: storage is initially handled by the garment-care providers; if insufficient, LLV leases a small climate-controlled unit in Brookfield ($150–$300/month) for overflow. The platform tracks item location regardless of arrangement. Platform impact: none — location tracking is built and arrangement-agnostic. Decision: OPEN — depends on WI provider capabilities. Timeline: July–August 2026.

## 10. Founding-Member Recruitment Strategy

Working assumption: target 10–15 founding members for the October 2026 launch via personal network, the AZ Corridor Manager's network, and wealth-management / estate-attorney / luxury-real-estate referrals; benefits are 20% off for 12 months, priority service, feature input, and locked-in pricing; no mass marketing. Platform impact: onboarding supports a founding-member flag and discount. Decision: OPEN — requires outreach materials, network mapping, and referral-partner identification. Timeline: August–September 2026.

## 11. Summary

| # | Topic | Status | Platform Risk | Target |
| --- | --- | --- | --- | --- |
| 1 | WI Providers | OPEN (shortlist ready) | None | Jun–Jul 2026 |
| 2 | Pricing & Packaging | OPEN (live: $299/$599) | None (configurable) | Jul 2026 |
| 3 | Provider Terms | OPEN | None | Jul–Aug 2026 |
| 4 | Insurance & Liability | OPEN | None (data captured) | Jul–Aug 2026 |
| 5 | AZ Corridor Manager Role | OPEN | None | Jun 2026 |
| 6 | Capital Strategy | OPEN (self-fund) | None | Post-launch |
| 7 | Operational Choke Points | OPEN | None | Post-launch |
| 8 | Business Entity | OPEN | None (content only) | Jun–Jul 2026 |
| 9 | WI Storage Facility | OPEN | None | Jul–Aug 2026 |
| 10 | Founding-Member Recruitment | OPEN | None (built) | Aug–Sep 2026 |

Key takeaway: every open item has zero platform risk. The technology is designed so that no business-strategy decision requires code changes — only configuration updates through the admin panel or database.
