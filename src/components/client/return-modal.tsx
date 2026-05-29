'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { clientInitiateReturn } from '@/actions/orders'
import { RotateCcw, X } from 'lucide-react'

interface ReturnItem {
  id: string
  name: string
  brand: string | null
}

interface ReturnModalProps {
  orderId: string
  orderType: 'seasonal_rotation' | 'on_demand_item'
  items: ReturnItem[]
}

export function ReturnModal({ orderId, orderType, items }: ReturnModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(items.map(i => i.id)))
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isSeasonal = orderType === 'seasonal_rotation'

  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    const itemIds = isSeasonal ? undefined : Array.from(selectedIds)
    if (!isSeasonal && selectedIds.size === 0) {
      toast.error('Select at least one item to return')
      return
    }

    startTransition(async () => {
      try {
        await clientInitiateReturn(orderId, { itemIds })
        toast.success('Return initiated — your concierge will arrange pickup')
        setOpen(false)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not initiate return')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5 inline mr-1.5" />
        Return items
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-serif text-lg font-light">Return items</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {isSeasonal ? (
                <p className="text-sm text-muted-foreground">
                  All {items.length} item{items.length !== 1 ? 's' : ''} from this rotation will be returned to the vault. Your concierge will contact you to arrange pickup.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Select which items to return.</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {items.map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <div>
                          {item.brand && (
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.brand}</p>
                          )}
                          <p className="text-sm">{item.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || (!isSeasonal && selectedIds.size === 0)}
                className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Processing…' : 'Initiate return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
