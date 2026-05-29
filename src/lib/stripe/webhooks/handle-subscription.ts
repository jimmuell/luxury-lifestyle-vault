import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const supabase = createAdminClient()

  const stripeCustomerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  // Find the client_profile by Stripe customer ID
  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('id, profile_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (!clientProfile) return

  const priceId = subscription.items.data[0]?.price?.id ?? ''

  // Find matching service tier
  const { data: tier } = await supabase
    .from('service_tiers')
    .select('id')
    .eq('stripe_price_id_current', priceId)
    .single()

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'

  if (event.type === 'customer.subscription.deleted') {
    await supabase
      .from('client_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    await supabase
      .from('client_profiles')
      .update({ subscription_active: false })
      .eq('id', clientProfile.id)

    return
  }

  // Upsert the subscription row
  const existing = await supabase
    .from('client_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existing.data) {
    await supabase
      .from('client_subscriptions')
      .update({
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      })
      .eq('stripe_subscription_id', subscription.id)
  } else if (tier) {
    await supabase.from('client_subscriptions').insert({
      client_id: clientProfile.profile_id,
      service_tier_id: tier.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
  }

  await supabase
    .from('client_profiles')
    .update({ subscription_active: isActive })
    .eq('id', clientProfile.id)
}
