'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function requireClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { user, supabase }
}

export async function updateEmailNotificationPrefs(prefs: Record<string, boolean>) {
  const { user, supabase } = await requireClient()
  const { error } = await supabase
    .from('client_profiles')
    .update({ email_notifications: prefs })
    .eq('profile_id', user.id)
  if (error) throw new Error(error.message)
}

export async function updateInAppNotificationPrefs(prefs: Record<string, boolean>) {
  const { user, supabase } = await requireClient()
  const { error } = await supabase
    .from('client_profiles')
    .update({ in_app_notification_prefs: prefs })
    .eq('profile_id', user.id)
  if (error) throw new Error(error.message)
}

export async function updateDefaultDeliveryAddress(addressId: string | null) {
  const { user, supabase } = await requireClient()

  // Verify the address belongs to this user
  if (addressId) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .eq('profile_id', user.id)
      .single()
    if (!addr) throw new Error('Address not found')
  }

  const { error } = await supabase
    .from('client_profiles')
    .update({ default_delivery_address_id: addressId })
    .eq('profile_id', user.id)
  if (error) throw new Error(error.message)
}

export async function updatePreferredChannel(channel: 'email' | 'sms' | 'both') {
  const { user, supabase } = await requireClient()
  const { error } = await supabase
    .from('client_profiles')
    .update({ preferred_channel: channel })
    .eq('profile_id', user.id)
  if (error) throw new Error(error.message)
}

export async function updateSmsConsent(
  enabled: boolean,
  source: 'onboarding' | 'settings'
): Promise<{ success: true } | { error: string }> {
  const { user, supabase } = await requireClient()
  const { error } = await supabase
    .from('client_profiles')
    .update({
      sms_consent: enabled,
      sms_consent_at: enabled ? new Date().toISOString() : null,
      sms_consent_source: enabled ? source : null,
    })
    .eq('profile_id', user.id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function softDeleteAccount() {
  const { user, supabase } = await requireClient()
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) throw new Error(error.message)
  await supabase.auth.signOut()
  redirect('/auth/login')
}
