'use server'

import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_EMAIL, FROM_NAME } from '@/lib/resend/client'
import { emailLayout, h1, para } from '@/lib/resend/emails/layout'

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
  return { supabase, user }
}

export async function sendTestEmail({
  to,
  subject = 'LLV Resend test',
}: {
  to: string
  subject?: string
}): Promise<{ success: true; id: string } | { error: string }> {
  const { supabase } = await requireAdmin()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: 'Invalid email address.' }
  }

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  })

  const html = emailLayout(
    h1('Test Email') +
    para(
      `This is a test email from the Luxury Lifestyle Vault admin dashboard, ` +
      `sent from <strong>${FROM_EMAIL}</strong> at ${timestamp}. ` +
      `If you received this, Resend is configured correctly.`
    )
  )

  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })

    if (result.error) {
      return { error: result.error.message }
    }

    const id = result.data?.id ?? 'unknown'

    await supabase.from('email_sends').insert({
      recipient_profile_id: null,
      template_name: 'admin_test',
      subject,
      to_address: to,
      status: 'sent',
      resend_id: id,
      sent_at: new Date().toISOString(),
    })

    return { success: true, id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase.from('email_sends').insert({
      recipient_profile_id: null,
      template_name: 'admin_test',
      subject,
      to_address: to,
      status: 'failed',
      error_message: msg,
    })
    return { error: msg }
  }
}
