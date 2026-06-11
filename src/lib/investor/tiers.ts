export const TIER_RANK = { prospect: 1, investor: 2, board: 3 } as const

export type InvestorTier = keyof typeof TIER_RANK

/** Returns 0 for unknown/null tiers — safely fails closed on any guard check. */
export function tierRank(tier?: string | null): number {
  return TIER_RANK[tier as InvestorTier] ?? 0
}
