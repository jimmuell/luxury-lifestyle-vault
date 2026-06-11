import { inngest } from '@/lib/inngest/client'
import { getStripe } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

export const createStripeCustomer = inngest.createFunction(
  {
    id: 'create-stripe-customer',
    triggers: [{ event: 'profile/created' as never }],
    retries: 3,
  },
  async ({ event, step }: { event: { data: { profileId: string; email: string; fullName: string | null } }; step: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> } }) => {
    return withSentryCapture(async () => {
      const { profileId, email, fullName } = event.data

      const supabase = createAdminClient()

      // Idempotency — skip if customer already exists
      const existingCustomerId = await step.run('check-existing', async () => {
        const { data } = await supabase
          .from('client_profiles')
          .select('stripe_customer_id')
          .eq('profile_id', profileId)
          .single()
        return data?.stripe_customer_id ?? null
      })

      if (existingCustomerId) return { customerId: existingCustomerId, skipped: true }

      const customerId = await step.run('create-stripe-customer', async () => {
        const customer = await getStripe().customers.create(
          { email, name: fullName ?? undefined, metadata: { profile_id: profileId } },
          { idempotencyKey: `profile_${profileId}` }
        )
        return customer.id
      })

      await step.run('save-customer-id', async () => {
        await supabase
          .from('client_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('profile_id', profileId)
      })

      return { customerId }
    }, 'create-stripe-customer')
  }
)
