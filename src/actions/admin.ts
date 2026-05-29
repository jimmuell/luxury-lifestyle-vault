'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function updateClientNotes(clientId: string, notes: string) {
  const supabase = await verifyAdmin()

  const { error } = await supabase
    .from('client_profiles')
    .update({ internal_notes: notes || null })
    .eq('profile_id', clientId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/clients/${clientId}`)
  return { success: true }
}

export async function adminAddCondition({
  itemId,
  conditionLevel,
  notes,
}: {
  itemId: string
  conditionLevel: string
  notes?: string
}) {
  const supabase = await verifyAdmin()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('item_conditions').insert({
    item_id: itemId,
    assessed_by: user!.id,
    condition_level: conditionLevel as never,
    notes: notes || null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/admin/inventory/${itemId}`)
  return { success: true }
}

export async function createProvider(formData: FormData) {
  const supabase = await verifyAdmin()

  const services = formData.getAll('services') as string[]

  const { error } = await supabase.from('providers').insert({
    business_name: formData.get('business_name') as string,
    contact_name: formData.get('contact_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address_line1: (formData.get('address_line1') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    postal_code: (formData.get('postal_code') as string) || null,
    services: services as never,
    capacity_per_week: formData.get('capacity_per_week') ? Number(formData.get('capacity_per_week')) : null,
    turnaround_days_min: formData.get('turnaround_days_min') ? Number(formData.get('turnaround_days_min')) : null,
    turnaround_days_max: formData.get('turnaround_days_max') ? Number(formData.get('turnaround_days_max')) : null,
    notes: (formData.get('notes') as string) || null,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/providers')
  return { success: true }
}

export async function updateProvider(providerId: string, formData: FormData) {
  const supabase = await verifyAdmin()

  const services = formData.getAll('services') as string[]

  const { error } = await supabase
    .from('providers')
    .update({
      business_name: formData.get('business_name') as string,
      contact_name: formData.get('contact_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address_line1: (formData.get('address_line1') as string) || null,
      city: (formData.get('city') as string) || null,
      state: (formData.get('state') as string) || null,
      postal_code: (formData.get('postal_code') as string) || null,
      services: services as never,
      capacity_per_week: formData.get('capacity_per_week') ? Number(formData.get('capacity_per_week')) : null,
      turnaround_days_min: formData.get('turnaround_days_min') ? Number(formData.get('turnaround_days_min')) : null,
      turnaround_days_max: formData.get('turnaround_days_max') ? Number(formData.get('turnaround_days_max')) : null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', providerId)

  if (error) return { error: error.message }
  revalidatePath('/admin/providers')
  return { success: true }
}

export async function deactivateProvider(providerId: string) {
  const supabase = await verifyAdmin()

  const { error } = await supabase
    .from('providers')
    .update({ is_active: false })
    .eq('id', providerId)

  if (error) return { error: error.message }
  revalidatePath('/admin/providers')
  return { success: true }
}

export async function reactivateProvider(providerId: string) {
  const supabase = await verifyAdmin()

  const { error } = await supabase
    .from('providers')
    .update({ is_active: true })
    .eq('id', providerId)

  if (error) return { error: error.message }
  revalidatePath('/admin/providers')
  return { success: true }
}

export async function adminUpdateItem(
  itemId: string,
  field: 'name' | 'description' | 'location_label' | 'internal_notes' | 'care_instructions' | 'brand' | 'color' | 'size' | 'material',
  value: string
) {
  const supabase = await verifyAdmin()

  const { error } = await supabase
    .from('items')
    .update({ [field]: value || null } as never)
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/inventory/${itemId}`)
  return { success: true }
}

export async function adminUpdateItemLocation(itemId: string, locationStatus: string | null) {
  const supabase = await verifyAdmin()

  const { error } = await supabase
    .from('items')
    .update({ location_status: locationStatus as never })
    .eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/inventory/${itemId}`)
  return { success: true }
}
