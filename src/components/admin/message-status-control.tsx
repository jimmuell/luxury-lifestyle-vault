'use client'

import { useState, useTransition } from 'react'
import { adminUpdateMessageStatus } from '@/actions/concierge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { ConciergeMessage } from '@/types/app'
import { cn } from '@/lib/utils'

const TRANSITIONS: Record<ConciergeMessage['status'], ConciergeMessage['status'][]> = {
  open: ['in_progress', 'resolved'],
  in_progress: ['resolved', 'open'],
  resolved: ['open'],
}

const TRANSITION_LABELS: Record<ConciergeMessage['status'], string> = {
  open: 'Mark Open',
  in_progress: 'Mark In Progress',
  resolved: 'Mark Resolved',
}

export function MessageStatusControl({ message }: { message: ConciergeMessage }) {
  const [notes, setNotes] = useState(message.admin_notes ?? '')
  const [showNotes, setShowNotes] = useState(false)
  const [pending, startTransition] = useTransition()

  function transition(status: ConciergeMessage['status']) {
    startTransition(async () => {
      const result = await adminUpdateMessageStatus(message.id, status, notes || undefined)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Message marked as ${status.replace('_', ' ')}.`)
      }
    })
  }

  const nextStatuses = TRANSITIONS[message.status]

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {showNotes && (
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Internal note (not visible to client)…"
          rows={2}
          className="text-sm"
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowNotes(v => !v)}
          className="text-muted-foreground"
        >
          {showNotes ? 'Hide note' : 'Add note'}
        </Button>
        <div className="flex-1" />
        {nextStatuses.map(s => (
          <Button
            key={s}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => transition(s)}
            disabled={pending}
            className={cn(
              s === 'resolved' && 'border-green-600/40 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30'
            )}
          >
            {TRANSITION_LABELS[s]}
          </Button>
        ))}
      </div>
    </div>
  )
}
