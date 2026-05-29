import type { ItemStatus } from '@/types/app'
import { ITEM_STATUS_LABELS } from '@/types/app'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<ItemStatus, string> = {
  intake_pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_cleaning: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cleaning_complete: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  stored: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  delivery_scheduled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_COLORS[status]
      )}
    >
      {ITEM_STATUS_LABELS[status]}
    </span>
  )
}
