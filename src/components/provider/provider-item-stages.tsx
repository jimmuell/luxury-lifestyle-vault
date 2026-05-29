'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateItemServiceStage } from '@/actions/provider'
import { providerSendMessage } from '@/actions/concierge'
import { cn } from '@/lib/utils'
import { ChevronRight, AlertTriangle } from 'lucide-react'

type ServiceStage = 'received' | 'cleaning' | 'pressing' | 'ready_for_pickup'

const STAGES: { value: ServiceStage; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'pressing', label: 'Pressing' },
  { value: 'ready_for_pickup', label: 'Ready for pickup' },
]

function stageIndex(stage: ServiceStage | null): number {
  if (!stage) return -1
  return STAGES.findIndex(s => s.value === stage)
}

function nextStage(current: ServiceStage | null): ServiceStage | null {
  const idx = stageIndex(current)
  return idx < STAGES.length - 1 ? STAGES[idx + 1].value : null
}

type OrderItem = {
  id: string
  item_id: string
  notes: string | null
  provider_service_stage: ServiceStage | null
  provider_notes: string | null
  damage_flagged: boolean
  items: {
    id: string
    name: string
    brand: string | null
    category: string
    color: string | null
    material: string | null
    care_instructions: string | null
    sku: string | null
  } | null
}

function ItemStageCard({
  item,
  orderId,
  onUpdate,
}: {
  item: OrderItem
  orderId: string
  onUpdate: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(item.provider_notes ?? '')
  const [damageFlagged, setDamageFlagged] = useState(item.damage_flagged)
  const [, startTransition] = useTransition()
  const [updating, setUpdating] = useState(false)

  const currentStage = item.provider_service_stage
  const next = nextStage(currentStage)

  function handleAdvance() {
    if (!next) return
    setUpdating(true)
    startTransition(async () => {
      try {
        const wasDamageFlagged = item.damage_flagged
        await updateItemServiceStage(item.id, orderId, next, notes || undefined, damageFlagged)
        // Auto-send damage report message when damage is newly flagged
        if (damageFlagged && !wasDamageFlagged) {
          await providerSendMessage({
            orderId,
            subject: `Damage observed — ${item.items?.name ?? 'item'}`,
            body: `Potential damage has been flagged on ${item.items?.brand ? `${item.items.brand} ` : ''}${item.items?.name ?? 'an item'} (SKU: ${item.items?.sku ?? 'N/A'}).${notes ? `\n\nNotes: ${notes}` : ''}`,
            isDamageReport: true,
          })
        }
        toast.success(`Marked as ${next.replace(/_/g, ' ')}`)
        onUpdate()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update')
      } finally {
        setUpdating(false)
      }
    })
  }

  const currentIdx = stageIndex(currentStage)

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      item.damage_flagged ? 'border-amber-300' : 'border-border'
    )}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          {item.items?.brand && (
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{item.items.brand}</p>
          )}
          <p className="text-sm font-medium">{item.items?.name ?? 'Item'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.items?.category?.replace(/_/g, ' ')}
            {currentStage
              ? ` · ${currentStage.replace(/_/g, ' ')}`
              : ' · Not yet received'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {item.damage_flagged && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-card">
          {/* Stage progress */}
          <div className="flex items-center gap-2">
            {STAGES.map((s, i) => (
              <div key={s.value} className="flex items-center gap-2">
                <div className={cn(
                  'px-2.5 py-1 text-xs rounded-full border transition-colors',
                  i <= currentIdx
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground'
                )}>
                  {s.label}
                </div>
                {i < STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Item details (no client PII) */}
          {item.items && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {item.items.color && (
                <div>
                  <p className="text-xs text-muted-foreground">Color</p>
                  <p>{item.items.color}</p>
                </div>
              )}
              {item.items.material && (
                <div>
                  <p className="text-xs text-muted-foreground">Material</p>
                  <p>{item.items.material}</p>
                </div>
              )}
              {item.items.care_instructions && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Care instructions</p>
                  <p className="text-muted-foreground">{item.items.care_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes + damage flag */}
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional — visible to LLV operations only)…"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
            />
            <label className="flex items-center gap-2.5 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={damageFlagged}
                onChange={e => setDamageFlagged(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-amber-700">Flag potential damage</span>
            </label>
          </div>

          {next && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
            >
              {updating ? 'Updating…' : `Mark as ${next.replace(/_/g, ' ')}`}
            </button>
          )}
          {!next && currentStage === 'ready_for_pickup' && (
            <p className="text-xs text-emerald-600 font-medium">✓ Ready for pickup</p>
          )}
        </div>
      )}
    </div>
  )
}

export function ProviderItemStages({
  orderId,
  orderItems,
}: {
  orderId: string
  orderItems: OrderItem[]
}) {
  const router = useRouter()

  function handleUpdate() {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Items ({orderItems.length})</h2>
        <p className="text-xs text-muted-foreground">Tap an item to update its stage</p>
      </div>
      <div className="space-y-3">
        {orderItems.map(item => (
          <ItemStageCard key={item.id} item={item} orderId={orderId} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  )
}
