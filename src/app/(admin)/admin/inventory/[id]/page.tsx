import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSignedUrls } from '@/lib/storage/server'
import { StatusBadge } from '@/components/shared/status-badge'
import { StatusTransitionPanel } from '@/components/admin/status-transition-panel'
import { AddConditionForm } from '@/components/admin/add-condition-form'
import { ItemFieldEditor } from '@/components/admin/item-field-editor'
import { LocationStatusSelect } from '@/components/admin/location-status-select'
import { adminUpdateItem } from '@/actions/admin'
import { CategoryArtCard } from '@/components/wardrobe/category-art-card'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ItemStatus, ItemCategory, ItemLocation, ConditionLevel } from '@/types/app'
import { ITEM_CATEGORY_LABELS, CONDITION_LEVEL_LABELS } from '@/types/app'
import { format } from 'date-fns'

export default async function AdminItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: item } = await supabase
    .from('items')
    .select('*, profiles(full_name, email)')
    .eq('id', id)
    .single()

  if (!item) notFound()

  const [{ data: photos }, { data: conditions }] = await Promise.all([
    adminSupabase
      .from('item_photos')
      .select('id, storage_path, photo_type, caption, sort_order, ai_analysis')
      .eq('item_id', id)
      .order('sort_order', { ascending: true }),
    adminSupabase
      .from('item_conditions')
      .select('id, condition_level, notes, assessed_at, profiles(full_name)')
      .eq('item_id', id)
      .order('assessed_at', { ascending: false }),
  ])

  const storagePaths = (photos ?? [])
    .map(p => p.storage_path)
    .filter(p => !p.endsWith('seed-main.jpg'))
  const signedUrlMap = await getSignedUrls(storagePaths)

  const primaryPhoto = photos?.[0]
  const primarySignedUrl =
    primaryPhoto && !primaryPhoto.storage_path.endsWith('seed-main.jpg')
      ? (signedUrlMap[primaryPhoto.storage_path] ?? null)
      : null

  const clientName = item.profiles?.full_name ?? item.profiles?.email ?? 'Unknown client'

  const makeUpdateFn = (field: Parameters<typeof adminUpdateItem>[1]) =>
    async (value: string) => adminUpdateItem(id, field, value)

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/inventory"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4 text-muted-foreground')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Inventory
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light">{item.name}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-mono text-xs text-muted-foreground">{item.sku}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <Link
                href={`/admin/clients/${item.client_id}`}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                {clientName}
              </Link>
            </div>
          </div>
          <StatusBadge status={item.status as ItemStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — photo + status */}
        <div className="lg:col-span-1 space-y-6">
          {/* Primary photo */}
          <div className="rounded-lg overflow-hidden border border-border aspect-[4/5] bg-muted relative">
            {primarySignedUrl ? (
              <Image
                src={primarySignedUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            ) : (
              <CategoryArtCard
                category={item.category as ItemCategory}
                name={item.name}
                brand={item.brand}
                size="detail"
                className="absolute inset-0"
              />
            )}
          </div>

          {/* Thumbnail strip */}
          {(photos?.length ?? 0) > 1 && (
            <div className="grid grid-cols-4 gap-1.5">
              {photos!.slice(1, 5).map(photo => {
                const url = signedUrlMap[photo.storage_path]
                return url ? (
                  <div key={photo.id} className="aspect-square rounded overflow-hidden border border-border relative bg-muted">
                    <Image
                      src={url}
                      alt={photo.photo_type}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ) : null
              })}
            </div>
          )}

          <Separator />

          {/* Status transitions */}
          <StatusTransitionPanel itemId={id} currentStatus={item.status as ItemStatus} />
        </div>

        {/* Right column — metadata */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item fields — editable */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Item Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ItemFieldEditor
                label="Name"
                value={item.name}
                onSave={makeUpdateFn('name')}
                placeholder="Item name"
              />
              <ItemFieldEditor
                label="Brand"
                value={item.brand}
                onSave={makeUpdateFn('brand')}
                placeholder="Brand"
              />
              <ItemFieldEditor
                label="Color"
                value={item.color}
                onSave={makeUpdateFn('color')}
                placeholder="Primary color"
              />
              <ItemFieldEditor
                label="Size"
                value={item.size}
                onSave={makeUpdateFn('size')}
                placeholder="Size / fit"
              />
              <ItemFieldEditor
                label="Material"
                value={item.material}
                onSave={makeUpdateFn('material')}
                placeholder="Fabric / material"
              />
              <div className="space-y-1.5">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{ITEM_CATEGORY_LABELS[item.category as ItemCategory]}</p>
              </div>
            </div>

            <ItemFieldEditor
              label="Description"
              value={item.description}
              onSave={makeUpdateFn('description')}
              multiline
              placeholder="Item description"
            />
            <ItemFieldEditor
              label="Care Instructions"
              value={item.care_instructions}
              onSave={makeUpdateFn('care_instructions')}
              multiline
              placeholder="Care notes"
            />
          </div>

          {/* Operations fields */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Operations</p>

            <LocationStatusSelect
              itemId={id}
              value={item.location_status as ItemLocation | null}
            />
            <ItemFieldEditor
              label="Location Notes"
              value={item.location_label}
              onSave={makeUpdateFn('location_label')}
              placeholder="e.g. master bedroom closet, Rack A-12"
            />
            <ItemFieldEditor
              label="Internal Notes"
              value={item.internal_notes}
              onSave={makeUpdateFn('internal_notes')}
              multiline
              placeholder="Internal staff notes (not visible to client)"
            />

            <div className="space-y-1.5">
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Added</p>
              <p className="text-sm text-muted-foreground">{format(new Date(item.created_at), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Condition history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-light">Condition History</h2>
          <AddConditionForm itemId={id} />
        </div>

        {conditions && conditions.length > 0 ? (
          <div className="space-y-3">
            {conditions.map(c => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{CONDITION_LEVEL_LABELS[c.condition_level as ConditionLevel]}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.assessed_at), 'MMM d, yyyy · h:mm a')}
                    {/* @ts-expect-error — joined relation */}
                    {c.profiles?.full_name && ` · ${c.profiles.full_name}`}
                  </span>
                </div>
                {c.notes && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No condition records yet.</p>
        )}
      </div>
    </div>
  )
}
