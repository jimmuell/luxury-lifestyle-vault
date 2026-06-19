'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createDocumentFromPdf } from '@/actions/admin-documents-pdf'

interface Category { id: string; key: string; label: string }
interface DocumentUploadFormProps { categories: Category[] }

const LABEL_CLASS = 'block text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] mb-1'
const INPUT_CLASS = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
const SELECT_CLASS = INPUT_CLASS

export function DocumentUploadForm({ categories }: DocumentUploadFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createDocumentFromPdf(formData)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Document created.')
        router.push(`/admin/documents/${result.id}/edit`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* File — full width */}
        <div className="md:col-span-2">
          <label className={LABEL_CLASS} htmlFor="file">PDF File</label>
          <input
            id="file"
            type="file"
            name="file"
            accept=".pdf,application/pdf"
            required
            className={INPUT_CLASS}
          />
        </div>

        {/* Title */}
        <div>
          <label className={LABEL_CLASS} htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            name="title"
            required
            className={INPUT_CLASS}
          />
        </div>

        {/* Category */}
        <div>
          <label className={LABEL_CLASS} htmlFor="category_id">Category</label>
          <select id="category_id" name="category_id" required className={SELECT_CLASS}>
            <option value="">Select…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Audience */}
        <div>
          <label className={LABEL_CLASS} htmlFor="audience">Audience</label>
          <select id="audience" name="audience" defaultValue="investor" className={SELECT_CLASS}>
            <option value="investor">Investor</option>
            <option value="prospect">Prospect</option>
            <option value="board">Board</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={LABEL_CLASS} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="draft" className={SELECT_CLASS}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className={LABEL_CLASS} htmlFor="sort_order">Sort Order</label>
          <input
            id="sort_order"
            type="number"
            name="sort_order"
            defaultValue={0}
            className={INPUT_CLASS}
          />
        </div>

        {/* Strip first page checkbox */}
        <div className="flex items-center gap-2 self-end pb-2">
          <input
            id="strip_first_page"
            type="checkbox"
            name="strip_first_page"
            value="1"
            className="h-4 w-4 rounded border border-border"
          />
          <label htmlFor="strip_first_page" className="text-sm text-muted-foreground">
            Remove first page (control page)
          </label>
        </div>

        {/* Google Drive Link — full width */}
        <div className="md:col-span-2">
          <label className={LABEL_CLASS} htmlFor="google_drive_link">Google Drive Link (optional)</label>
          <input
            id="google_drive_link"
            type="text"
            name="google_drive_link"
            placeholder="https://docs.google.com/… or file ID"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Uploading…' : 'Upload Document'}
        </button>
      </div>
    </form>
  )
}
