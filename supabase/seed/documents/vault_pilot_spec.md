The LLV Vault — Pilot Enhancement Specification

## 1. Purpose & Strategic Rationale

This specification formalizes a capability that is already largely present in the LLV platform — the per-item record of condition, photos, location, and service history — into a deliberate, client-facing feature called the Vault, and adds a modest set of extensions agreed for the pilot.

One investment serves two goals at once. First, it gives founding members a best-in-class trust and transparency experience that no luxury-logistics competitor offers. Second, the accumulating, client-owned Vault dataset across the founding cohort becomes the single most defensible asset LLV owns — the thing a future acquirer cannot easily build. The companion Phase 3 document develops that acquisition narrative; this document keeps the pilot scope disciplined.

Critical framing: the moat is the documented, client-owned asset record plus trusted physical access — not authentication and not valuation. The pilot must avoid both (see Section 5), because they create undeliverable claims and real legal exposure for a small operation.

## 2. What Already Exists — Leverage, Don't Rebuild

Per the current platform state, most of the Vault's substance is already shipped. This spec is primarily assembly and presentation, not new architecture.

| Existing capability | How the Vault uses it |
| --- | --- |
| Condition history (intake, cleaning, returns) | Becomes the client-facing condition timeline for each item. |
| Photo archive + storage abstraction layer | Becomes the item's permanent visual record; supports document uploads with no new infrastructure. |
| item_location enum (WI/AZ corridor states) | Feeds the explicit, timestamped chain-of-custody log. |
| order_status_history (append-only) | Source for every handoff event in the custody log. |
| AI categorization (Haiku 4.5) | Already structures item metadata that the Vault record displays. |

## 3. The Vault Concept

The Vault is a permanent, client-owned, per-item record of everything LLV documents about each asset — condition over time, photographs, location and custody history, service history, and the client's own ownership records. The client owns the record; LLV maintains it. It is portable and exportable, so a member can take their complete documented wardrobe history with them at any time.

## 4. Pilot Scope — Three Layers

Layer 1 — Core (already built; reframe as client-facing): condition timeline, photo archive, chain-of-custody and location, and service history, all assembled from existing data.

Layer 2 — Light extensions (the agreed "go further" set): ownership and provenance document upload (receipts, purchase records, brand authenticity cards) — storage and display only; client-entered acquisition details (purchase date, retailer, original price), clearly labeled client-provided and never an LLV valuation; an explicit, timestamped chain-of-custody log; a consolidated Vault Record view per item; and an exportable record (PDF plus structured data) at item and full-wardrobe scope.

Layer 3 — Optional modest adds (founder's call): warranty and repair document storage; and a "client-supplied authentication on file" flag — storage and display of the client's own documents only, with no LLV authentication claim.

## 5. Guardrails — What the Vault Is NOT

These boundaries are non-negotiable for the pilot. LLV does not authenticate — it stores the client's own authenticity documents and makes no assertion of genuineness (authentication claims are the basis of the still-active Chanel v. The RealReal litigation). LLV does not appraise or assign value — it captures client-entered figures only, labeled client-provided, with no "portfolio value" or investment framing. No resale execution in the pilot — resale enablement is Phase 3. No public or marketplace exposure of client data — the Vault is private to the client and LLV operations.

## 6. Why the Vault Preempts the Resale Market's Top Trust Failures

LLV avoids the resale incumbents' recurring complaints because of its model — it manages a client's own wardrobe with no resale incentive — and the Vault makes that structural advantage visible and defensible.

| Recurring trust failure in luxury resale | How the client-owned Vault structurally avoids it |
| --- | --- |
| Consignor disputes over valuation and markdowns | The client owns the valuation inputs; LLV never sets a price or sells the item. |
| "You lost or mishandled my item" | Immutable, timestamped chain-of-custody plus condition photos at each handoff. |
| Condition-grading disputes | Documented, timestamped condition history owned by and visible to the client. |
| Authentication disputes | LLV stores the client's own documents and makes no authenticity claim — so it carries no claim-risk. |
| Poor transparency and communication | The client has continuous, self-serve visibility into their own complete record. |

## 7. Implementation Notes (Conceptual)

This is deliberately light; the architecture is mostly additive: a documents store for client uploads (the existing photo-storage abstraction already supports it); a small set of clearly-labeled client-entered item fields; a chain-of-custody view assembled from existing order_status_history and item_location; an export function (PDF plus structured data); and a consolidated Vault Record view composing the above. These are configuration and additive data structures, not rewrites.

## 8. Sequencing

Testing gates all production cutover and new build — that project rule stands. Finalize this spec now and let Cowork produce the Code task breakdown, but schedule the build to begin only after the current test plan's Critical and High items pass, or slot it as a small, self-contained increment with its own focused test pass. Do not interrupt the active QA cycle to add scope.

## 9. Acquisition Linkage

Across the founding cohort, the accumulating client-owned Vault — structured, documented, trusted, asset-level records tied to affluent owners — is precisely the asset an acquirer cannot source elsewhere. The pilot's job is to prove the model and produce this dataset cleanly. The companion Phase 3 Positioning document develops why that makes LLV worth acquiring, and to whom.
