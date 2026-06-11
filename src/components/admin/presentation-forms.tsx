'use client'

import { useTransition, useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadInvestorPresentation, updatePresentation } from '@/actions/admin-presentations'

// ── Upload Form ────────────────────────────────────────────────────────────────

export function UploadPresentationForm() {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await uploadInvestorPresentation(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Presentation uploaded.')
          formRef.current?.reset()
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">Upload Presentation</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="title" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Q3 2026 Investor Update"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="audience" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Audience
          </label>
          <select
            id="audience"
            name="audience"
            defaultValue="board"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="prospect">Prospect</option>
            <option value="board">Board</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Optional description…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="sort_order" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Sort Order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={0}
            min={0}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="file" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            PDF File <span className="text-destructive">*</span>
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs file:font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {pending ? 'Uploading…' : 'Upload Presentation'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Row Update Form ────────────────────────────────────────────────────────────

interface UpdatePresentationRowProps {
  id: string
  audience: string
  isPublished: boolean
}

export function UpdatePresentationRow({ id, audience: audienceProp, isPublished: isPublishedProp }: UpdatePresentationRowProps) {
  const [pending, startTransition] = useTransition()

  // Controlled state — track the last-seen prop value alongside the local state so we
  // can reset to the server-revalidated value when the parent re-renders with new props
  // (canonical React "getDerivedStateFromProps" pattern for function components).
  const [prevAudienceProp, setPrevAudienceProp] = useState(audienceProp)
  const [prevIsPublishedProp, setPrevIsPublishedProp] = useState(isPublishedProp)
  const [audience, setAudience] = useState(audienceProp)
  const [isPublished, setIsPublished] = useState(isPublishedProp)

  if (prevAudienceProp !== audienceProp) {
    setPrevAudienceProp(audienceProp)
    setAudience(audienceProp)
  }
  if (prevIsPublishedProp !== isPublishedProp) {
    setPrevIsPublishedProp(isPublishedProp)
    setIsPublished(isPublishedProp)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await updatePresentation(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Presentation updated.')
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="audience"
        value={audience}
        onChange={e => setAudience(e.target.value)}
        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="prospect">Prospect</option>
        <option value="board">Board</option>
      </select>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          name="is_published"
          value="true"
          checked={isPublished}
          onChange={e => setIsPublished(e.target.checked)}
          className="rounded border-border"
        />
        Published
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
