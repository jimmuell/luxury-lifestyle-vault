import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { providerAssignmentEmail } from '@/lib/resend/emails/provider-assignment'
import { withSentryCapture } from '@/lib/inngest/with-sentry'

export const notifyProviderAssignment = inngest.createFunction(
  {
    id: 'notify-provider-assignment',
    triggers: [{ event: 'provider/assigned' as never }],
    retries: 3,
  },
  async ({ event }: { event: { data: { assignmentId: string; orderId: string; providerId: string } } }) => {
    return withSentryCapture(async () => {
      const { assignmentId, orderId, providerId } = event.data

      const adminClient = createAdminClient()

      // Get provider profile_id for in-app notification
      const { data: provider } = await adminClient
        .from('providers')
        .select('profile_id, business_name')
        .eq('id', providerId)
        .single()

      if (!provider?.profile_id) return { skipped: 'no provider profile' }

      await createNotification({
        recipientProfileId: provider.profile_id,
        type: 'system',
        title: 'New assignment waiting for your response',
        snippet: 'A new order has been assigned to you. Please review and accept or decline.',
        linkTarget: `/provider/orders/${orderId}`,
        metadata: { orderId, assignmentId } as Record<string, string>,
      })

      // Send email to the provider
      const { data: profile } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', provider.profile_id)
        .single()

      if (profile?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
        const providerName = profile.full_name ?? provider.business_name ?? profile.email
        const emailContent = providerAssignmentEmail({ providerName, orderId, appUrl })
        await inngest.send({
          name: 'email/send' as never,
          data: {
            recipientProfileId: provider.profile_id,
            to: profile.email,
            template: 'provider_assignment' as const,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
          },
        })
      }

      return { notified: provider.profile_id }
    }, 'notify-provider-assignment')
  }
)
