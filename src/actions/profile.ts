'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { welcomeEmail } from '@/lib/resend/emails/welcome'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: (formData.get('full_name') as string) || null,
      phone: (formData.get('phone') as string) || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/client/profile')
  revalidatePath('/client')
  return { success: true }
}

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', user.id)
    .select('full_name')
    .single()

  if (error) return { error: error.message }

  // Fire async Stripe customer creation (idempotent — skips if already exists)
  await inngest.send({
    name: 'profile/created' as never,
    data: { profileId: user.id, email: user.email!, fullName: profile?.full_name ?? null },
  })

  // Welcome email — transactional, fires once at onboarding completion
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const clientName = profile?.full_name ?? user.email!
  const emailContent = welcomeEmail({ clientName, appUrl })
  await inngest.send({
    name: 'email/send' as never,
    data: {
      recipientProfileId: user.id,
      to: user.email!,
      template: 'welcome' as const,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    },
  })

  revalidatePath('/client')
  return { success: true }
}

export async function updatePreferredContact(method: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('client_profiles')
    .update({ preferred_contact_method: method })
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}
