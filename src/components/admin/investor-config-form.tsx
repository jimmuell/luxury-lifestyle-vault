'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateWelcomeConfig } from '@/actions/admin-investor-config'
import { DEFAULT_WELCOME_HEADING, DEFAULT_WELCOME_BODY } from '@/lib/investor/config'

interface InvestorConfigFormProps {
  welcomeHeading: string
  welcomeBody: string
}

export function InvestorConfigForm({ welcomeHeading, welcomeBody }: InvestorConfigFormProps) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await updateWelcomeConfig(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Welcome panel updated.')
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">Welcome Panel Copy</h2>
        <p className="text-xs text-muted-foreground mt-1">
          This text appears at the top of the investor overview page, between the greeting and the KPI strip.
          Changes take effect immediately — no deploy required.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="welcome-heading" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Heading <span className="text-destructive">*</span>
          </label>
          <input
            id="welcome-heading"
            name="welcome_heading"
            type="text"
            required
            defaultValue={welcomeHeading}
            placeholder={DEFAULT_WELCOME_HEADING}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="welcome-body" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Body <span className="text-destructive">*</span>
          </label>
          <textarea
            id="welcome-body"
            name="welcome_body"
            rows={5}
            required
            defaultValue={welcomeBody}
            placeholder={DEFAULT_WELCOME_BODY}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
