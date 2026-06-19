'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { replaceDocumentPdf } from '@/actions/admin-documents-pdf'

interface DocumentReplaceFormProps { docId: string }

const LABEL_CLASS = 'block text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] mb-1'
const INPUT_CLASS = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

export function DocumentReplaceForm({ docId }: DocumentReplaceFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await replaceDocumentPdf(formData)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('PDF replaced.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium mb-4">
        Replace PDF
      </h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        <input type="hidden" name="id" value={docId} />

        <div>
          <label className={LABEL_CLASS} htmlFor="replace-file">New PDF</label>
          <input
            id="replace-file"
            type="file"
            name="file"
            accept=".pdf,application/pdf"
            required
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="replace-strip-first"
            type="checkbox"
            name="strip_first_page"
            value="1"
            className="h-4 w-4 rounded border border-border"
          />
          <label htmlFor="replace-strip-first" className="text-sm text-muted-foreground">
            Remove first page (control page)
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Replacing…' : 'Replace PDF'}
          </button>
        </div>
      </form>
    </div>
  )
}
