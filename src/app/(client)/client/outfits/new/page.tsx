import { createClient } from '@/lib/supabase/server'
import { getSignedUrls } from '@/lib/storage/server'
import { H1 } from '@/components/ui/typography'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { OutfitBuilderForm } from '@/components/client/outfit-builder-form'

export default async function NewOutfitPage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Load all client items for the picker
  const { data: items } = await supabase
    .from('items')
    .select('id, name, brand, category, color, status, item_photos(storage_path, sort_order)')
    .eq('client_id', user!.id)
    .order('name', { ascending: true })

  // Build photo map
  const photoMap: Record<string, string> = {}
  const paths: string[] = []
  const pathToItemId: Record<string, string> = {}

  for (const item of items ?? []) {
    const photos = ((item.item_photos ?? []) as { storage_path: string; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order)
    if (photos.length > 0) {
      paths.push(photos[0].storage_path)
      pathToItemId[photos[0].storage_path] = item.id
    }
  }

  if (paths.length > 0) {
    const urlMap = await getSignedUrls(paths)
    for (const [path, url] of Object.entries(urlMap)) {
      if (pathToItemId[path]) photoMap[pathToItemId[path]] = url
    }
  }

  // Pre-select items from query param (from "Save as outfit" flow)
  const preSelectedIds = params.items?.split(',').filter(Boolean) ?? []

  const itemList = (items ?? []).map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    color: item.color,
    status: item.status,
    photoUrl: photoMap[item.id] ?? null,
  }))

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href="/client/outfits"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All outfits
        </Link>
        <H1 className="font-light">New outfit</H1>
      </div>

      <OutfitBuilderForm items={itemList} preSelectedIds={preSelectedIds} />
    </div>
  )
}
