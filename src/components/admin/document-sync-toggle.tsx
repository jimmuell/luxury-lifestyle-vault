'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Play, PauseCircle } from 'lucide-react'
import { updateSyncEnabled } from '@/actions/admin-documents-sync'

interface DocumentSyncToggleProps {
  docId: string
  syncEnabled: boolean
}

export function DocumentSyncToggle({ docId, syncEnabled }: DocumentSyncToggleProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await updateSyncEnabled(docId, !syncEnabled)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(syncEnabled ? 'Sync paused.' : 'Sync re-enabled.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={syncEnabled ? 'Pause sync for this document' : 'Re-enable sync for this document'}
      className="flex items-center gap-1 rounded border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50"
    >
      {syncEnabled
        ? <PauseCircle className="h-3 w-3" />
        : <Play className="h-3 w-3" />}
      {syncEnabled ? 'Pause' : 'Resume'}
    </button>
  )
}
