import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getItemsByClient } from '@/lib/queries/items'
import { getSignedUrls } from '@/lib/storage/server'
import { buttonVariants } from '@/components/ui/button'
import { WardrobeCatalogShell } from '@/components/client/wardrobe-catalog-shell'
import { Plus } from 'lucide-react'
import type { ItemCategory, ItemLocation } from '@/types/app'
import { HelpTip } from '@/components/help/help-tip'

const PAGE_SIZE = 48

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const categories = params.category?.split(',').filter(Boolean) as ItemCategory[] | undefined
  const locations = params.location?.split(',').filter(Boolean) as ItemLocation[] | undefined
  const seasons = params.season?.split(',').filter(Boolean)
  const sort = (params.sort ?? 'recent') as 'recent' | 'name_asc' | 'name_desc' | 'category' | 'location'
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const view = params.view ?? 'grid'

  const [{ items, total }, allItemsResult] = await Promise.all([
    getItemsByClient(user!.id, { categories, locations, seasons, sort, page, limit: PAGE_SIZE }),
    supabase
      .from('items')
      .select('id, name, brand, category, status, color')
      .eq('client_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const photoMap: Record<string, string> = {}
  if (items.length > 0) {
    const { data: photoRows } = await supabase
      .from('item_photos')
      .select('item_id, storage_path, public_url')
      .in('item_id', items.map(i => i.id))
      .order('sort_order', { ascending: true })

    const firstPerItem: Record<string, { path: string; publicUrl: string | null }> = {}
    for (const row of photoRows ?? []) {
      if (!firstPerItem[row.item_id]) {
        firstPerItem[row.item_id] = { path: row.storage_path, publicUrl: row.public_url }
      }
    }

    // Use public_url directly when available; skip placeholder seed paths; sign real uploads
    const needSigning: string[] = []
    for (const [itemId, { publicUrl, path }] of Object.entries(firstPerItem)) {
      if (publicUrl) {
        photoMap[itemId] = publicUrl
      } else if (!path.endsWith('seed-main.jpg')) {
        needSigning.push(path)
      }
    }

    if (needSigning.length > 0) {
      const urlMap = await getSignedUrls(needSigning)
      for (const [itemId, { path }] of Object.entries(firstPerItem)) {
        if (!photoMap[itemId] && urlMap[path]) photoMap[itemId] = urlMap[path]
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-3xl font-light">Wardrobe</h1>
          <HelpTip areaKey="client.wardrobe" />
        </div>
        <Link href="/client/wardrobe/intake" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Plus className="h-4 w-4 mr-2" />
          Add item
        </Link>
      </div>

      <Suspense fallback={null}>
        <WardrobeCatalogShell
          items={items}
          allItems={allItemsResult.data ?? []}
          photoMap={photoMap}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          view={view}
        />
      </Suspense>
    </div>
  )
}
