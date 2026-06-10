// Source of truth for investor financials UI.
// Figures extracted from the LLV Financial Model — "03 Financial Model & Projections" in Drive.
// All currency in whole USD. Billing mode: Split 6/12, Year-1 Scottsdale pilot.

export const FINANCIALS_META = {
  scenario: 'Split 6/12 (recommended billing basis)',
  pilotYear: 'Year 1 (Scottsdale pilot)',
  note: 'Year 1 ties to the live model. Years 2–3 are illustrative growth scenarios for direction only. Founder time is uncompensated in the pilot (sweat equity); the net gap is funded within the $25K–$40K pilot budget.',
} as const

export const PILOT_ASSUMPTIONS = [
  { label: 'Founding members', value: '12', note: 'Midpoint of the 10–15 target (4 Tier 1, 8 Tier 2)' },
  { label: 'Founding discount', value: '20%', note: 'First 12 months' },
  { label: 'Tier 3 requests / member', value: '3 / yr', note: '3 items per request' },
  { label: 'Avg wardrobe value / member', value: '$100,000', note: 'Drives insured-value estimate' },
  { label: 'Corridor', value: '1', note: 'WI ↔ AZ (Scottsdale)' },
] as const

export const PRICING = [
  { item: 'Tier 1 — Seasonal Wardrobe Rotation', standard: 299, founding: 239, unit: '/mo' },
  { item: 'Tier 2 — Total Wardrobe Management', standard: 599, founding: 479, unit: '/mo' },
  { item: 'Tier 3 — On-demand base fee', standard: 75, founding: 60, unit: '/request' },
  { item: 'Tier 3 — Per-item fee', standard: 15, founding: 12, unit: '/item' },
] as const

export const YEAR1_REVENUE = [
  { label: 'Tier 1 subscriptions', amount: 5741 },
  { label: 'Tier 2 subscriptions', amount: 46003 },
  { label: 'Tier 3 on-demand + referral', amount: 3956 },
] as const

export const YEAR1_COSTS = [
  { label: 'AZ operator stipend', amount: 24000 },
  { label: 'Cleaning / garment care (COGS)', amount: 13800 },
  { label: 'Transport / shipping', amount: 8280 },
  { label: 'Custody node leases (both ends)', amount: 6000 },
  { label: 'Bailee + general liability insurance', amount: 5000 },
  { label: 'Legal / entity formation (one-time)', amount: 3000 },
  { label: 'Payment processing', amount: 1671 },
  { label: 'Platform / SaaS', amount: 1500 },
] as const

export const BILLING_MODES = [
  { mode: 'Seasonal 6/6',     revenue: 32698, costs: 53360, net: -20662, recommended: false },
  { mode: 'Split 6/12',       revenue: 55700, costs: 63251, net: -7551,  recommended: true },
  { mode: 'Year-round 12/12', revenue: 61441, costs: 65720, net: -4279,  recommended: false },
] as const

export const PROJECTION_3YR = [
  { year: 'Year 1 (pilot)', members: 12,  corridors: 1, revenue: 55700,  insuredValue: 1200000 },
  { year: 'Year 2',         members: 40,  corridors: 2, revenue: 235000, insuredValue: 4000000 },
  { year: 'Year 3',         members: 100, corridors: 4, revenue: 612000, insuredValue: 10000000 },
] as const
