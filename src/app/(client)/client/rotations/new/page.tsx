import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RotationRequestWizard } from '@/components/client/rotation-request-wizard'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

const REQUESTABLE_STATUSES = ['stored', 'cleaning_complete'] as const

export default async function NewRotationPage({
  searchParams,
}: {
  searchParams: Promise<{ outfitId?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [itemsResult, addressesResult] = await Promise.all([
    supabase
      .from('items')
      .select('id, name, brand, category, status, location_status, location_label')
      .eq('client_id', user!.id)
      .in('status', REQUESTABLE_STATUSES)
      .order('name', { ascending: true }),
    supabase
      .from('addresses')
      .select('id, label, line1, city, state, postal_code, is_primary')
      .eq('profile_id', user!.id)
      .order('is_primary', { ascending: false }),
  ])

  // Pre-select items from outfit if outfitId param is present
  let preSelectedIds: string[] = []
  if (params.outfitId) {
    const { data: outfitItems } = await supabase
      .from('outfit_items')
      .select('item_id')
      .eq('outfit_id', params.outfitId)
    preSelectedIds = (outfitItems ?? []).map(oi => oi.item_id)
  }

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-4">
        <Link href="/client/orders" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orders
        </Link>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Seasonal rotation</p>
          <h1 className="font-serif text-3xl font-light mt-1">Request a delivery</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Select items from your vault and we&apos;ll deliver them to your current residence.
          </p>
        </div>
      </div>

      <RotationRequestWizard
        items={itemsResult.data ?? []}
        addresses={addressesResult.data ?? []}
        preSelectedIds={preSelectedIds}
      />
    </div>
  )
}
