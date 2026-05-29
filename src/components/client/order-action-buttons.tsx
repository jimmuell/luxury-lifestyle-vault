'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { clientCancelOrder, clientInitiateReturn } from '@/actions/orders'

interface OrderActionButtonsProps {
  orderId: string
  canCancel: boolean
  canReturn: boolean
}

export function OrderActionButtons({ orderId, canCancel, canReturn }: OrderActionButtonsProps) {
  const [cancelPending, startCancel] = useTransition()
  const [returnPending, startReturn] = useTransition()
  const router = useRouter()

  function handleCancel() {
    if (!confirm('Cancel this order? This cannot be undone.')) return
    startCancel(async () => {
      try {
        await clientCancelOrder(orderId)
        toast.success('Order cancelled')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not cancel order')
      }
    })
  }

  function handleReturn() {
    if (!confirm('Initiate a return for this order?')) return
    startReturn(async () => {
      try {
        await clientInitiateReturn(orderId)
        toast.success('Return initiated — your concierge will be in touch')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not initiate return')
      }
    })
  }

  if (!canCancel && !canReturn) return null

  return (
    <div className="flex gap-3">
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={cancelPending}
          className="px-4 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          {cancelPending ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
      {canReturn && (
        <button
          onClick={handleReturn}
          disabled={returnPending}
          className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
        >
          {returnPending ? 'Processing…' : 'Initiate return'}
        </button>
      )}
    </div>
  )
}
