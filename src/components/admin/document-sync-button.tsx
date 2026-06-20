'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { triggerDocumentSync } from '@/actions/admin-documents-sync'

interface DocumentSyncButtonProps {
  docId: string
  syncStatus: string | null
  syncEnabled: boolean
}

export function DocumentSyncButton({ docId, syncStatus, syncEnabled }: DocumentSyncButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await triggerDocumentSync(formData)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Sync queued.')
        router.refresh()
      }
    })
  }

  const isSyncing = syncStatus === 'syncing' || isPending
  const isDisabled = isSyncing || !syncEnabled

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={docId} />
      <button
        type="submit"
        disabled={isDisabled}
        className={`flex items-center gap-1 rounded border px-3 py-1 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isSyncing
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing…' : 'Sync'}
      </button>
    </form>
  )
}
