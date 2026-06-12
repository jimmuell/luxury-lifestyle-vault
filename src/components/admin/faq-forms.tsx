'use client'

import { useTransition, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { createFaqEntry, updateFaqEntry, toggleFaqPublished, deleteFaqEntry } from '@/actions/admin-faq'

// ── Create Form ────────────────────────────────────────────────────────────────

export function CreateFaqForm() {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await createFaqEntry(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('FAQ entry created.')
          formRef.current?.reset()
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">Add FAQ Entry</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="create-question" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Question <span className="text-destructive">*</span>
          </label>
          <input
            id="create-question"
            name="question"
            type="text"
            required
            placeholder="What is the minimum investment?"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="create-answer" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Answer <span className="text-destructive">*</span>
          </label>
          <textarea
            id="create-answer"
            name="answer"
            rows={4}
            required
            placeholder="The minimum investment is…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="create-audience" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Audience
          </label>
          <select
            id="create-audience"
            name="audience"
            defaultValue="prospect"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="prospect">Prospect</option>
            <option value="investor">Investor</option>
            <option value="board">Board</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="create-sort-order" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Sort Order
          </label>
          <input
            id="create-sort-order"
            name="sort_order"
            type="number"
            defaultValue={0}
            min={0}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              name="is_published"
              value="true"
              className="rounded border-border"
            />
            Publish immediately
          </label>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create Entry'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Row Edit Form ──────────────────────────────────────────────────────────────

interface FaqRowActionsProps {
  id: string
  question: string
  answer: string
  audience: string
  sortOrder: number
  isPublished: boolean
}

export function FaqRowActions({
  id,
  question: questionProp,
  answer: answerProp,
  audience: audienceProp,
  sortOrder: sortOrderProp,
  isPublished: isPublishedProp,
}: FaqRowActionsProps) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  // Controlled state that resets when server revalidates (prop changes)
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

  function handleTogglePublish() {
    startTransition(async () => {
      try {
        const result = await toggleFaqPublished(id, !isPublished)
        if (result.error) {
          toast.error(result.error)
        } else {
          setIsPublished(!isPublished)
          toast.success(isPublished ? 'Entry unpublished.' : 'Entry published.')
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteFaqEntry(id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('FAQ entry deleted.')
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await updateFaqEntry(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('FAQ entry updated.')
          setEditing(false)
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleEditSubmit} className="space-y-2 min-w-[220px]">
        <input type="hidden" name="id" value={id} />
        <textarea
          name="question"
          defaultValue={questionProp}
          rows={2}
          required
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <textarea
          name="answer"
          defaultValue={answerProp}
          rows={3}
          required
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <div className="flex gap-2">
          <select
            name="audience"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="prospect">Prospect</option>
            <option value="investor">Investor</option>
            <option value="board">Board</option>
          </select>
          <input
            name="sort_order"
            type="number"
            defaultValue={sortOrderProp}
            min={0}
            className="w-16 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
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
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
      >
        Edit
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleTogglePublish}
        className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isPublished ? 'Unpublish' : 'Publish'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="rounded border border-destructive/30 bg-background px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label="Delete FAQ entry"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
