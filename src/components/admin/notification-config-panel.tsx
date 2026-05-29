'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateNotificationTemplateConfig, sendAdminBroadcast } from '@/actions/notification-config'

interface TemplateConfig {
  template_key: string
  label: string
  email_enabled: boolean
  in_app_enabled: boolean
  sms_enabled: boolean
}

interface ServiceTier {
  id: string
  name: string
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
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  )
}

export function NotificationConfigPanel({ templates }: { templates: TemplateConfig[]; tiers: ServiceTier[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle(key: string, field: 'email_enabled' | 'in_app_enabled' | 'sms_enabled', current: boolean) {
    startTransition(async () => {
      try {
        await updateNotificationTemplateConfig(key, { [field]: !current })
        toast.success('Configuration saved')
        router.refresh()
      } catch {
        toast.error('Could not save')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-6 px-5 py-3 bg-muted/40 border-b border-border">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Template</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest w-12 text-center">Email</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest w-12 text-center">In-app</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest w-12 text-center">SMS</span>
      </div>
      {templates.map(t => (
        <div key={t.template_key} className="grid grid-cols-[1fr_auto_auto_auto] gap-6 items-center px-5 py-3.5 border-b border-border last:border-0 bg-card">
          <span className="text-sm">{t.label}</span>
          <div className="w-12 flex justify-center">
            <Toggle checked={t.email_enabled} onChange={() => handleToggle(t.template_key, 'email_enabled', t.email_enabled)} disabled={isPending} />
          </div>
          <div className="w-12 flex justify-center">
            <Toggle checked={t.in_app_enabled} onChange={() => handleToggle(t.template_key, 'in_app_enabled', t.in_app_enabled)} disabled={isPending} />
          </div>
          <div className="w-12 flex justify-center">
            <Toggle checked={t.sms_enabled} onChange={() => handleToggle(t.template_key, 'sms_enabled', t.sms_enabled)} disabled={isPending} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BroadcastForm({ tiers }: { tiers: ServiceTier[] }) {
  const [isPending, startTransition] = useTransition()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState<'email' | 'in_app' | 'both'>('in_app')
  const [target, setTarget] = useState<'all' | 'tier' | 'founding_members'>('all')
  const [targetTierId, setTargetTierId] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body required')
      return
    }
    startTransition(async () => {
      try {
        const result = await sendAdminBroadcast({
          subject, body, channel, target,
          targetTierId: target === 'tier' ? targetTierId : null,
        })
        toast.success(`Broadcast sent to ${result.recipientCount} client${result.recipientCount !== 1 ? 's' : ''}`)
        setSubject('')
        setBody('')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to send broadcast')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-widest">Subject</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Broadcast subject…"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground uppercase tracking-widest">Message</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Message body…"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Channel</label>
          <select value={channel} onChange={e => setChannel(e.target.value as 'email' | 'in_app' | 'both')}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background">
            <option value="in_app">In-app only</option>
            <option value="email">Email only</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Recipients</label>
          <select value={target} onChange={e => setTarget(e.target.value as 'all' | 'tier' | 'founding_members')}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background">
            <option value="all">All clients</option>
            <option value="founding_members">Founding members</option>
            <option value="tier">Specific tier</option>
          </select>
        </div>
      </div>
      {target === 'tier' && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-widest">Tier</label>
          <select value={targetTierId} onChange={e => setTargetTierId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background">
            <option value="">Select tier…</option>
            {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Sending…' : 'Send broadcast'}
      </button>
    </form>
  )
}
