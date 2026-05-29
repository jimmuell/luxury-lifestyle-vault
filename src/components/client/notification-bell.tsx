'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Bell, ShoppingBag, CreditCard, MessageSquare, Package, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { markNotificationRead } from '@/actions/notifications'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

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

export function NotificationBell({
  initialNotifications,
  profileId,
}: {
  initialNotifications: Notification[]
  profileId: string
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read_at).length

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_profile_id=eq.${profileId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profileId])

  function handleRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    markNotificationRead(id)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative p-2 rounded-md hover:bg-muted transition-colors">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="font-serif text-lg">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 italic font-serif">
              Nothing new yet.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {notifications.slice(0, 10).map(n => {
                const Icon = TYPE_ICON[n.type] ?? Bell
                const isUnread = !n.read_at

                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      isUnread ? 'bg-accent/5' : 'bg-card hover:bg-muted/40'
                    )}
                    onClick={() => { if (isUnread) handleRead(n.id); setOpen(false) }}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      isUnread ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs', isUnread && 'font-medium')}>{n.title}</p>
                      {n.snippet && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.snippet}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )

                return n.link_target ? (
                  <Link key={n.id} href={n.link_target}>{content}</Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })}
            </div>
          )}

          <Link
            href="/client/notifications"
            className="block text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
