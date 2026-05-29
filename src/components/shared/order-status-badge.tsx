import { ORDER_STATUS_LABELS } from '@/types/app'
import type { OrderStatus } from '@/types/app'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<OrderStatus, string> = {
  requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  dispatched_to_provider: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  in_preparation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  shipped: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  return_initiated: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  return_received: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        STATUS_COLORS[status]
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
