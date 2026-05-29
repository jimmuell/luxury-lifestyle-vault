import { createClient } from '@/lib/supabase/server'
import { AddressDefaultSelector } from '@/components/client/address-default-selector'

export default async function AddressesSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [addressesResult, cpResult] = await Promise.all([
    supabase
      .from('addresses')
      .select('id, label, line1, line2, city, state, postal_code, is_primary')
      .eq('profile_id', user!.id)
      .order('is_primary', { ascending: false }),
    supabase
      .from('client_profiles')
      .select('default_delivery_address_id')
      .eq('profile_id', user!.id)
      .single(),
  ])

  const addresses = addressesResult.data ?? []
  const defaultAddressId = cpResult.data?.default_delivery_address_id ?? null

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set which address should be pre-selected when you request an item or rotation.
      </p>
      <AddressDefaultSelector addresses={addresses} defaultAddressId={defaultAddressId} />
    </div>
  )
}
