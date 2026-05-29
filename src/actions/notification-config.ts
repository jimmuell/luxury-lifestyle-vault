'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
  return { user, adminClient: createAdminClient() }
}

export async function updateNotificationTemplateConfig(
  templateKey: string,
  updates: { email_enabled?: boolean; in_app_enabled?: boolean; sms_enabled?: boolean }
) {
  const { user, adminClient } = await requireAdmin()

  await adminClient
    .from('notification_template_config')
    .update({ ...updates, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('template_key', templateKey)

  revalidatePath('/admin/settings/notifications')
}

export async function sendAdminBroadcast(data: {
  subject: string
  body: string
  channel: 'email' | 'in_app' | 'both'
  target: 'all' | 'tier' | 'founding_members'
  targetTierId?: string | null
}) {
  const { user, adminClient } = await requireAdmin()

  // Resolve recipient list
  if (data.target === 'tier' && data.targetTierId) {
    const { data: subs } = await adminClient
      .from('client_subscriptions')
      .select('client_id')
      .eq('service_tier_id', data.targetTierId)
      .eq('status', 'active')
    const ids = subs?.map(s => s.client_id) ?? []
    if (!ids.length) throw new Error('No active clients on this tier')

    const { data: recipients } = await adminClient
      .from('profiles')
      .select('id')
      .in('id', ids)
    const recipientIds = recipients?.map(r => r.id) ?? []

    // Send in-app notifications
    if (data.channel === 'in_app' || data.channel === 'both') {
      for (const recipientId of recipientIds) {
        await createNotification({
          recipientProfileId: recipientId,
          type: 'system',
          title: data.subject,
          snippet: data.body.slice(0, 120),
          metadata: { broadcast: true } as unknown as Json,
        })
      }
    }

    await adminClient.from('admin_broadcasts').insert({
      subject: data.subject,
      body: data.body,
      channel: data.channel,
      target: data.target,
      target_tier_id: data.targetTierId,
      sent_by: user.id,
      recipient_count: recipientIds.length,
    })

    revalidatePath('/admin/settings/notifications')
    return { recipientCount: recipientIds.length }
  }

  // All clients or founding members
  let query = adminClient.from('profiles').select('id').eq('role', 'client')
  if (data.target === 'founding_members') {
    const { data: foundingCps } = await adminClient
      .from('client_profiles')
      .select('profile_id')
      .eq('founding_member', true)
    const ids = foundingCps?.map(cp => cp.profile_id) ?? []
    if (!ids.length) throw new Error('No founding members found')
    query = query.in('id', ids)
  }

  const { data: recipients } = await query
  const recipientIds = recipients?.map(r => r.id) ?? []

  if (data.channel === 'in_app' || data.channel === 'both') {
    for (const recipientId of recipientIds) {
      await createNotification({
        recipientProfileId: recipientId,
        type: 'system',
        title: data.subject,
        snippet: data.body.slice(0, 120),
        metadata: { broadcast: true } as unknown as Json,
      })
    }
  }

  await adminClient.from('admin_broadcasts').insert({
    subject: data.subject,
    body: data.body,
    channel: data.channel,
    target: data.target,
    sent_by: user.id,
    recipient_count: recipientIds.length,
  })

  revalidatePath('/admin/settings/notifications')
  return { recipientCount: recipientIds.length }
}
