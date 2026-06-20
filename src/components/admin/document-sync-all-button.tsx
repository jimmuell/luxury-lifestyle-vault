'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { triggerSyncAll } from '@/actions/admin-documents-sync'

export function DocumentSyncAllButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await triggerSyncAll()
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Full sync queued — check back in a moment.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Queuing…' : 'Sync all'}
    </button>
  )
}
