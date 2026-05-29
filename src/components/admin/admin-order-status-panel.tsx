'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { adminTransitionOrderStatus, adminAssignProvider, adminUpdateOrderNotes, adminRefundOrder, adminMarkReturnReceived } from '@/actions/orders'
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS } from '@/types/app'
import type { OrderStatus } from '@/types/app'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { DispatchModal } from './dispatch-modal'

interface Provider {
  id: string
  business_name: string
}

interface AdminOrderStatusPanelProps {
  orderId: string
  currentStatus: OrderStatus
  currentProviderId: string | null
  currentAdminNotes: string | null
  providers: Provider[]
  requestedDeliveryDate?: string | null
  orderType?: string
  paidAt?: string | null
  refundedAt?: string | null
  stripeInvoiceId?: string | null
}

export function AdminOrderStatusPanel({
  orderId,
  currentStatus,
  currentProviderId,
  currentAdminNotes,
  providers,
  requestedDeliveryDate,
  orderType,
  paidAt,
  refundedAt,
  stripeInvoiceId,
}: AdminOrderStatusPanelProps) {
  const [transitionNotes, setTransitionNotes] = useState('')
  const [confirmedDeliveryDate, setConfirmedDeliveryDate] = useState(
    format(addDays(new Date(), 3), 'yyyy-MM-dd')
  )
  const [selectedProviderId, setSelectedProviderId] = useState(currentProviderId ?? '')
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isProviderPending, startProviderTransition] = useTransition()
  const [isNotesPending, startNotesTransition] = useTransition()
  const [isRefundPending, startRefundTransition] = useTransition()
  const [isReturnPending, startReturnTransition] = useTransition()
  const router = useRouter()

  const validTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] ?? []

  function handleTransition(toStatus: OrderStatus) {
    startTransition(async () => {
      try {
        await adminTransitionOrderStatus({
          orderId,
          toStatus,
          notes: transitionNotes || undefined,
          confirmedDeliveryDate: toStatus === 'confirmed' ? confirmedDeliveryDate : undefined,
        })
        toast.success(`Status updated to ${ORDER_STATUS_LABELS[toStatus]}`)
        setTransitionNotes('')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update status')
      }
    })
  }

  function handleProviderSave() {
    startProviderTransition(async () => {
      try {
        await adminAssignProvider(orderId, selectedProviderId || null)
        toast.success('Provider updated')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to update provider')
      }
    })
  }

  function handleRefund() {
    if (!window.confirm('Issue a full refund for this order? This cannot be undone.')) return
    startRefundTransition(async () => {
      try {
        await adminRefundOrder(orderId)
        toast.success('Refund issued')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Refund failed')
      }
    })
  }

  function handleMarkReturnReceived() {
    if (!window.confirm('Mark this return as received? Item locations will be reset to intake.')) return
    startReturnTransition(async () => {
      try {
        await adminMarkReturnReceived(orderId)
        toast.success('Return received — items reset to intake')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not mark return received')
      }
    })
  }

  function handleNotesSave() {
    startNotesTransition(async () => {
      try {
        await adminUpdateOrderNotes(orderId, adminNotes)
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to save notes')
      }
    })
  }

  return (
    <div className="space-y-6">
      {showDispatchModal && (
        <DispatchModal
          orderId={orderId}
          providers={providers}
          requestedDeliveryDate={requestedDeliveryDate ?? null}
          onClose={() => setShowDispatchModal(false)}
        />
      )}

      {/* Status transitions */}
      {validTransitions.length > 0 && (
        <div className="space-y-3 p-5 rounded-lg border border-border">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
            Advance status
          </p>

          {validTransitions.includes('confirmed') && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Confirmed delivery date</label>
              <input
                type="date"
                value={confirmedDeliveryDate}
                onChange={e => setConfirmedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Notes (optional)</label>
            <textarea
              value={transitionNotes}
              onChange={e => setTransitionNotes(e.target.value)}
              placeholder="Add a note for the status history…"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {validTransitions.map(status => (
              <button
                key={status}
                onClick={() => handleTransition(status)}
                disabled={isPending}
                className={cn(
                  'px-4 py-2 text-xs rounded-md border transition-colors disabled:opacity-50',
                  status === 'cancelled'
                    ? 'border-destructive text-destructive hover:bg-destructive/5'
                    : 'border-foreground bg-foreground text-background hover:bg-foreground/90'
                )}
              >
                {ORDER_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Provider assignment */}
      <div className="space-y-3 p-5 rounded-lg border border-border">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
          Provider
        </p>

        {currentStatus === 'confirmed' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Dispatch to a provider to begin preparation. They will be notified immediately.
            </p>
            <button
              onClick={() => setShowDispatchModal(true)}
              disabled={providers.length === 0}
              className="w-full px-4 py-2.5 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              Dispatch to provider
            </button>
            {providers.length === 0 && (
              <p className="text-xs text-muted-foreground">No active providers available.</p>
            )}
          </div>
        ) : currentProviderId ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {providers.find(p => p.id === currentProviderId)?.business_name ?? 'Assigned provider'}
            </p>
            {['dispatched_to_provider', 'in_preparation'].includes(currentStatus) && (
              <div className="flex gap-2">
                <select
                  value={selectedProviderId}
                  onChange={e => setSelectedProviderId(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="">Unassigned</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.business_name}</option>
                  ))}
                </select>
                <button
                  onClick={handleProviderSave}
                  disabled={isProviderPending}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Reassign
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {currentStatus === 'requested'
              ? 'Confirm the order first, then dispatch to a provider.'
              : 'No provider assigned.'}
          </p>
        )}
      </div>

      {/* Billing — shown for delivered on-demand orders */}
      {orderType === 'on_demand_item' && currentStatus === 'delivered' && (
        <div className="space-y-3 p-5 rounded-lg border border-border">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">Billing</p>
          {paidAt ? (
            <div className="space-y-2">
              <p className="text-sm text-emerald-700">
                Charged {format(new Date(paidAt), 'MMM d, yyyy')}
                {stripeInvoiceId && <span className="text-xs text-muted-foreground ml-1.5 font-mono">{stripeInvoiceId.slice(0, 18)}…</span>}
              </p>
              {refundedAt ? (
                <p className="text-xs text-muted-foreground">Refunded {format(new Date(refundedAt), 'MMM d, yyyy')}</p>
              ) : (
                <button
                  onClick={handleRefund}
                  disabled={isRefundPending}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {isRefundPending ? 'Processing…' : 'Issue refund'}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Billing pending — Inngest will charge automatically.</p>
          )}
        </div>
      )}

      {/* Return receipt — shown when return is in flight */}
      {currentStatus === 'return_initiated' && (
        <div className="space-y-3 p-5 rounded-lg border border-border">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">Return</p>
          <p className="text-sm text-muted-foreground">
            Client has initiated a return. Once items are back at the vault, mark as received.
          </p>
          <button
            onClick={handleMarkReturnReceived}
            disabled={isReturnPending}
            className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isReturnPending ? 'Processing…' : 'Mark return received'}
          </button>
        </div>
      )}

      {/* Admin notes */}
      <div className="space-y-3 p-5 rounded-lg border border-border">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
          Admin notes
        </p>
        <textarea
          value={adminNotes}
          onChange={e => { setAdminNotes(e.target.value); setNotesSaved(false) }}
          placeholder="Internal notes visible only to admins…"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
        />
        <div className="flex items-center justify-between">
          {notesSaved && <p className="text-xs text-muted-foreground">Saved</p>}
          <div className="ml-auto">
            <button
              onClick={handleNotesSave}
              disabled={isNotesPending}
              className="px-4 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isNotesPending ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
