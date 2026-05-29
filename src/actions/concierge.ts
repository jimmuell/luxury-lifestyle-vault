'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function sendConciergeMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const subject = (formData.get('subject') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()

  if (!subject || !body) return { error: 'Subject and message are required.' }

  const { error } = await supabase.from('concierge_messages').insert({
    client_id: user.id,
    subject,
    body,
  })

  if (error) return { error: error.message }

  revalidatePath('/client/concierge')
  return { success: true }
}

export async function adminUpdateMessageStatus(
  messageId: string,
  status: 'open' | 'in_progress' | 'resolved',
  adminNotes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')

  const { error } = await supabase
    .from('concierge_messages')
    .update({ status, admin_notes: adminNotes ?? null })
    .eq('id', messageId)

  if (error) return { error: error.message }

  revalidatePath('/admin/concierge')
  return { success: true }
}

export async function providerSendMessage(opts: {
  orderId: string
  subject: string
  body: string
  isDamageReport?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'provider') throw new Error('Forbidden')

  // Verify provider is assigned to this order
  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  if (!provider) throw new Error('Provider record not found')

  const { data: assignment } = await supabase
    .from('provider_order_assignments')
    .select('id')
    .eq('order_id', opts.orderId)
    .eq('provider_id', provider.id)
    .single()
  if (!assignment) throw new Error('Not assigned to this order')

  // Resolve client_id from order for the message record
  const db = createAdminClient()
  const { data: order } = await db
    .from('orders')
    .select('client_id')
    .eq('id', opts.orderId)
    .single()
  if (!order) throw new Error('Order not found')

  const subject = opts.isDamageReport
    ? `[Damage Report] ${opts.subject}`
    : opts.subject

  const { data: inserted, error } = await db
    .from('concierge_messages')
    .insert({
      client_id: order.client_id,
      author_profile_id: user.id,
      related_order_id: opts.orderId,
      subject,
      body: opts.body,
      status: 'open',
      is_provider_message: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Set thread_id = own id (top-level message)
  await db
    .from('concierge_messages')
    .update({ thread_id: inserted.id })
    .eq('id', inserted.id)

  revalidatePath(`/provider/orders/${opts.orderId}`)
  revalidatePath('/admin/concierge')
  return { success: true }
}
