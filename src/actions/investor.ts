'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NDA_VERSION } from '@/lib/legal/investor-nda'

export async function acknowledgeNda(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''
  const agreed = formData.get('agreed') === 'on'

  if (!fullName) return { error: 'Please type your full name to acknowledge.' }
  if (!agreed) return { error: 'You must check the box to continue.' }

  // Capture request metadata
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? null
  const userAgent = headersList.get('user-agent') ?? null

  // 1. Insert acknowledgment log (ignore unique-violation = already acknowledged)
  const { error: insertErr } = await supabase
    .from('investor_nda_acknowledgments')
    .insert({
      profile_id: user.id,
      nda_version: NDA_VERSION,
      full_name: fullName,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

  if (insertErr && insertErr.code !== '23505') {
    return { error: 'Could not record your acknowledgment. Please try again.' }
  }

  // 2. Flip the gate flag — use admin client to bypass RLS self-update restrictions
  const admin = createAdminClient()
  const { error: updateErr } = await admin
    .from('profiles')
    .update({ nda_acknowledged: true })
    .eq('id', user.id)

  if (updateErr) {
    return { error: 'Could not update your access record. Please try again.' }
  }

  revalidatePath('/investor', 'layout')
  redirect('/investor')
}
