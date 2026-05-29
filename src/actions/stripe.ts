'use server'

import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/server'

// Stripe SDK v22 wraps responses — cast helper
function asStripe<T>(val: unknown): T { return val as T }

export async function createSetupIntent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('stripe_customer_id')
    .eq('profile_id', user.id)
    .single()

  let stripeCustomerId = clientProfile?.stripe_customer_id ?? null

  // Self-healing fallback: if the Stripe customer hasn't been created yet
  // (Inngest function hasn't run, or this is a fresh signup that hasn't
  // completed onboarding), create it inline. Uses the same idempotency key
  // as the Inngest function so concurrent runs produce the same customer.
  if (!stripeCustomerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const customer = await stripe.customers.create(
      {
        email: user.email!,
        name: profile?.full_name ?? undefined,
        metadata: { profile_id: user.id },
      },
      { idempotencyKey: `profile_${user.id}` }
    )

    const adminClient = createAdminClient()
    const { error: upsertError } = await adminClient
      .from('client_profiles')
      .upsert(
        { profile_id: user.id, stripe_customer_id: customer.id },
        { onConflict: 'profile_id' }
      )
    if (upsertError) {
      console.error('createSetupIntent: client_profiles upsert failed:', upsertError.message)
    }

    stripeCustomerId = customer.id
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    metadata: { profile_id: user.id },
    automatic_payment_methods: { enabled: true },
  })

  return { clientSecret: setupIntent.client_secret }
}

export async function createSubscription(tierId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [clientProfileResult, tierResult] = await Promise.all([
    supabase
      .from('client_profiles')
      .select('stripe_customer_id, founding_member')
      .eq('profile_id', user.id)
      .single(),
    supabase
      .from('service_tiers')
      .select('stripe_price_id_current, founding_member_discount_pct')
      .eq('id', tierId)
      .eq('active', true)
      .single(),
  ])

  if (!clientProfileResult.data?.stripe_customer_id) {
    throw new Error('Stripe customer not found')
  }
  if (!tierResult.data?.stripe_price_id_current) {
    throw new Error('Service tier not synced to Stripe — contact support')
  }

  const { stripe_customer_id, founding_member } = clientProfileResult.data
  const { stripe_price_id_current, founding_member_discount_pct } = tierResult.data

  // Create or retrieve founding-member coupon
  let couponId: string | undefined
  if (founding_member && founding_member_discount_pct > 0) {
    const couponSlug = `founding_member_${founding_member_discount_pct}pct`
    try {
      await stripe.coupons.retrieve(couponSlug)
      couponId = couponSlug
    } catch {
      const coupon = await stripe.coupons.create({
        id: couponSlug,
        percent_off: founding_member_discount_pct,
        duration: 'repeating',
        duration_in_months: 12,
        name: 'Founding Member — 20% off for 12 months',
      })
      couponId = coupon.id
    }
  }

  const subscription = asStripe<Stripe.Subscription>(await stripe.subscriptions.create({
    customer: stripe_customer_id,
    items: [{ price: stripe_price_id_current }],
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    metadata: { profile_id: user.id, tier_id: tierId },
    payment_behavior: 'default_incomplete',
  }))

  const adminSupabase = createAdminClient()
  const { error: subInsertError } = await adminSupabase.from('client_subscriptions').insert({
    client_id: user.id,
    service_tier_id: tierId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: stripe_price_id_current,
    status: subscription.status,
    founding_member_discount_applied: !!couponId,
  })
  if (subInsertError) {
    // Non-blocking: subscription exists in Stripe; admin can reconcile
    console.error('createSubscription: client_subscriptions insert failed:', subInsertError.message)
  }

  return { subscriptionId: subscription.id, status: subscription.status }
}

export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership
  const { data: sub } = await supabase
    .from('client_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('client_id', user.id)
    .single()

  if (!sub) throw new Error('Subscription not found')

  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })

  await supabase
    .from('client_subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('stripe_subscription_id', subscriptionId)

  return { success: true }
}

export async function activateAndComplete(tierId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Create subscription
  const { subscriptionId } = await createSubscription(tierId)

  const adminSupabase = createAdminClient()
  const [cpResult, profileResult] = await Promise.all([
    adminSupabase.from('client_profiles').update({ subscription_active: true }).eq('profile_id', user.id),
    adminSupabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id),
  ])

  if (cpResult.error) {
    // Non-blocking: cosmetic flag; subscription state is authoritative in Stripe
    console.error('activateAndComplete: subscription_active update failed:', cpResult.error.message)
  }
  if (profileResult.error) {
    // Critical: middleware gates on this column — must succeed
    throw new Error(`Onboarding completion failed: ${profileResult.error.message}`)
  }

  return { subscriptionId }
}

// ── Admin subscription management ────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
  return { user, adminClient: createAdminClient() }
}

export async function adminSetSubscription(clientId: string, tierId: string) {
  const { adminClient } = await requireAdmin()

  const [cpResult, tierResult] = await Promise.all([
    adminClient.from('client_profiles').select('stripe_customer_id, founding_member').eq('profile_id', clientId).single(),
    adminClient.from('service_tiers').select('stripe_price_id_current, founding_member_discount_pct').eq('id', tierId).eq('active', true).single(),
  ])

  if (!cpResult.data?.stripe_customer_id) throw new Error('Client has no Stripe customer ID')
  if (!tierResult.data?.stripe_price_id_current) throw new Error('Tier not synced to Stripe')

  const { stripe_customer_id, founding_member } = cpResult.data
  const { stripe_price_id_current, founding_member_discount_pct } = tierResult.data

  let couponId: string | undefined
  if (founding_member && founding_member_discount_pct > 0) {
    const couponSlug = `founding_member_${founding_member_discount_pct}pct`
    try { await stripe.coupons.retrieve(couponSlug); couponId = couponSlug }
    catch {
      const coupon = await stripe.coupons.create({
        id: couponSlug, percent_off: founding_member_discount_pct,
        duration: 'repeating', duration_in_months: 12,
        name: 'Founding Member — 20% off for 12 months',
      })
      couponId = coupon.id
    }
  }

  const subscription = asStripe<Stripe.Subscription>(await stripe.subscriptions.create({
    customer: stripe_customer_id,
    items: [{ price: stripe_price_id_current }],
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    metadata: { profile_id: clientId, tier_id: tierId },
  }))

  await adminClient.from('client_subscriptions').insert({
    client_id: clientId,
    service_tier_id: tierId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: stripe_price_id_current,
    status: subscription.status,
    founding_member_discount_applied: !!couponId,
  })

  await adminClient.from('client_profiles').update({ subscription_active: true }).eq('profile_id', clientId)

  return { subscriptionId: subscription.id }
}

export async function adminChangeTier(subscriptionId: string, newTierId: string) {
  const { adminClient } = await requireAdmin()

  const { data: tier } = await adminClient
    .from('service_tiers')
    .select('stripe_price_id_current')
    .eq('id', newTierId)
    .eq('active', true)
    .single()

  if (!tier?.stripe_price_id_current) throw new Error('New tier not synced to Stripe')

  const stripeSubscription = asStripe<Stripe.Subscription>(await stripe.subscriptions.retrieve(subscriptionId))
  const itemId = stripeSubscription.items.data[0]?.id
  if (!itemId) throw new Error('No subscription item found')

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: tier.stripe_price_id_current }],
    proration_behavior: 'create_prorations',
  })

  await adminClient.from('client_subscriptions').update({
    service_tier_id: newTierId,
    stripe_price_id: tier.stripe_price_id_current,
  }).eq('stripe_subscription_id', subscriptionId)

  return { success: true }
}

export async function adminCancelSubscription(subscriptionId: string, immediately = false) {
  const { adminClient } = await requireAdmin()

  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId)
    await adminClient.from('client_subscriptions').update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    }).eq('stripe_subscription_id', subscriptionId)

    // Mark client as no longer having active subscription
    const { data: sub } = await adminClient
      .from('client_subscriptions')
      .select('client_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()
    if (sub) {
      await adminClient.from('client_profiles').update({ subscription_active: false }).eq('profile_id', sub.client_id)
    }
  } else {
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    await adminClient.from('client_subscriptions').update({ cancel_at_period_end: true }).eq('stripe_subscription_id', subscriptionId)
  }

  return { success: true }
}
