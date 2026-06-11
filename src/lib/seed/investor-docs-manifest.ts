export interface InvestorDocEntry {
  /** Matches storage_path in investor_documents: "${section}/${file}" */
  storagePath: string
  docType: 'document' | 'presentation'
  audience: 'board' | 'prospect'
}

/** Mirrors supabase/seed/investor-room/manifest.json — keep in sync when docs change. */
export const INVESTOR_DOCS_MANIFEST: InvestorDocEntry[] = [
  { storagePath: 'concept/exec_one_pager.pdf',                     docType: 'document',     audience: 'board' },
  { storagePath: 'concept/brochure.pdf',                            docType: 'document',     audience: 'board' },
  { storagePath: 'concept/concept_packet.pdf',                      docType: 'document',     audience: 'board' },
  { storagePath: 'concept/vision_and_strategy.pdf',                 docType: 'document',     audience: 'board' },
  { storagePath: 'strategy/phase_3_positioning.pdf',                docType: 'document',     audience: 'board' },
  { storagePath: 'strategy/assumptions_register.pdf',               docType: 'document',     audience: 'board' },
  { storagePath: 'strategy/trust_liability_guardrails.pdf',         docType: 'document',     audience: 'board' },
  { storagePath: 'market/realreal_partnership.pdf',                 docType: 'document',     audience: 'board' },
  { storagePath: 'market/trr_research_notes.pdf',                   docType: 'document',     audience: 'board' },
  { storagePath: 'market/competitive_lessons_realreal.pdf',         docType: 'document',     audience: 'board' },
  { storagePath: 'market/realreal_press_release.pdf',               docType: 'document',     audience: 'board' },
  { storagePath: 'market/realreal_10k_2025.pdf',                    docType: 'document',     audience: 'board' },
  { storagePath: 'financials/integrated_strategic_trust_analysis.pdf', docType: 'document',  audience: 'board' },
  { storagePath: 'product/technology_and_platform.pdf',             docType: 'document',     audience: 'board' },
  { storagePath: 'product/vault_pilot_spec.pdf',                    docType: 'document',     audience: 'board' },
  { storagePath: 'operations/operations_and_logistics.pdf',         docType: 'document',     audience: 'board' },
  { storagePath: 'operations/client_onboarding_sop.pdf',            docType: 'document',     audience: 'board' },
  { storagePath: 'operations/inventory_intake_strategy.pdf',        docType: 'document',     audience: 'board' },
  { storagePath: 'operations/wardrobe_concierge_blueprint.pdf',     docType: 'document',     audience: 'board' },
  { storagePath: 'launch/launch_implementation_plan.pdf',           docType: 'document',     audience: 'board' },
  { storagePath: 'launch/launch_gates_action_plan.pdf',             docType: 'document',     audience: 'board' },
  { storagePath: 'legal/client_item_protection.pdf',                docType: 'document',     audience: 'board' },
  { storagePath: 'deck/pitch_deck.pdf',                             docType: 'presentation', audience: 'prospect' },
]
