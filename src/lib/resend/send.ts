import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL, FROM_NAME, isDevMode } from './client'

export type EmailTemplate =
  | 'order_confirmation'
  | 'order_status_changed'
  | 'payment_receipt'
  | 'payment_failed'
  | 'seasonal_rotation_reminder'
  | 'welcome'
  | 'provider_assignment'

type EmailPreferenceKey = 'order_updates' | 'delivery_notices' | 'payment' | 'seasonal_reminders'

const TEMPLATE_PREFERENCE_MAP: Record<EmailTemplate, EmailPreferenceKey | null> = {
  order_confirmation: 'order_updates',
  order_status_changed: 'order_updates',
  payment_receipt: null, // transactional — cannot be unsubscribed
  payment_failed: null,  // transactional
  seasonal_rotation_reminder: 'seasonal_reminders',
  welcome: null,
  provider_assignment: null,
}

export async function sendEmail({
  recipientProfileId,
  to,
  template,
  subject,
  html,
  text,
}: {
  recipientProfileId: string | null
  to: string
  template: EmailTemplate
  subject: string
  html: string
  text: string
}): Promise<void> {
  const supabase = createAdminClient()

  // Check notification preferences (skip for transactional emails)
  const prefKey = TEMPLATE_PREFERENCE_MAP[template]
  if (prefKey && recipientProfileId) {
    const { data: cp } = await supabase
      .from('client_profiles')
      .select('email_notifications')
      .eq('profile_id', recipientProfileId)
      .single()

    const prefs = (cp?.email_notifications as Record<string, boolean> | null) ?? {}
    if (prefs[prefKey] === false) return
  }

  // Create DB record
  const { data: sendRecord } = await supabase
    .from('email_sends')
    .insert({
      recipient_profile_id: recipientProfileId,
      template_name: template,
      subject,
      to_address: to,
      status: 'queued' as const,
    })
    .select('id')
    .single()

  const sendId = sendRecord?.id

  if (isDevMode) {
    // Dev mode — write to inbox table instead of sending
    await supabase.from('dev_email_inbox').insert({
      recipient: to,
      subject,
      html,
      text,
    })
    if (sendId) {
      await supabase
        .from('email_sends')
        .update({ status: 'sent' as const, sent_at: new Date().toISOString() })
        .eq('id', sendId)
    }
    return
  }

  try {
    const result = await getResend().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    })

    if (sendId) {
      await supabase
        .from('email_sends')
        .update({
          status: 'sent' as const,
          resend_id: result.data?.id ?? null,
          sent_at: new Date().toISOString(),
        })
        .eq('id', sendId)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    if (sendId) {
      await supabase
        .from('email_sends')
        .update({ status: 'failed' as const, error_message: errorMessage })
        .eq('id', sendId)
    }
    throw err
  }
}
