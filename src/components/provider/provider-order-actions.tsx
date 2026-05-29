'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { acceptAssignment, declineAssignment } from '@/actions/provider'
import { Check, X } from 'lucide-react'

export function ProviderOrderActions({
  assignmentId,
}: {
  assignmentId: string
  orderId: string
}) {
  const router = useRouter()
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [, startTransition] = useTransition()
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)

  function handleAccept() {
    setAccepting(true)
    startTransition(async () => {
      try {
        await acceptAssignment(assignmentId)
        toast.success('Assignment accepted')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to accept')
        setAccepting(false)
      }
    })
  }

  function handleDecline() {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }
    setDeclining(true)
    startTransition(async () => {
      try {
        await declineAssignment(assignmentId, declineReason.trim())
        toast.success('Assignment declined')
        router.push('/provider')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to decline')
        setDeclining(false)
      }
    })
  }

  return (
    <div className="rounded-lg border border-border p-5 space-y-4">
      <p className="text-sm font-medium">Respond to this assignment</p>
      <p className="text-sm text-muted-foreground">
        Please confirm whether you can accept this order. If you need to decline, provide a reason so LLV can reassign promptly.
      </p>

      {!showDecline ? (
        <div className="flex items-center gap-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {accepting ? 'Accepting…' : 'Accept assignment'}
          </button>
          <button
            onClick={() => setShowDecline(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (required — e.g., capacity, timeline, specialty)…"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring focus:border-ring outline-none resize-none"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecline}
              disabled={declining || !declineReason.trim()}
              className="px-4 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/5 transition-colors disabled:opacity-40"
            >
              {declining ? 'Declining…' : 'Confirm decline'}
            </button>
            <button
              onClick={() => setShowDecline(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
