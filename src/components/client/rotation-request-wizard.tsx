'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createRotationRequest } from '@/actions/orders'
import { ITEM_CATEGORY_LABELS } from '@/types/app'
import type { ItemCategory } from '@/types/app'
import { cn } from '@/lib/utils'
import { Check, ChevronRight } from 'lucide-react'
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

interface RotationRequestWizardProps {
  items: StoredItem[]
  addresses: AddressOption[]
  preSelectedIds?: string[]
}

const STEPS = ['Select items', 'Delivery address', 'Delivery details', 'Review']

export function RotationRequestWizard({ items, addresses, preSelectedIds = [] }: RotationRequestWizardProps) {
  const [step, setStep] = useState(0)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(preSelectedIds))
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find(a => a.is_primary)?.id ?? addresses[0]?.id ?? ''
  )
  const [deliveryDate, setDeliveryDate] = useState(format(addDays(new Date(), 5), 'yyyy-MM-dd'))
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

  function canAdvance() {
    if (step === 0) return selectedItemIds.size > 0
    if (step === 1) return !!selectedAddressId
    if (step === 2) return !!deliveryDate
    return true
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const { orderId } = await createRotationRequest({
          itemIds: Array.from(selectedItemIds),
          toAddressId: selectedAddressId,
          requestedDeliveryDate: deliveryDate,
          notes: notes || undefined,
        })
        toast.success('Rotation request submitted')
        router.push(`/client/orders/${orderId}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  const selectedItems = items.filter(i => selectedItemIds.has(i.id))
  const selectedAddress = addresses.find(a => a.id === selectedAddressId)
  const minDate = format(addDays(new Date(), 3), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full text-xs flex items-center justify-center border transition-colors',
                i < step
                  ? 'bg-foreground border-foreground text-background'
                  : i === step
                    ? 'border-foreground text-foreground font-medium'
                    : 'border-border text-muted-foreground'
              )}
            >
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

      {/* Step content */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-light">Select items to request</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose items currently in LLV storage that you&apos;d like delivered.</p>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center rounded-lg border border-dashed border-border">
              <p className="font-serif text-lg text-muted-foreground italic">No items currently in storage</p>
              <p className="text-sm text-muted-foreground mt-1">Items in your wardrobe appear here once they&apos;re stored with us.</p>
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
                      'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
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

          {selectedItemIds.size > 0 && (
            <p className="text-xs text-muted-foreground">{selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''} selected</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-light">Delivery address</h2>
            <p className="text-sm text-muted-foreground mt-1">Where should we send your items?</p>
          </div>

          {addresses.length === 0 ? (
            <div className="py-12 text-center rounded-lg border border-dashed border-border">
              <p className="font-serif text-lg text-muted-foreground italic">No addresses saved</p>
              <p className="text-sm text-muted-foreground mt-1">Add a delivery address in your profile settings.</p>
            </div>
          ) : (
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
                      {addr.is_primary && <p className="text-xs text-muted-foreground mt-1">Primary address</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-light">Delivery details</h2>
            <p className="text-sm text-muted-foreground mt-1">Tell us when and any special instructions.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
              Requested delivery date
            </label>
            <input
              type="date"
              value={deliveryDate}
              min={minDate}
              max={maxDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none"
            />
            <p className="text-xs text-muted-foreground">Please allow 3–5 business days for delivery.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
              Special instructions <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any preferences for packaging, timing, or access instructions…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-light">Review your request</h2>
            <p className="text-sm text-muted-foreground mt-1">Confirm the details before submitting.</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              <div className="px-5 py-3.5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Items ({selectedItems.length})</p>
                <div className="space-y-1">
                  {selectedItems.map(item => (
                    <p key={item.id} className="text-sm">
                      {item.brand ? `${item.brand} — ` : ''}{item.name}
                    </p>
                  ))}
                </div>
              </div>

              {selectedAddress && (
                <div className="px-5 py-3.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Deliver to</p>
                  <p className="text-sm">{selectedAddress.label ?? ''}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state}
                  </p>
                </div>
              )}

              <div className="px-5 py-3.5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Requested delivery</p>
                <p className="text-sm">{format(new Date(deliveryDate), 'MMMM d, yyyy')}</p>
              </div>

              {notes && (
                <div className="px-5 py-3.5">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground italic">{notes}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Your concierge will confirm this request and provide an exact delivery window.
            </p>
          </div>
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

        {step < 3 ? (
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
            disabled={isPending}
            className="px-5 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Submitting…' : 'Submit request'}
          </button>
        )}
      </div>
    </div>
  )
}
