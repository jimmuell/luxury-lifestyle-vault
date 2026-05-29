'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateEmailNotificationPrefs, updateInAppNotificationPrefs } from '@/actions/settings'

const NOTIFICATION_TYPES = [
  { key: 'order_updates', label: 'Order updates', description: 'Status changes on your requests and rotations' },
  { key: 'delivery_notices', label: 'Delivery notices', description: 'Shipping confirmation and delivery alerts' },
  { key: 'payment', label: 'Payment receipts', description: 'Invoices and billing confirmations' },
  { key: 'seasonal_reminders', label: 'Seasonal reminders', description: 'Upcoming rotation window notifications' },
]

interface NotificationPrefsFormProps {
  emailPrefs: Record<string, boolean>
  inAppPrefs: Record<string, boolean>
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none disabled:opacity-50 ${checked ? 'bg-foreground' : 'bg-border'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-1'}`}
      />
    </button>
  )
}

export function NotificationPrefsForm({ emailPrefs, inAppPrefs }: NotificationPrefsFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleEmailToggle(key: string) {
    const next = { ...emailPrefs, [key]: !emailPrefs[key] }
    startTransition(async () => {
      try {
        await updateEmailNotificationPrefs(next)
        toast.success('Preferences saved')
      } catch {
        toast.error('Could not save preferences')
      }
    })
  }

  function handleInAppToggle(key: string) {
    const next = { ...inAppPrefs, [key]: !inAppPrefs[key] }
    startTransition(async () => {
      try {
        await updateInAppNotificationPrefs(next)
        toast.success('Preferences saved')
      } catch {
        toast.error('Could not save preferences')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-6 px-5 py-3 bg-muted/40 border-b border-border">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Notification</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest w-12 text-center">Email</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest w-12 text-center">In-app</span>
      </div>

      {/* Rows */}
      {NOTIFICATION_TYPES.map(({ key, label, description }) => (
        <div key={key} className="grid grid-cols-[1fr_auto_auto] gap-6 items-center px-5 py-4 border-b border-border last:border-0 bg-card">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <div className="w-12 flex justify-center">
            <Toggle
              checked={emailPrefs[key] ?? true}
              onChange={() => handleEmailToggle(key)}
              disabled={isPending}
            />
          </div>
          <div className="w-12 flex justify-center">
            <Toggle
              checked={inAppPrefs[key] ?? true}
              onChange={() => handleInAppToggle(key)}
              disabled={isPending}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
