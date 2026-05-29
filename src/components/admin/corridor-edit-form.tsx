'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateCorridor, setProviderCorridor, removeProviderCorridor } from '@/actions/corridors'
import { cn } from '@/lib/utils'

interface Corridor {
  id: string
  slug: string
  display_name: string
  origin_region_code: string
  destination_region_code: string
  active: boolean
  fall_transition_start_date: string | null
  fall_transition_end_date: string | null
  spring_transition_start_date: string | null
  spring_transition_end_date: string | null
  sort_order: number
}

interface Provider {
  id: string
  business_name: string
  currentRole?: string | null
}

export function CorridorEditForm({
  corridor,
  providers,
  assignedProviders,
}: {
  corridor: Corridor
  providers: Provider[]
  assignedProviders: Array<{ provider_id: string; corridor_role: string }>
}) {
  const [displayName, setDisplayName] = useState(corridor.display_name)
  const [active, setActive] = useState(corridor.active)
  const [fallStart, setFallStart] = useState(corridor.fall_transition_start_date ?? '')
  const [fallEnd, setFallEnd] = useState(corridor.fall_transition_end_date ?? '')
  const [springStart, setSpringStart] = useState(corridor.spring_transition_start_date ?? '')
  const [springEnd, setSpringEnd] = useState(corridor.spring_transition_end_date ?? '')
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  const assignedMap = new Map(assignedProviders.map(ap => [ap.provider_id, ap.corridor_role]))

  function handleSave() {
    setSaving(true)
    startTransition(async () => {
      try {
        await updateCorridor(corridor.id, {
          displayName,
          active,
          fallTransitionStart: fallStart || null,
          fallTransitionEnd: fallEnd || null,
          springTransitionStart: springStart || null,
          springTransitionEnd: springEnd || null,
        })
        toast.success('Corridor updated')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save')
      } finally {
        setSaving(false)
      }
    })
  }

  function handleProviderRole(providerId: string, role: string) {
    startTransition(async () => {
      try {
        if (role === 'remove') {
          await removeProviderCorridor(providerId, corridor.id)
        } else {
          await setProviderCorridor(providerId, corridor.id, role as 'origin_provider' | 'destination_provider' | 'both')
        }
        toast.success('Provider assignment updated')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update provider')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Corridor settings */}
      <div className="rounded-lg border border-border p-5 space-y-5">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Configuration</p>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-0.5">Corridor</p>
            <p className="font-medium font-mono">{corridor.origin_region_code} ↔ {corridor.destination_region_code}</p>
          </div>
          <div className="ml-auto">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span>Active</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Seasonal transition dates</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Fall transition start</label>
              <input type="date" value={fallStart} onChange={e => setFallStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Fall transition end</label>
              <input type="date" value={fallEnd} onChange={e => setFallEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Spring transition start</label>
              <input type="date" value={springStart} onChange={e => setSpringStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Spring transition end</label>
              <input type="date" value={springEnd} onChange={e => setSpringEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none" />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Provider assignments */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Provider assignments</p>
          <p className="text-xs text-muted-foreground mt-1">Assign providers to this corridor to make them available for dispatch.</p>
        </div>
        <div className="divide-y divide-border">
          {providers.map(p => {
            const currentRole = assignedMap.get(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm font-medium">{p.business_name}</p>
                <select
                  value={currentRole ?? 'remove'}
                  onChange={e => handleProviderRole(p.id, e.target.value)}
                  className={cn(
                    'text-xs px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-ring outline-none',
                    currentRole ? 'border-foreground bg-foreground/5' : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  <option value="remove">Not assigned</option>
                  <option value="origin_provider">Origin ({corridor.origin_region_code})</option>
                  <option value="destination_provider">Destination ({corridor.destination_region_code})</option>
                  <option value="both">Both endpoints</option>
                </select>
              </div>
            )
          })}
          {providers.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted-foreground">No active providers.</p>
          )}
        </div>
      </div>
    </div>
  )
}
