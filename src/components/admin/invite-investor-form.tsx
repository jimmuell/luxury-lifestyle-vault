'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { inviteInvestor } from '@/actions/admin-investors'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function InviteInvestorForm() {
  const [pending, startTransition] = useTransition()
  const [credential, setCredential] = useState<{ email: string; tempPassword: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await inviteInvestor(formData)
      if (result.error) {
        toast.error(result.error)
      } else if (result.success) {
        toast.success(`Investor account created for ${result.email}`)
        setCredential({ email: result.email!, tempPassword: result.tempPassword! })
        form.reset()
      }
    })
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <label htmlFor="inv-email" className="text-xs text-muted-foreground font-medium">Email</label>
          <input
            id="inv-email"
            name="email"
            type="email"
            required
            placeholder="investor@example.com"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="inv-name" className="text-xs text-muted-foreground font-medium">Full name</label>
          <input
            id="inv-name"
            name="full_name"
            type="text"
            required
            placeholder="Jane Smith"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-2 disabled:opacity-50')}
        >
          <UserPlus className="h-4 w-4" />
          {pending ? 'Creating…' : 'Invite investor'}
        </button>
      </form>

      {credential && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 text-sm space-y-1">
          <p className="font-medium text-amber-900 dark:text-amber-200">Temporary credentials — relay to investor out-of-band</p>
          <p className="text-amber-800 dark:text-amber-300 font-mono text-xs">Email: {credential.email}</p>
          <p className="text-amber-800 dark:text-amber-300 font-mono text-xs">Password: {credential.tempPassword}</p>
          <button
            onClick={() => setCredential(null)}
            className="text-xs text-amber-600 dark:text-amber-400 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
