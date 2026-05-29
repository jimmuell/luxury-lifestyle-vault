'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createCorridor } from '@/actions/corridors'

export function CorridorCreateForm({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate() {
    if (!displayName || !origin || !destination) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    startTransition(async () => {
      try {
        await createCorridor({
          slug: `${origin.toLowerCase()}_${destination.toLowerCase()}`,
          displayName,
          originRegionCode: origin,
          destinationRegionCode: destination,
        })
        toast.success('Corridor created')
        router.refresh()
        onClose()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to create corridor')
        setSaving(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md space-y-5 p-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">New corridor</p>
          <h2 className="font-serif text-xl font-light">Add a corridor</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Wisconsin ↔ Arizona"
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Origin code</label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="WI"
                maxLength={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none font-mono uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Destination code</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="AZ"
                maxLength={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-5 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create corridor'}
          </button>
        </div>
      </div>
    </div>
  )
}
