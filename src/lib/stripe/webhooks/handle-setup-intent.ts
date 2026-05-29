import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/server'

export async function handleSetupIntentSucceeded(event: Stripe.Event) {
  const setupIntent = event.data.object as Stripe.SetupIntent
  const supabase = createAdminClient()

  if (!setupIntent.customer || !setupIntent.payment_method) return

  const customerId = typeof setupIntent.customer === 'string'
    ? setupIntent.customer
    : setupIntent.customer.id

  const paymentMethodId = typeof setupIntent.payment_method === 'string'
    ? setupIntent.payment_method
    : setupIntent.payment_method.id

  // Set this as the default payment method on the Stripe customer
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  // Mark onboarding-related flags if this was triggered during onboarding
  if (setupIntent.metadata?.profile_id) {
    await supabase
      .from('client_profiles')
      .update({ onboarding_complete: true } as never)
      .eq('profile_id', setupIntent.metadata.profile_id)
  }
}
