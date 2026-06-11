'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/server'

type TierPricingFields = {
  monthly_price_cents?: number | null
  per_request_base_cents?: number | null
  per_item_surcharge_cents?: number
  rush_premium_pct?: number
  min_lead_time_hours?: number
  rush_lead_time_hours?: number
  founding_member_discount_pct?: number
}

import type { Json } from '@/types/database'

type TierConfigFields = {
  name?: string
  description?: string | null
  tier_type?: string
  billing_cycle?: string
  included_services?: string[]
  addon_options?: Json
  founding_member_eligible?: boolean
  tier3_billing_mode?: string
  active?: boolean
  sort_order?: number
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return { supabase, adminClient: createAdminClient(), actorId: user.id }
}

export async function syncTierToStripe(tierId: string) {
  const { supabase, adminClient, actorId } = await requireAdmin()

  const { data: tier } = await supabase
    .from('service_tiers')
    .select('*')
    .eq('id', tierId)
    .single()

  if (!tier) throw new Error('Tier not found')
  if (!['subscription'].includes(tier.tier_type)) return { skipped: true }

  // Create or update Stripe Product
  let productId = tier.stripe_product_id
  if (!productId) {
    const product = await getStripe().products.create({
      name: tier.name,
      description: tier.description ?? undefined,
      metadata: { tier_id: tierId },
    })
    productId = product.id
    await adminClient
      .from('service_tiers')
      .update({ stripe_product_id: productId })
      .eq('id', tierId)
  } else {
    await getStripe().products.update(productId, {
      name: tier.name,
      description: tier.description ?? undefined,
    })
  }

  // Create a new Stripe Price (prices are immutable)
  const priceAmountCents = tier.monthly_price_cents ?? 0
  if (priceAmountCents === 0) return { productId, skipped: true }

  const price = await getStripe().prices.create({
    product: productId,
    currency: 'usd',
    unit_amount: priceAmountCents,
    recurring: { interval: 'month' },
    metadata: { tier_id: tierId },
  })

  // Log the price sync
  await adminClient.from('pricing_change_log').insert({
    service_tier_id: tierId,
    actor_profile_id: actorId,
    field: 'stripe_price_id_current',
    before_value: tier.stripe_price_id_current,
    after_value: price.id,
  })

  await adminClient
    .from('service_tiers')
    .update({ stripe_price_id_current: price.id })
    .eq('id', tierId)

  revalidatePath('/admin/settings/tiers')
  return { productId, priceId: price.id }
}

export async function updateTierPricing(tierId: string, fields: TierPricingFields) {
  const { supabase, adminClient, actorId } = await requireAdmin()

  const { data: existing } = await supabase
    .from('service_tiers')
    .select('*')
    .eq('id', tierId)
    .single()

  if (!existing) throw new Error('Tier not found')

  // Write audit log entries for changed price fields
  const auditEntries = []
  for (const [field, value] of Object.entries(fields)) {
    const before = String((existing as Record<string, unknown>)[field] ?? '')
    const after = String(value ?? '')
    if (before !== after) {
      auditEntries.push({
        service_tier_id: tierId,
        actor_profile_id: actorId,
        field,
        before_value: before || null,
        after_value: after || null,
      })
    }
  }

  if (auditEntries.length > 0) {
    await adminClient.from('pricing_change_log').insert(auditEntries)
  }

  await adminClient.from('service_tiers').update(fields).eq('id', tierId)

  // Re-sync to Stripe if monthly price changed for subscription tiers
  if ('monthly_price_cents' in fields && existing.tier_type === 'subscription') {
    await syncTierToStripe(tierId)
  }

  revalidatePath('/admin/settings/tiers')
  revalidatePath(`/admin/settings/tiers/${tierId}`)
  return { success: true }
}

export async function updateTierConfig(tierId: string, config: TierConfigFields) {
  const { adminClient } = await requireAdmin()

  await adminClient.from('service_tiers').update(config).eq('id', tierId)

  // If name/description changed and Stripe product exists, sync product
  const needsStripeSync = 'name' in config || 'description' in config
  if (needsStripeSync) {
    const { data: tier } = await adminClient
      .from('service_tiers')
      .select('stripe_product_id, tier_type')
      .eq('id', tierId)
      .single()

    if (tier?.stripe_product_id && tier.tier_type === 'subscription') {
      await getStripe().products.update(tier.stripe_product_id, {
        name: config.name,
        description: config.description ?? undefined,
      })
    }
  }

  revalidatePath('/admin/settings/tiers')
  revalidatePath(`/admin/settings/tiers/${tierId}`)
  return { success: true }
}

export async function createTier() {
  const { adminClient } = await requireAdmin()

  const { data: tier, error } = await adminClient
    .from('service_tiers')
    .insert({
      name: 'New Tier',
      tier_type: 'subscription',
      billing_cycle: 'monthly',
      active: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin/settings/tiers')
  return { tierId: tier.id }
}

export async function deactivateTier(tierId: string) {
  const { adminClient } = await requireAdmin()

  await adminClient
    .from('service_tiers')
    .update({ active: false })
    .eq('id', tierId)

  revalidatePath('/admin/settings/tiers')
  return { success: true }
}
