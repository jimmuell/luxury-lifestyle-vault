'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updatePreferredChannel, softDeleteAccount } from '@/actions/settings'

type Channel = 'email' | 'sms' | 'both'

interface AccountSettingsFormProps {
  preferredChannel: Channel
}

export function PreferredChannelForm({ preferredChannel }: AccountSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const CHANNELS: { value: Channel; label: string; description: string }[] = [
    { value: 'email', label: 'Email only', description: 'All updates sent to your email address' },
    { value: 'sms', label: 'SMS only', description: 'Text message alerts for key events' },
    { value: 'both', label: 'Email & SMS', description: 'Both channels for maximum visibility' },
  ]

  function handleChange(channel: Channel) {
    startTransition(async () => {
      try {
        await updatePreferredChannel(channel)
        toast.success('Communication preference saved')
        router.refresh()
      } catch {
        toast.error('Could not update preference')
      }
    })
  }

  return (
    <div className="space-y-2">
      {CHANNELS.map(ch => (
        <button
          key={ch.value}
          type="button"
          onClick={() => handleChange(ch.value)}
          disabled={isPending}
          className={`w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50 ${preferredChannel === ch.value ? 'border-foreground/40 bg-muted/30' : 'border-border hover:bg-muted/20'}`}
        >
          <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${preferredChannel === ch.value ? 'border-foreground' : 'border-border'}`}>
            {preferredChannel === ch.value && (
              <div className="h-2 w-2 rounded-full bg-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{ch.label}</p>
            <p className="text-xs text-muted-foreground">{ch.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

export function SignOutEverywhereButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSignOut() {
    if (!confirm('Sign out of all devices?')) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'global' })
      router.push('/auth/login')
    })
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
    >
      {isPending ? 'Signing out…' : 'Sign out everywhere'}
    </button>
  )
}

export function DeleteAccountButton() {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Close your account? Your wardrobe data will be preserved for 90 days before permanent deletion. This cannot be undone.')) return
    startTransition(async () => {
      try {
        await softDeleteAccount()
      } catch {
        toast.error('Could not close account — contact your concierge.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="px-4 py-2 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/5 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Processing…' : 'Close account'}
    </button>
  )
}
