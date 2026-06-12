'use client'

import { useTransition, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { createUpdate, updateUpdate, toggleUpdatePublished, deleteUpdate } from '@/actions/admin-updates'

// ── Create Form ────────────────────────────────────────────────────────────────

export function CreateUpdateForm() {
  const [pending, startTransition] = useTransition()
  const [publishNow, setPublishNow] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await createUpdate(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Update created.')
          formRef.current?.reset()
          setPublishNow(false)
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">New Update</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="create-title" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="create-title"
            name="title"
            type="text"
            required
            placeholder="Q2 2026 Investor Update"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="create-body" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Body <span className="text-destructive">*</span>
          </label>
          <textarea
            id="create-body"
            name="body"
            rows={6}
            required
            placeholder="Share your update with investors…"
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

        <div className="space-y-3 flex flex-col justify-end">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              name="is_published"
              value="true"
              checked={publishNow}
              onChange={e => setPublishNow(e.target.checked)}
              className="rounded border-border"
            />
            Publish immediately
          </label>
          <label className={`flex items-center gap-2 text-sm cursor-pointer ${publishNow ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
            <input
              type="checkbox"
              name="notify"
              value="true"
              disabled={!publishNow}
              className="rounded border-border disabled:opacity-50"
            />
            Notify investors
          </label>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create Update'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Row Edit Form ──────────────────────────────────────────────────────────────

interface UpdateRowActionsProps {
  id: string
  title: string
  body: string
  audience: string
  isPublished: boolean
}

export function UpdateRowActions({
  id,
  title: titleProp,
  body: bodyProp,
  audience: audienceProp,
  isPublished: isPublishedProp,
}: UpdateRowActionsProps) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const confirm = useConfirm()
  const [notifyOnPublish, setNotifyOnPublish] = useState(false)

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

  function openEditor() {
    setAudience(audienceProp)
    setIsPublished(isPublishedProp)
    setEditing(true)
  }

  function closeEditor() {
    setAudience(audienceProp)
    setIsPublished(isPublishedProp)
    setEditing(false)
  }

  function handleTogglePublish() {
    const nextPublished = !isPublished
    startTransition(async () => {
      try {
        const result = await toggleUpdatePublished(id, nextPublished, nextPublished && notifyOnPublish)
        if (result.error) {
          toast.error(result.error)
        } else {
          setIsPublished(nextPublished)
          toast.success(nextPublished ? 'Update published.' : 'Update unpublished.')
          if (nextPublished && notifyOnPublish) {
            toast.success('Investor notifications queued.')
          }
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete update?',
      body: 'This will permanently remove this investor update. This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!confirmed) return
    startTransition(async () => {
      try {
        const result = await deleteUpdate(id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Update deleted.')
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
        const result = await updateUpdate(formData)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Update saved.')
          setEditing(false)
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  if (editing) {
    return (
      <form onSubmit={handleEditSubmit} className="space-y-2 min-w-[240px]">
        <input type="hidden" name="id" value={id} />
        <input
          name="title"
          defaultValue={titleProp}
          required
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <textarea
          name="body"
          defaultValue={bodyProp}
          rows={4}
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
            onClick={closeEditor}
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
        onClick={openEditor}
        className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
      >
        Edit
      </button>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={handleTogglePublish}
          className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
        {!isPublished && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnPublish}
              onChange={e => setNotifyOnPublish(e.target.checked)}
              className="rounded border-border"
            />
            Notify
          </label>
        )}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="rounded border border-destructive/30 bg-background px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label="Delete update"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
