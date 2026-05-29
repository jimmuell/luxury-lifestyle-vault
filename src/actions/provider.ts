'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'
import type { Database } from '@/types/database'

type ProviderServiceStage = Database['public']['Enums']['provider_service_stage']

async function getProviderUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!provider) throw new Error('Provider not found')
  return { supabase, adminClient: createAdminClient(), user, providerId: provider.id }
}

export async function acceptAssignment(assignmentId: string) {
  const { supabase, providerId } = await getProviderUser()

  const { data: assignment } = await supabase
    .from('provider_order_assignments')
    .select('id, order_id, provider_response')
    .eq('id', assignmentId)
    .eq('provider_id', providerId)
    .single()

  if (!assignment) throw new Error('Assignment not found')
  if (assignment.provider_response !== 'pending') throw new Error('Assignment already responded to')

  const adminClient = createAdminClient()
  await adminClient
    .from('provider_order_assignments')
    .update({ provider_response: 'accepted' })
    .eq('id', assignmentId)

  revalidatePath('/provider')
  revalidatePath(`/provider/orders/${assignment.order_id}`)
  return { success: true }
}

export async function declineAssignment(assignmentId: string, reason: string) {
  const { supabase, providerId } = await getProviderUser()

  const { data: assignment } = await supabase
    .from('provider_order_assignments')
    .select('id, order_id, provider_response')
    .eq('id', assignmentId)
    .eq('provider_id', providerId)
    .single()

  if (!assignment) throw new Error('Assignment not found')
  if (assignment.provider_response !== 'pending') throw new Error('Assignment already responded to')

  const adminClient = createAdminClient()

  // Decline the assignment
  await adminClient
    .from('provider_order_assignments')
    .update({ provider_response: 'declined', decline_reason: reason })
    .eq('id', assignmentId)

  // Move order back to confirmed
  await adminClient
    .from('orders')
    .update({ status: 'confirmed', provider_id: null })
    .eq('id', assignment.order_id)
    .eq('status', 'dispatched_to_provider')

  await adminClient.from('order_status_history').insert({
    order_id: assignment.order_id,
    status: 'confirmed',
    notes: `Provider declined: ${reason}`,
  })

  // Notify admin
  const { data: adminProfiles } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  for (const adminProfile of adminProfiles ?? []) {
    await createNotification({
      recipientProfileId: adminProfile.id,
      type: 'provider_assignment_declined',
      title: 'Provider declined an assignment',
      snippet: reason,
      linkTarget: `/admin/orders/${assignment.order_id}`,
      metadata: { orderId: assignment.order_id, assignmentId } as Record<string, string>,
    })
  }

  revalidatePath('/provider')
  revalidatePath(`/provider/orders/${assignment.order_id}`)
  return { success: true }
}

export async function updateItemServiceStage(
  orderItemId: string,
  orderId: string,
  stage: ProviderServiceStage,
  providerNotes?: string,
  damageFlagged?: boolean
) {
  const { supabase, providerId, adminClient } = await getProviderUser()

  // Verify this provider is assigned to this order
  const { data: assignment } = await supabase
    .from('provider_order_assignments')
    .select('id, provider_response')
    .eq('order_id', orderId)
    .eq('provider_id', providerId)
    .single()

  if (!assignment || assignment.provider_response !== 'accepted') {
    throw new Error('Not authorized to update this order')
  }

  await adminClient
    .from('order_items')
    .update({
      provider_service_stage: stage,
      provider_notes: providerNotes ?? null,
      damage_flagged: damageFlagged ?? false,
    })
    .eq('id', orderItemId)

  // Check if all items have reached 'received' → transition order to in_preparation
  if (stage === 'received') {
    const { data: allItems } = await adminClient
      .from('order_items')
      .select('provider_service_stage')
      .eq('order_id', orderId)

    const allReceived = allItems?.every(item => item.provider_service_stage != null)
    if (allReceived) {
      const { data: order } = await adminClient
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      if (order?.status === 'dispatched_to_provider') {
        await adminClient
          .from('orders')
          .update({ status: 'in_preparation' })
          .eq('id', orderId)

        await adminClient.from('order_status_history').insert({
          order_id: orderId,
          status: 'in_preparation',
          notes: 'All items received by provider.',
        })
      }
    }
  }

  // Damage flag → notify admin
  if (damageFlagged) {
    const { data: adminProfiles } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    for (const adminProfile of adminProfiles ?? []) {
      await createNotification({
        recipientProfileId: adminProfile.id,
        type: 'system',
        title: 'Damage flagged by provider',
        snippet: providerNotes ?? 'Provider noted potential damage on an item.',
        linkTarget: `/admin/orders/${orderId}`,
        metadata: { orderId, orderItemId } as Record<string, string>,
      })
    }
  }

  revalidatePath(`/provider/orders/${orderId}`)
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}
