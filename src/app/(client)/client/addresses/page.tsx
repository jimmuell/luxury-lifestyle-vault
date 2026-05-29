import { createClient } from '@/lib/supabase/server'
import { AddressManager } from '@/components/client/address-manager'
import type { Address } from '@/types/app'

export default async function AddressesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('profile_id', user!.id)
    .order('is_primary', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">Addresses</h1>
        <p className="text-muted-foreground mt-1">
          Manage your Wisconsin and Arizona residences for seasonal wardrobe service.
        </p>
      </div>

      <AddressManager addresses={(addresses ?? []) as Address[]} />
    </div>
  )
}
