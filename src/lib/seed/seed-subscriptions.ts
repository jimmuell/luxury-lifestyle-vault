import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

// 6 months ago, 6 months from now (relative to 2026-05-25)
const PERIOD_START = '2025-11-25T00:00:00Z'
const PERIOD_END   = '2026-11-25T00:00:00Z'

const SEED_SUBSCRIPTIONS = [
  {
    client_email: 'client1@test.llv.com',
    tier_name: 'Seasonal Premier',  // Margaret — 4 rotations, dedicated concierge
    stripe_subscription_id: 'sub_test_margaret001',
    stripe_customer_id: 'cus_test_margaret001',
    stripe_price_id: 'price_test_premier_monthly',
  },
  {
    client_email: 'client2@test.llv.com',
    tier_name: 'Seasonal Essentials',  // Catherine — 2 rotations per year
    stripe_subscription_id: 'sub_test_catherine002',
    stripe_customer_id: 'cus_test_catherine002',
    stripe_price_id: 'price_test_essentials_monthly',
  },
  {
    client_email: 'client3@test.llv.com',
    tier_name: 'Seasonal Essentials',  // James — 2 rotations per year
    stripe_subscription_id: 'sub_test_james003',
    stripe_customer_id: 'cus_test_james003',
    stripe_price_id: 'price_test_essentials_monthly',
  },
]

export async function seedSubscriptions(): Promise<SeedResult> {
  const adminClient = createAdminClient()
  let seeded = 0
  let skipped = 0
  const errors: string[] = []

  // Load service tiers to get real IDs by name
  const { data: tiers, error: tiersErr } = await adminClient
    .from('service_tiers')
    .select('id, name')

  if (tiersErr) return { seeded: 0, skipped: 0, errors: [`Failed to load service tiers: ${tiersErr.message}`] }
  if (!tiers?.length) return { seeded: 0, skipped: 0, errors: ['No service tiers found — run migrations first'] }

  const tierMap: Record<string, string> = {}
  for (const t of tiers) { tierMap[t.name] = t.id }

  for (const sub of SEED_SUBSCRIPTIONS) {
    try {
      // Resolve profile
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', sub.client_email)
        .maybeSingle()

      if (!profile) {
        errors.push(`${sub.client_email}: profile not found — run seed-clients first`)
        continue
      }

      const tierId = tierMap[sub.tier_name]
      if (!tierId) {
        errors.push(`${sub.client_email}: tier "${sub.tier_name}" not found in service_tiers`)
        continue
      }

      // Idempotency: check by stripe_subscription_id
      const { data: existingSub } = await adminClient
        .from('client_subscriptions')
        .select('id')
        .eq('stripe_subscription_id', sub.stripe_subscription_id)
        .maybeSingle()

      if (existingSub) {
        skipped++
      } else {
        const { error: subErr } = await adminClient.from('client_subscriptions').insert({
          client_id: profile.id,
          service_tier_id: tierId,
          stripe_subscription_id: sub.stripe_subscription_id,
          stripe_price_id: sub.stripe_price_id,
          status: 'active',
          current_period_start: PERIOD_START,
          current_period_end: PERIOD_END,
          cancel_at_period_end: false,
          founding_member_discount_applied: true,
          is_seed_data: true,
        })

        if (subErr) throw new Error(`client_subscriptions: ${subErr.message}`)
        seeded++
      }

      // Always ensure client_profile has correct stripe_customer_id, founding_member, subscription_active
      const { error: cpErr } = await adminClient
        .from('client_profiles')
        .update({
          stripe_customer_id: sub.stripe_customer_id,
          founding_member: true,
          subscription_active: true,
        })
        .eq('profile_id', profile.id)

      if (cpErr) errors.push(`${sub.client_email} client_profiles update: ${cpErr.message}`)

    } catch (err) {
      errors.push(`${sub.client_email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { seeded, skipped, errors }
}
