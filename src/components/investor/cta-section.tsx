'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { ExternalLink, Mail, Bell } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { logCtaInteraction } from '@/actions/investor-cta'
import type { Database } from '@/types/database'

type InvestorCta = Database['public']['Tables']['investor_ctas']['Row']

interface CtaSectionProps {
  ctas: InvestorCta[]
}

function UrlCta({ cta }: { cta: InvestorCta }) {
  const [, startTransition] = useTransition()

  const safeHref = (() => {
    try {
      const u = new URL(cta.action_value)
      return u.protocol === 'https:' || u.protocol === 'http:' ? cta.action_value : '#'
    } catch {
      return '#'
    }
  })()

  function handleClick() {
    startTransition(async () => {
      await logCtaInteraction(cta.id)
    })
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={buttonVariants({ variant: 'outline' })}
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      {cta.label}
    </a>
  )
}

function EmailCta({ cta }: { cta: InvestorCta }) {
  const [, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await logCtaInteraction(cta.id)
    })
  }

  return (
    <a
      href={`mailto:${cta.action_value}`}
      onClick={handleClick}
      className={buttonVariants({ variant: 'outline' })}
    >
      <Mail className="h-4 w-4 mr-2" />
      {cta.label}
    </a>
  )
}

function LogCta({ cta }: { cta: InvestorCta }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await logCtaInteraction(cta.id)
      if ('error' in result) {
        toast.error('Something went wrong. Please try again.')
      } else {
        toast.success('Your interest has been noted.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={buttonVariants({ variant: 'outline' })}
    >
      <Bell className="h-4 w-4 mr-2" />
      {cta.label}
    </button>
  )
}

export function CtaSection({ ctas }: CtaSectionProps) {
  if (ctas.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Next steps</h2>
      <div className="flex flex-wrap gap-3">
        {ctas.map(cta => {
          if (cta.action_type === 'url') return <UrlCta key={cta.id} cta={cta} />
          if (cta.action_type === 'email') return <EmailCta key={cta.id} cta={cta} />
          return <LogCta key={cta.id} cta={cta} />
        })}
      </div>
    </div>
  )
}
