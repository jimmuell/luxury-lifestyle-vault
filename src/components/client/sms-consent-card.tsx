'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateSmsConsent } from '@/actions/settings'
import { SMS_CONSENT_DISCLOSURE } from '@/lib/sms/consent'

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

interface SmsConsentCardProps {
  initialConsent: boolean
}

export function SmsConsentCard({ initialConsent }: SmsConsentCardProps) {
  const [enabled, setEnabled] = useState(initialConsent)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const result = await updateSmsConsent(next, 'settings')
      if ('error' in result) {
        setEnabled(!next)
        toast.error('Could not save SMS preference')
      } else {
        toast.success(next ? 'SMS updates enabled' : 'SMS updates disabled')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden mt-4">
      <div className="px-5 py-3 bg-muted/40 border-b border-border">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Text messages</span>
      </div>
      <div className="bg-card px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium">Text message updates</p>
            <p className="text-xs text-muted-foreground mt-0.5">Order and account updates sent by SMS</p>
          </div>
          <div className="flex-shrink-0">
            <Toggle checked={enabled} onChange={handleToggle} disabled={isPending} />
          </div>
        </div>
        {enabled && (
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
            {SMS_CONSENT_DISCLOSURE} Reply STOP at any time to opt out.
          </p>
        )}
      </div>
    </div>
  )
}
