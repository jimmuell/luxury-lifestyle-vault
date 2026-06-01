'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminDispatchToProvider } from '@/actions/orders'
import { format, addHours, addDays, parse } from 'date-fns'

interface Provider {
  id: string
  business_name: string
}

interface DispatchModalProps {
  orderId: string
  providers: Provider[]
  requestedDeliveryDate: string | null
  onClose: () => void
}

function toDatetimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function DispatchModal({ orderId, providers, requestedDeliveryDate, onClose }: DispatchModalProps) {
  const now = new Date()
  const defaultDeadline = requestedDeliveryDate
    ? addDays(parse(requestedDeliveryDate, 'yyyy-MM-dd', new Date()), -2)
    : addDays(now, 5)

  const [providerId, setProviderId] = useState(providers[0]?.id ?? '')
  const [pickupStart, setPickupStart] = useState(toDatetimeLocal(addHours(now, 24)))
  const [pickupEnd, setPickupEnd] = useState(toDatetimeLocal(addHours(now, 48)))
  const [deadline, setDeadline] = useState(toDatetimeLocal(defaultDeadline))
  const [prepInstructions, setPrepInstructions] = useState('')
  const [, startTransition] = useTransition()
  const [dispatching, setDispatching] = useState(false)
  const router = useRouter()

  function handleDispatch() {
    if (!providerId) {
      toast.error('Select a provider')
      return
    }
    setDispatching(true)
    startTransition(async () => {
      try {
        await adminDispatchToProvider({
          orderId,
          providerId,
          pickupWindowStart: new Date(pickupStart).toISOString(),
          pickupWindowEnd: new Date(pickupEnd).toISOString(),
          deliveryDeadline: new Date(deadline).toISOString(),
          prepInstructions: prepInstructions.trim() || undefined,
        })
        toast.success('Order dispatched to provider')
        router.refresh()
        onClose()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to dispatch')
        setDispatching(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-lg space-y-6 p-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Provider Dispatch</p>
          <h2 className="font-serif text-xl font-light">Assign & dispatch order</h2>
        </div>

        <div className="space-y-4">
          {/* Provider */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">Provider</label>
            <select
              value={providerId}
              onChange={e => setProviderId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
            >
              <option value="">Select a provider…</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.business_name}</option>
              ))}
            </select>
          </div>

          {/* Pickup window */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Pickup from</label>
              <input
                type="datetime-local"
                value={pickupStart}
                onChange={e => setPickupStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Pickup until</label>
              <input
                type="datetime-local"
                value={pickupEnd}
                onChange={e => setPickupEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          {/* Delivery deadline */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">Delivery deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
            />
            {requestedDeliveryDate && (
              <p className="text-[10px] text-muted-foreground">
                Client requested {format(parse(requestedDeliveryDate, 'yyyy-MM-dd', new Date()), 'MMM d')} — default is 48h before that
              </p>
            )}
          </div>

          {/* Prep instructions */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">
              Prep instructions <span className="normal-case">(optional)</span>
            </label>
            <textarea
              value={prepInstructions}
              onChange={e => setPrepInstructions(e.target.value)}
              placeholder="e.g. Lightly press only; no harsh solvents on the silk lining…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDispatch}
            disabled={dispatching || !providerId}
            className="px-5 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            {dispatching ? 'Dispatching…' : 'Dispatch to provider'}
          </button>
        </div>
      </div>
    </div>
  )
}
