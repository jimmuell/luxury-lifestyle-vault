'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createOnDemandRequest } from '@/actions/orders'
import { ITEM_CATEGORY_LABELS } from '@/types/app'
import type { ItemCategory } from '@/types/app'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, Zap } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface StoredItem {
  id: string
  name: string
  brand: string | null
  category: string
  status: string
  location_status: string | null
  location_label: string | null
}

interface AddressOption {
  id: string
  label: string | null
  line1: string
  city: string
  state: string
  postal_code: string
  is_primary: boolean
}

interface TierPricing {
  base: number
  perItem: number
  rushPct: number
  discountPct: number
  isFoundingMember: boolean
  minLeadHours: number
  rushLeadHours: number
}

interface OnDemandRequestFormProps {
  items: StoredItem[]
  addresses: AddressOption[]
  pricing: TierPricing | null
}

const STEPS = ['Select items', 'Delivery address', 'Details & review']

function computeCost(pricing: TierPricing, itemCount: number, isRush: boolean) {
  const additional = Math.max(0, itemCount - 1)
  let subtotal = pricing.base + additional * pricing.perItem
  if (isRush) subtotal = Math.round(subtotal * (1 + pricing.rushPct / 100))
  if (pricing.isFoundingMember) subtotal = Math.round(subtotal * (1 - pricing.discountPct / 100))
  return subtotal
}

export function OnDemandRequestForm({ items, addresses, pricing }: OnDemandRequestFormProps) {
  const [step, setStep] = useState(0)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find(a => a.is_primary)?.id ?? addresses[0]?.id ?? ''
  )
  const [deliveryDate, setDeliveryDate] = useState(
    format(addDays(new Date(), pricing?.rushLeadHours != null ? Math.ceil(pricing.rushLeadHours / 24) + 1 : 3), 'yyyy-MM-dd')
  )
  const [isRush, setIsRush] = useState(false)
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleItem(id: string) {
    setSelectedItemIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const itemCount = selectedItemIds.size
  const estimatedTotal = pricing && itemCount > 0
    ? computeCost(pricing, itemCount, isRush)
    : null

  const minDate = format(
    addDays(new Date(), isRush
      ? Math.ceil((pricing?.rushLeadHours ?? 24) / 24)
      : Math.ceil((pricing?.minLeadHours ?? 72) / 24)
    ),
    'yyyy-MM-dd'
  )

  const selectedItems = useMemo(() => items.filter(i => selectedItemIds.has(i.id)), [items, selectedItemIds])
  const selectedAddress = addresses.find(a => a.id === selectedAddressId)

  function canAdvance() {
    if (step === 0) return selectedItemIds.size > 0
    if (step === 1) return !!selectedAddressId
    return true
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const { orderId } = await createOnDemandRequest({
          itemIds: Array.from(selectedItemIds),
          toAddressId: selectedAddressId,
          requestedDeliveryDate: deliveryDate,
          notes: notes || undefined,
          isRush,
        })
        toast.success('Request submitted — your concierge will confirm shortly')
        router.push(`/client/orders/${orderId}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-full text-xs flex items-center justify-center border transition-colors',
              i < step
                ? 'bg-foreground border-foreground text-background'
                : i === step
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-border text-muted-foreground'
            )}>
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs hidden sm:block',
              i === step ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {label}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-light">Select items to request</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose items from your vault that you need delivered.</p>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center rounded-lg border border-dashed border-border">
              <p className="font-serif text-lg text-muted-foreground italic">No items available for delivery</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {items.map(item => {
                const selected = selectedItemIds.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      'w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors',
                      selected ? 'bg-accent/10' : 'bg-card hover:bg-muted/40'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                      selected ? 'border-foreground bg-foreground' : 'border-border'
                    )}>
                      {selected && <Check className="h-3 w-3 text-background" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.brand && (
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{item.brand}</p>
                      )}
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ITEM_CATEGORY_LABELS[item.category as ItemCategory]}
                        {item.location_label && ` · ${item.location_label}`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {pricing && itemCount > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm">
              <span className="text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
              <span className="font-medium">${(estimatedTotal! / 100).toFixed(0)} est.</span>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-light">Delivery address</h2>
            <p className="text-sm text-muted-foreground mt-1">Where should we deliver your items?</p>
          </div>

          <div className="space-y-3">
            {addresses.map(addr => {
              const selected = addr.id === selectedAddressId
              return (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-colors',
                    selected ? 'border-foreground bg-accent/5' : 'border-border hover:border-foreground/30'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    selected ? 'border-foreground bg-foreground' : 'border-border'
                  )}>
                    {selected && <div className="w-2 h-2 rounded-full bg-background" />}
                  </div>
                  <div>
                    {addr.label && <p className="text-sm font-medium">{addr.label}</p>}
                    <p className="text-sm text-muted-foreground">{addr.line1}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-light">Details & review</h2>
          </div>

          {/* Rush toggle */}
          {pricing && (
            <div
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                isRush ? 'border-foreground bg-accent/5' : 'border-border hover:border-foreground/30'
              )}
              onClick={() => setIsRush(r => !r)}
            >
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                isRush ? 'border-foreground bg-foreground' : 'border-border'
              )}>
                {isRush && <Check className="h-3 w-3 text-background" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">Rush delivery</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expedited handling within {pricing.rushLeadHours}h · +{pricing.rushPct}% premium
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
              Requested delivery date
            </label>
            <input
              type="date"
              value={deliveryDate}
              min={minDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
              Special instructions <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Styling notes, special packaging, access instructions…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            <div className="px-5 py-3.5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Items</p>
              {selectedItems.map(item => (
                <p key={item.id} className="text-sm">{item.brand ? `${item.brand} — ` : ''}{item.name}</p>
              ))}
            </div>
            {selectedAddress && (
              <div className="px-5 py-3.5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Deliver to</p>
                <p className="text-sm">{selectedAddress.label ?? ''}</p>
                <p className="text-sm text-muted-foreground">{selectedAddress.line1}, {selectedAddress.city}</p>
              </div>
            )}
            <div className="px-5 py-3.5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Requested delivery</p>
              <p className="text-sm">{format(new Date(deliveryDate), 'MMMM d, yyyy')}</p>
            </div>
            {estimatedTotal != null && (
              <div className="px-5 py-3.5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Estimated total</p>
                <p className="text-sm font-medium">${(estimatedTotal / 100).toFixed(2)}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Your concierge will confirm this request within one business day.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          Back
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="px-5 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending || !deliveryDate}
            className="px-5 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Submitting…' : 'Submit request'}
          </button>
        )}
      </div>
    </div>
  )
}
