'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createAddress(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('addresses').insert({
    profile_id: user.id,
    label: (formData.get('label') as string) || 'Home',
    line1: formData.get('line1') as string,
    line2: (formData.get('line2') as string) || null,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    postal_code: formData.get('postal_code') as string,
    country: (formData.get('country') as string) || 'US',
    delivery_instructions: (formData.get('delivery_instructions') as string) || null,
    is_primary: formData.get('is_primary') === 'true',
  })

  if (error) return { error: error.message }
  revalidatePath('/client/addresses')
  return { success: true }
}

export async function updateAddress(addressId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('addresses')
    .update({
      label: (formData.get('label') as string) || 'Home',
      line1: formData.get('line1') as string,
      line2: (formData.get('line2') as string) || null,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postal_code: formData.get('postal_code') as string,
      country: (formData.get('country') as string) || 'US',
      delivery_instructions: (formData.get('delivery_instructions') as string) || null,
    })
    .eq('id', addressId)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/client/addresses')
  return { success: true }
}

export async function deleteAddress(addressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/client/addresses')
  return { success: true }
}

export async function setPrimaryAddress(addressId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Clear existing primary then set new one
  await supabase
    .from('addresses')
    .update({ is_primary: false })
    .eq('profile_id', user.id)

  const { error } = await supabase
    .from('addresses')
    .update({ is_primary: true })
    .eq('id', addressId)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/client/addresses')
  return { success: true }
}
