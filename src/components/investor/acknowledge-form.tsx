'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { acknowledgeNda } from '@/actions/investor'

export function AcknowledgeForm() {
  const [pending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [agreed, setAgreed] = useState(false)

  const canSubmit = fullName.trim().length > 0 && agreed && !pending

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await acknowledgeNda(formData)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="full_name" className="text-sm font-medium">
          Type your full name to acknowledge
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full legal name"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="agreed"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span className="text-sm text-muted-foreground">
          I have read and agree to the confidentiality terms above. I understand that my access is logged.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className={buttonVariants({ variant: 'default' }) + ' gap-2 disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        <ShieldCheck className="h-4 w-4" />
        {pending ? 'Recording acknowledgment…' : 'Enter Data Room'}
      </button>
    </form>
  )
}
