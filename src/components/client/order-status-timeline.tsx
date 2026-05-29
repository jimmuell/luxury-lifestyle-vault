import { format } from 'date-fns'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ORDER_STATUS_LABELS } from '@/types/app'
import type { OrderStatus, OrderStatusHistory } from '@/types/app'

interface OrderStatusTimelineProps {
  history: OrderStatusHistory[]
  currentStatus: OrderStatus
}

const STATUS_ORDER: OrderStatus[] = [
  'requested',
  'confirmed',
  'dispatched_to_provider',
  'in_preparation',
  'shipped',
  'delivered',
]

export function OrderStatusTimeline({ history, currentStatus }: OrderStatusTimelineProps) {
  const isCancelled = currentStatus === 'cancelled'
  const isReturn = currentStatus === 'return_initiated' || currentStatus === 'return_received'

  // Sorted history, newest last
  const sorted = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (isCancelled || isReturn) {
    return (
      <div className="space-y-3">
        {sorted.map((entry, i) => (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                entry.status === 'cancelled' ? 'border-destructive bg-destructive/10' : 'border-foreground bg-foreground',
              )}>
                <Check className="h-3 w-3 text-background" />
              </div>
              {i < sorted.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-4 min-w-0">
              <p className={cn('text-sm font-medium', entry.status === 'cancelled' && 'text-destructive')}>
                {ORDER_STATUS_LABELS[entry.status as OrderStatus]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(entry.created_at), 'MMM d, yyyy · h:mm a')}
              </p>
              {entry.notes && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed italic">{entry.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const completedStatuses = new Set(sorted.map(h => h.status))

  return (
    <div className="space-y-3">
      {STATUS_ORDER.map((status, i) => {
        const isComplete = completedStatuses.has(status)
        const isCurrent = status === currentStatus
        const historyEntry = sorted.find(h => h.status === status)

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                isComplete || isCurrent
                  ? 'border-foreground bg-foreground'
                  : 'border-border bg-background',
              )}>
                {isComplete || isCurrent
                  ? <Check className="h-3 w-3 text-background" />
                  : <Circle className="h-2.5 w-2.5 text-muted-foreground fill-muted-foreground/30" />
                }
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={cn('w-px flex-1 mt-1', isComplete ? 'bg-foreground/30' : 'bg-border')} />
              )}
            </div>
            <div className={cn('pb-4 min-w-0', !isComplete && !isCurrent && 'opacity-40')}>
              <p className={cn('text-sm', isCurrent ? 'font-semibold' : isComplete ? 'font-medium' : '')}>
                {ORDER_STATUS_LABELS[status]}
              </p>
              {historyEntry && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(historyEntry.created_at), 'MMM d, yyyy · h:mm a')}
                </p>
              )}
              {historyEntry?.notes && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed italic">{historyEntry.notes}</p>
              )}
              {isCurrent && !historyEntry && (
                <p className="text-xs text-muted-foreground mt-0.5">In progress</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
