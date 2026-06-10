'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function inviteInvestor(formData: FormData) {
  await assertAdmin()

  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''

  if (!email) return { error: 'Email is required.' }
  if (!fullName) return { error: 'Full name is required.' }

  const admin = createAdminClient()

  // Create the auth user (email confirmed so they can log in immediately)
  // Using createUser with a secure random temp password; return it to the admin
  // so they can relay it to the investor out-of-band.
  const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  const { data: authData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'investor' },
  })

  if (createErr) return { error: createErr.message }
  if (!authData.user) return { error: 'User creation returned no user.' }

  // The new-user trigger (005_triggers_functions.sql) creates a profiles row
  // defaulting role to 'client'. Explicitly set it to 'investor'.
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role: 'investor', full_name: fullName, nda_acknowledged: false })
    .eq('id', authData.user.id)

  if (profileErr) return { error: `Created user but failed to set investor role: ${profileErr.message}` }

  revalidatePath('/admin/investors')
  return { success: true, email, tempPassword }
}

export async function promoteToInvestor(formData: FormData) {
  await assertAdmin()

  const profileId = formData.get('profile_id') as string | null
  if (!profileId) return { error: 'Profile ID is required.' }

  const admin = createAdminClient()

  // Guard: never change an existing admin's role
  const { data: existing } = await admin
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .single()

  if (existing?.role === 'admin') {
    return { error: 'Cannot change the role of an admin account.' }
  }

  const { error } = await admin
    .from('profiles')
    .update({ role: 'investor', nda_acknowledged: false })
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin/investors')
  return { success: true }
}
