'use server'

import { createClient } from '@/lib/supabase/server'

export async function logCtaInteraction(ctaId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('investor_cta_interactions')
    .insert({ profile_id: user.id, cta_id: ctaId })

  if (error) return { error: `Failed to log interaction: ${error.message}` }

  return { success: true }
}
