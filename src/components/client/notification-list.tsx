'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { markNotificationRead, markAllNotificationsRead } from '@/actions/notifications'
import { cn } from '@/lib/utils'
import { Bell, ShoppingBag, CreditCard, MessageSquare, Package, Info } from 'lucide-react'

type Notification = {
  id: string
  type: string
  title: string
  snippet: string | null
  link_target: string | null
  read_at: string | null
  created_at: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  order_confirmed: ShoppingBag,
  order_status_changed: Package,
  payment_succeeded: CreditCard,
  payment_failed: CreditCard,
  concierge_reply: MessageSquare,
  provider_assignment_declined: Bell,
  system: Info,
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const isUnread = !notification.read_at
  const Icon = TYPE_ICON[notification.type] ?? Bell

  const content = (
    <div
      className={cn(
        'flex items-start gap-3.5 px-5 py-4 transition-colors',
        isUnread ? 'bg-accent/5' : 'bg-card',
        notification.link_target ? 'hover:bg-muted/40 cursor-pointer' : ''
      )}
      onClick={() => { if (isUnread) onRead(notification.id) }}
    >
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUnread ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', isUnread && 'font-medium')}>{notification.title}</p>
        {notification.snippet && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.snippet}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
      {isUnread && <div className="w-2 h-2 rounded-full bg-foreground flex-shrink-0 mt-2" />}
    </div>
  )

  if (notification.link_target) {
    return (
      <Link href={notification.link_target} className="block">
        {content}
      </Link>
    )
  }
  return content
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications)
  const [, startTransition] = useTransition()

  function handleRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    startTransition(async () => { await markNotificationRead(id) })
  }

  function handleMarkAll() {
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    startTransition(async () => { await markAllNotificationsRead() })
  }

  const unreadCount = items.filter(n => !n.read_at).length

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-lg text-muted-foreground italic">Nothing to see here yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Notifications from your concierge and orders appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          <button
            onClick={handleMarkAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Mark all read
          </button>
        </div>
      )}
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {items.map(n => (
          <NotificationItem key={n.id} notification={n} onRead={handleRead} />
        ))}
      </div>
    </div>
  )
}
