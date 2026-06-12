'use client'

import { useTransition, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { createCta, updateCta, toggleCtaActive, deleteCta } from '@/actions/admin-ctas'

// ── Create Form ────────────────────────────────────────────────────────────────

export function CreateCtaForm() {
  const [pending, startTransition] = useTransition()
  const [actionType, setActionType] = useState('url')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await createCta(formData)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('CTA created.')
          formRef.current?.reset()
          setActionType('url')
        }
      } catch {
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">New CTA</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">

        <div className="sm:col-span-2 space-y-1">
          <label htmlFor="create-label" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Label <span className="text-destructive">*</span>
          </label>
          <input
            id="create-label"
            name="label"
            type="text"
            required
            placeholder="Schedule a Call"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="create-action-type" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Action type <span className="text-destructive">*</span>
          </label>
          <select
            id="create-action-type"
            name="action_type"
            value={actionType}
            onChange={e => setActionType(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="url">URL — open link</option>
            <option value="email">Email — mailto link</option>
            <option value="log">Log — record interest only</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="create-action-value" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            {actionType === 'email' ? 'Email address' : actionType === 'url' ? 'URL' : 'Action value'}
            {actionType !== 'log' && <span className="text-destructive"> *</span>}
          </label>
          <input
            id="create-action-value"
            name="action_value"
            type={actionType === 'email' ? 'email' : actionType === 'url' ? 'url' : 'text'}
            disabled={actionType === 'log'}
            placeholder={
              actionType === 'email'
                ? 'james@example.com'
                : actionType === 'url'
                ? 'https://calendly.com/...'
                : 'N/A for log type'
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="create-sort-order" className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">
            Sort order
          </label>
          <input
            id="create-sort-order"
            name="sort_order"
            type="number"
            defaultValue={0}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col justify-end space-y-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked
              className="rounded border-border"
            />
            Active (visible to investors)
          </label>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Create CTA'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Row Actions ────────────────────────────────────────────────────────────────

interface CtaRowActionsProps {
  id: string
  label: string
  actionType: string
  actionValue: string
  sortOrder: number
  isActive: boolean
}

export function CtaRowActions({
  id,
  label: labelProp,
  actionType: actionTypeProp,
  actionValue: actionValueProp,
  sortOrder: sortOrderProp,
  isActive: isActiveProp,
}: CtaRowActionsProps) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const confirm = useConfirm()

  const [prevIsActiveProp, setPrevIsActiveProp] = useState(isActiveProp)
  const [isActive, setIsActive] = useState(isActiveProp)
  const [actionType, setActionType] = useState(actionTypeProp)

  if (prevIsActiveProp !== isActiveProp) {
    setPrevIsActiveProp(isActiveProp)
    setIsActive(isActiveProp)
  }

  function handleToggleActive() {
    const next = !isActive
    startTransition(async () => {
      try {
        const result = await toggleCtaActive(id, next)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          setIsActive(next)
          toast.success(next ? 'CTA activated.' : 'CTA deactivated.')
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  async function handleDelete() {
    const confirmed = await confirm({
      title: 'Delete CTA?',
      body: 'This will permanently remove this CTA button. This action cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!confirmed) return
    startTransition(async () => {
      try {
        const result = await deleteCta(id)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('CTA deleted.')
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
        const result = await updateCta(formData)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('CTA saved.')
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
          name="label"
          defaultValue={labelProp}
          required
          placeholder="Label"
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          name="action_type"
          value={actionType}
          onChange={e => setActionType(e.target.value)}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="url">URL</option>
          <option value="email">Email</option>
          <option value="log">Log</option>
        </select>
        <input
          name="action_value"
          defaultValue={actionValueProp}
          disabled={actionType === 'log'}
          placeholder={actionType === 'email' ? 'Email address' : actionType === 'url' ? 'https://...' : 'N/A'}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <input
          name="sort_order"
          type="number"
          defaultValue={sortOrderProp}
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={isActiveProp}
            className="rounded border-border"
          />
          Active
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
        onClick={handleToggleActive}
        className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="rounded border border-destructive/30 bg-background px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label="Delete CTA"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
