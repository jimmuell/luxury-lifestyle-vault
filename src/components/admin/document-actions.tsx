'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Globe, GlobeLock, Archive, Trash2, AlertCircle } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  publishDocument,
  unpublishDocument,
  archiveDocument,
  deleteDocument,
} from '@/actions/admin-documents'

interface DocumentActionsProps {
  docId: string
  status: string
  sourceKind: string
  pdfPath: string | null
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-muted text-muted-foreground',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function DocumentActions({ docId, status, sourceKind, pdfPath }: DocumentActionsProps) {
  const [pending, startTransition] = useTransition()
  const confirm = useConfirm()
  const router  = useRouter()

  function run(action: () => Promise<{ error?: string; success?: boolean }>, successMsg: string) {
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) { toast.error(result.error); return }
        toast.success(successMsg)
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Permanently delete document?',
      body: 'This removes the document, all its versions, and the generated PDF. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return
    startTransition(async () => {
      try {
        const result = await deleteDocument(docId)
        if (result.error) { toast.error(result.error); return }
        toast.success('Document deleted.')
        router.push('/admin/documents')
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  const canPublish = status !== 'published'
    && (sourceKind === 'markdown' || (sourceKind === 'upload' && !!pdfPath))

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
        {status}
      </span>

      {canPublish && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => publishDocument(docId), 'Document published.')}
          className="flex items-center gap-1.5 rounded border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50 transition-colors disabled:opacity-50"
        >
          <Globe className="h-3.5 w-3.5" />
          Publish
        </button>
      )}

      {status === 'published' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unpublishDocument(docId), 'Document unpublished.')}
          className="flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <GlobeLock className="h-3.5 w-3.5" />
          Unpublish
        </button>
      )}

      {status !== 'archived' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => archiveDocument(docId), 'Document archived.')}
          className="flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Archive className="h-3.5 w-3.5" />
          Archive
        </button>
      )}

      {status === 'archived' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => unpublishDocument(docId), 'Document restored to draft.')}
          className="flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Restore to Draft
        </button>
      )}

      {sourceKind === 'markdown' && status !== 'published' && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
          <AlertCircle className="h-3 w-3" />
          PDF generated on publish (Phase 3)
        </span>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="ml-auto flex items-center gap-1.5 rounded border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label="Delete document"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  )
}
