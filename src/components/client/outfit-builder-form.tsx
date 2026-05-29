'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createOutfit } from '@/actions/outfits'
import { Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  name: string
  brand: string | null
  category: string
  color: string | null
  status: string
  photoUrl: string | null
}

export function OutfitBuilderForm({
  items,
  preSelectedIds = [],
}: {
  items: Item[]
  preSelectedIds?: string[]
}) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelectedIds))
  const [search, setSearch] = useState('')
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const filtered = items.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      (item.brand?.toLowerCase().includes(q) ?? false) ||
      item.category.toLowerCase().includes(q) ||
      (item.color?.toLowerCase().includes(q) ?? false)
    )
  })

  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter an outfit name')
      return
    }
    if (selectedIds.size === 0) {
      toast.error('Select at least one item')
      return
    }
    setSaving(true)
    startTransition(async () => {
      try {
        const result = await createOutfit({
          name: name.trim(),
          notes: notes.trim() || undefined,
          itemIds: [...selectedIds],
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Outfit saved')
          router.push(`/client/outfits/${result.id}`)
        }
      } catch {
        toast.error('Failed to save outfit')
      } finally {
        setSaving(false)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name + notes */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground tracking-widest uppercase block mb-1.5">
            Outfit name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Scottsdale brunch, Arizona summer"
            required
            className="w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground tracking-widest uppercase block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Occasion, styling notes…"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
          />
        </div>
      </div>

      {/* Item picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Items ({selectedIds.size} selected)
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, brand, category…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map(item => {
            const selected = selectedIds.has(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'relative rounded-lg border overflow-hidden text-left transition-all',
                  selected
                    ? 'border-foreground ring-1 ring-foreground'
                    : 'border-border hover:border-foreground/30'
                )}
              >
                <div className="aspect-[3/4] bg-muted overflow-hidden flex items-center justify-center">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{item.category.replace(/_/g, ' ')}</span>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  {item.brand && <p className="text-[9px] text-muted-foreground tracking-widest uppercase">{item.brand}</p>}
                  <p className="text-xs font-medium truncate leading-tight">{item.name}</p>
                </div>
                {selected && (
                  <div className="absolute top-2 right-2 bg-foreground rounded-full p-0.5">
                    <Check className="h-3 w-3 text-background" />
                  </div>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No items match.</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save outfit'}
      </button>
    </form>
  )
}
