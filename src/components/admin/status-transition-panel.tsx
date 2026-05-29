'use client'

import { useState, useTransition } from 'react'
import { adminUpdateItemStatus } from '@/actions/items'
import { adminAddCondition } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ItemStatus, ConditionLevel } from '@/types/app'
import { ITEM_STATUS_LABELS, ITEM_STATUS_TRANSITIONS, CONDITION_LEVEL_LABELS } from '@/types/app'

// Transitions that require a condition record
const CONDITION_REQUIRED: Partial<Record<ItemStatus, string>> = {
  received: 'Document condition at intake',
  cleaning_complete: 'Document post-cleaning condition',
  delivered: 'Document condition at delivery',
  damaged: 'Describe the damage',
}

const CONDITION_LEVELS: ConditionLevel[] = ['pristine', 'excellent', 'good', 'fair', 'poor']

interface StatusTransitionPanelProps {
  itemId: string
  currentStatus: ItemStatus
}

export function StatusTransitionPanel({ itemId, currentStatus }: StatusTransitionPanelProps) {
  const [pending, startTransition] = useTransition()
  const [pendingStatus, setPendingStatus] = useState<ItemStatus | null>(null)
  const [conditionLevel, setConditionLevel] = useState<ConditionLevel>('good')
  const [conditionNotes, setConditionNotes] = useState('')

  const validTransitions = ITEM_STATUS_TRANSITIONS[currentStatus] ?? []

  function handleTransitionClick(next: ItemStatus) {
    if (CONDITION_REQUIRED[next]) {
      setPendingStatus(next)
      setConditionLevel('good')
      setConditionNotes('')
    } else {
      commitTransition(next, null)
    }
  }

  function commitTransition(next: ItemStatus, condition: { level: ConditionLevel; notes: string } | null) {
    startTransition(async () => {
      const statusResult = await adminUpdateItemStatus(itemId, next)
      if (statusResult && 'error' in statusResult) {
        toast.error(statusResult.error)
        return
      }

      if (condition) {
        const condResult = await adminAddCondition({
          itemId,
          conditionLevel: condition.level,
          notes: condition.notes || undefined,
        })
        if (condResult && 'error' in condResult) {
          toast.error(`Status updated but condition log failed: ${condResult.error}`)
          return
        }
      }

      toast.success(`Status → ${ITEM_STATUS_LABELS[next]}`)
      setPendingStatus(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Status</p>
        <StatusBadge status={currentStatus} />
      </div>

      {validTransitions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Transition to:</p>
          <div className="flex flex-wrap gap-2">
            {validTransitions.map(next => (
              <Button
                key={next}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTransitionClick(next)}
                disabled={pending || pendingStatus !== null}
                className={cn(
                  next === 'damaged' || next === 'lost'
                    ? 'border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60'
                    : ''
                )}
              >
                {ITEM_STATUS_LABELS[next]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Condition capture form */}
      {pendingStatus && CONDITION_REQUIRED[pendingStatus] && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <div>
            <p className="text-sm font-medium">{CONDITION_REQUIRED[pendingStatus]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Required before transitioning to {ITEM_STATUS_LABELS[pendingStatus]}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Condition</Label>
            <div className="flex gap-2 flex-wrap">
              {CONDITION_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setConditionLevel(lvl)}
                  className={cn(
                    'px-3 py-1.5 rounded-md border text-xs transition-colors',
                    conditionLevel === lvl
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground/40'
                  )}
                >
                  {CONDITION_LEVEL_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition-notes" className="text-xs">Notes</Label>
            <Textarea
              id="condition-notes"
              value={conditionNotes}
              onChange={e => setConditionNotes(e.target.value)}
              placeholder={pendingStatus === 'damaged' ? 'Describe the damage in detail…' : 'Observations, issues noted, care recommendations…'}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingStatus(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => commitTransition(pendingStatus, { level: conditionLevel, notes: conditionNotes })}
              disabled={pending}
            >
              {pending ? 'Saving…' : `Confirm → ${ITEM_STATUS_LABELS[pendingStatus]}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
