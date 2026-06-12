'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin(): Promise<{ error: string } | { error?: never }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Forbidden' }
  return {}
}

export async function updateWelcomeConfig(formData: FormData) {
  const auth = await assertAdmin()
  if (auth.error) return { error: auth.error }

  const welcomeHeading = (formData.get('welcome_heading') as string | null)?.trim() ?? ''
  const welcomeBody = (formData.get('welcome_body') as string | null)?.trim() ?? ''

  if (!welcomeHeading) return { error: 'Heading is required.' }
  if (!welcomeBody) return { error: 'Body is required.' }

  const admin = createAdminClient()

  const { data: existing, error: fetchError } = await admin
    .from('investor_config')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (fetchError) return { error: `Failed to read config: ${fetchError.message}` }

  if (existing) {
    const { error } = await admin
      .from('investor_config')
      .update({ welcome_heading: welcomeHeading, welcome_body: welcomeBody })
      .eq('id', existing.id)

    if (error) return { error: `Failed to update config: ${error.message}` }
  } else {
    const { error } = await admin
      .from('investor_config')
      .insert({ welcome_heading: welcomeHeading, welcome_body: welcomeBody })

    if (error) return { error: `Failed to create config: ${error.message}` }
  }

  revalidatePath('/investor')
  revalidatePath('/admin/investor-config')
  return { success: true }
}
