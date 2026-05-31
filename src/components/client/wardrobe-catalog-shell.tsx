'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WardrobeSearchBar } from './wardrobe-search-bar'
import { WardrobeFilterBar } from './wardrobe-filters'
import { StatusBadge } from '@/components/shared/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { ITEM_CATEGORY_LABELS } from '@/types/app'
import type { SearchResult } from '@/actions/search'
import type { ItemStatus, ItemCategory } from '@/types/app'
import { CategoryArtCard } from '@/components/wardrobe/category-art-card'
import { cn } from '@/lib/utils'

function PaginationControls({
  page,
  totalPages,
  pageSize,
  total,
}: {
  page: number
  totalPages: number
  pageSize: number
  total: number
}) {
  const searchParams = useSearchParams()

  function pageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} items
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={pageHref(page - 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'opacity-40 pointer-events-none')}>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">{page} / {totalPages}</span>
        {page < totalPages ? (
          <Link href={pageHref(page + 1)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'opacity-40 pointer-events-none')}>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  )
}

interface PageItem {
  id: string
  name: string
  brand: string | null
  category: string
  status: string
  color: string | null
  season: string | null
  location_status: string | null
  location_label: string | null
}

interface AllItem {
  id: string
  name: string
  brand: string | null
  category: string
  status: string
  color: string | null
}

interface WardrobeCatalogShellProps {
  items: PageItem[]
  allItems: AllItem[]
  photoMap: Record<string, string>
  total: number
  page: number
  pageSize: number
  view: string
}

export function WardrobeCatalogShell({
  items,
  allItems,
  photoMap,
  total,
  page,
  pageSize,
  view,
}: WardrobeCatalogShellProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)

  function handleSearchResults(results: SearchResult[] | null) {
    setSearchResults(results)
  }

  const totalPages = Math.ceil(total / pageSize)

  const searchDisplayItems = searchResults
    ? searchResults
        .map(r => ({
          item: allItems.find(i => i.id === r.itemId),
          score: r.score,
          reason: r.reason,
        }))
        .filter((r): r is { item: AllItem; score: number; reason: string } => r.item != null)
    : null

  return (
    <div className="space-y-4">
      <WardrobeSearchBar onResults={handleSearchResults} />

      {searchDisplayItems ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {searchDisplayItems.length} result{searchDisplayItems.length !== 1 ? 's' : ''}
          </p>
          {searchDisplayItems.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-muted-foreground italic">No items match your search</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords, or browse below using filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {searchDisplayItems.map(({ item, reason }) => (
                <Link
                  key={item.id}
                  href={`/client/wardrobe/${item.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 bg-card hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden">
                    {photoMap[item.id] ? (
                      <Image
                        src={photoMap[item.id]}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover"
                      />
                    ) : (
                      <CategoryArtCard category={item.category as ItemCategory} name={item.name} brand={item.brand} size="list" className="w-10 h-10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{item.brand}</p>
                    )}
                    <p className="text-sm font-medium group-hover:underline underline-offset-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 italic">{reason}</p>
                  </div>
                  <StatusBadge status={item.status as ItemStatus} />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-10" />}>
            <WardrobeFilterBar />
          </Suspense>

          {items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="font-serif text-xl text-muted-foreground">No items match your filters</p>
              <Link
                href="/client/wardrobe"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear filters
              </Link>
            </div>
          ) : view === 'list' ? (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={`/client/wardrobe/${item.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 bg-card hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden">
                    {photoMap[item.id] ? (
                      <Image
                        src={photoMap[item.id]}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-cover w-12 h-12"
                      />
                    ) : (
                      <CategoryArtCard category={item.category as ItemCategory} name={item.name} brand={item.brand} size="list" className="w-12 h-12" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{item.brand}</p>
                    )}
                    <p className="text-sm font-medium group-hover:underline underline-offset-2">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ITEM_CATEGORY_LABELS[item.category as ItemCategory]}
                      {item.color && ` · ${item.color}`}
                    </p>
                  </div>
                  <StatusBadge status={item.status as ItemStatus} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map(item => (
                <Link key={item.id} href={`/client/wardrobe/${item.id}`} className="group block">
                  <div className="relative aspect-[4/5] bg-muted rounded-md mb-2.5 overflow-hidden">
                    {photoMap[item.id] ? (
                      <Image
                        src={photoMap[item.id]}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <CategoryArtCard category={item.category as ItemCategory} name={item.name} brand={item.brand} size="grid" className="absolute inset-0" />
                    )}
                  </div>
                  <div className="space-y-1">
                    {item.brand && (
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground truncate">
                        {item.brand}
                      </p>
                    )}
                    <p className="font-medium text-xs leading-snug group-hover:underline underline-offset-2 line-clamp-2">
                      {item.name}
                    </p>
                    <StatusBadge status={item.status as ItemStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Suspense fallback={<div className="h-9" />}>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}
