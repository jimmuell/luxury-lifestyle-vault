'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Link2, X } from 'lucide-react'
import { setDocumentDriveSource } from '@/actions/admin-documents-pdf'

interface DocumentDriveSourceFormProps {
  docId: string
  currentLink: string | null
}

export function DocumentDriveSourceForm({ docId, currentLink }: DocumentDriveSourceFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await setDocumentDriveSource(formData)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Drive source saved.')
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 rounded border px-3 py-1 text-xs transition-colors ${
          currentLink
            ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Link2 className="h-3 w-3" />
        {currentLink ? 'Drive ✓' : 'Set Drive'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 items-end w-52">
      <input type="hidden" name="id" value={docId} />
      <input
        name="google_drive_link"
        type="text"
        defaultValue={currentLink ?? ''}
        placeholder="docs.google.com/… or file ID"
        autoFocus
        className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <p className="text-[10px] text-muted-foreground/60 self-start">
        Paste the Google Docs URL or bare file ID.
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
