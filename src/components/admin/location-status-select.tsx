'use client'

import { useTransition } from 'react'
import { adminUpdateItemLocation } from '@/actions/admin'
import { toast } from 'sonner'
import type { ItemLocation } from '@/types/app'
import { ITEM_LOCATION_LABELS } from '@/types/app'

const LOCATION_VALUES = Object.keys(ITEM_LOCATION_LABELS) as ItemLocation[]

export function LocationStatusSelect({
  itemId,
  value,
}: {
  itemId: string
  value: ItemLocation | null
}) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value || null
    startTransition(async () => {
      const result = await adminUpdateItemLocation(itemId, next)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Location updated.')
      }
    })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Location Status</p>
      <select
        value={value ?? ''}
        onChange={handleChange}
        disabled={pending}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        <option value="">— Not set —</option>
        {LOCATION_VALUES.map(loc => (
          <option key={loc} value={loc}>
            {ITEM_LOCATION_LABELS[loc]}
          </option>
        ))}
      </select>
    </div>
  )
}
