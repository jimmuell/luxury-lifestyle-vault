import { inngest } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export const notifyProviderAssignment = inngest.createFunction(
  {
    id: 'notify-provider-assignment',
    triggers: [{ event: 'provider/assigned' as never }],
    retries: 3,
  },
  async ({ event }: { event: { data: { assignmentId: string; orderId: string; providerId: string } } }) => {
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

    return { notified: provider.profile_id }
  }
)
