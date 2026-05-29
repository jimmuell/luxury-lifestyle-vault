'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { ITEM_CATEGORY_LABELS, ITEM_LOCATION_LABELS } from '@/types/app'
import type { ItemCategory, ItemLocation } from '@/types/app'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const
const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'category', label: 'Category' },
  { value: 'location', label: 'Location' },
] as const

function useFilterParam(key: string) {
  const searchParams = useSearchParams()
  return searchParams.get(key)?.split(',').filter(Boolean) ?? []
}

function FilterPills({
  label,
  options,
  paramKey,
  currentValues,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  paramKey: string
  currentValues: string[]
  onToggle: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onToggle(paramKey, opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors',
              currentValues.includes(opt.value)
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function WardrobeFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const categories = useFilterParam('category')
  const locations = useFilterParam('location')
  const seasons = useFilterParam('season')
  const sort = searchParams.get('sort') ?? 'recent'
  const view = searchParams.get('view') ?? 'grid'

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page') // reset pagination on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [router, pathname, searchParams])

  const toggleMultiParam = useCallback((key: string, value: string) => {
    const current = searchParams.get(key)?.split(',').filter(Boolean) ?? []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    const params = new URLSearchParams(searchParams.toString())
    if (next.length > 0) params.set(key, next.join(','))
    else params.delete(key)
    params.delete('page')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [router, pathname, searchParams])

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [router, pathname])

  const hasActiveFilters = categories.length > 0 || locations.length > 0 || seasons.length > 0

  const categoryOptions = Object.entries(ITEM_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
  const locationOptions = (Object.entries(ITEM_LOCATION_LABELS) as [ItemLocation, string][]).map(([value, label]) => ({ value, label }))
  const seasonOptions = SEASONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))

  const filterContent = (
    <div className="space-y-6">
      <FilterPills
        label="Category"
        options={categoryOptions}
        paramKey="category"
        currentValues={categories}
        onToggle={toggleMultiParam}
      />
      <FilterPills
        label="Season"
        options={seasonOptions}
        paramKey="season"
        currentValues={seasons}
        onToggle={toggleMultiParam}
      />
      <FilterPills
        label="Location"
        options={locationOptions}
        paramKey="location"
        currentValues={locations}
        onToggle={toggleMultiParam}
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Toolbar row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sort */}
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:ring-1 focus:ring-ring focus:border-ring outline-none"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <button
            onClick={() => updateParam('view', 'grid')}
            className={cn('px-2.5 py-1.5 transition-colors', view === 'grid' ? 'bg-foreground text-background' : 'hover:bg-muted')}
            title="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => updateParam('view', 'list')}
            className={cn('px-2.5 py-1.5 transition-colors border-l border-border', view === 'list' ? 'bg-foreground text-background' : 'hover:bg-muted')}
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Filters sheet trigger */}
        <Sheet>
          <SheetTrigger
            className={cn(
              'flex items-center gap-2 text-xs border rounded-md px-3 py-1.5 transition-colors',
              hasActiveFilters
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:border-foreground/40'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 bg-background/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {categories.length + locations.length + seasons.length}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="py-6 px-1 space-y-6">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg">Filter wardrobe</p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                    <X className="h-3.5 w-3.5 mr-1" /> Clear all
                  </Button>
                )}
              </div>
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => toggleMultiParam('category', c)}
                className="flex items-center gap-1 text-xs border border-foreground bg-foreground text-background rounded-full px-2.5 py-1"
              >
                {ITEM_CATEGORY_LABELS[c as ItemCategory]} <X className="h-3 w-3" />
              </button>
            ))}
            {seasons.map(s => (
              <button
                key={s}
                onClick={() => toggleMultiParam('season', s)}
                className="flex items-center gap-1 text-xs border border-foreground bg-foreground text-background rounded-full px-2.5 py-1"
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} <X className="h-3 w-3" />
              </button>
            ))}
            {locations.map(l => (
              <button
                key={l}
                onClick={() => toggleMultiParam('location', l)}
                className="flex items-center gap-1 text-xs border border-foreground bg-foreground text-background rounded-full px-2.5 py-1"
              >
                {ITEM_LOCATION_LABELS[l as ItemLocation]} <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  )
}
