'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, PowerOff, Trash2, Check, X } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import {
  createCategory,
  updateCategory,
  setCategoryActive,
  deleteCategory,
} from '@/actions/admin-categories'

interface Category {
  id: string
  key: string
  label: string
  sort_order: number
  is_active: boolean
}

interface CategoryManagerProps {
  categories: Category[]
}

const INPUT_CLASS = 'rounded border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId]  = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const confirm = useConfirm()

  function run(action: () => Promise<{ error?: string; success?: boolean }>, msg: string) {
    startTransition(async () => {
      try {
        const result = await action()
        if (result.error) { toast.error(result.error); return }
        toast.success(msg)
        setEditingId(null)
        setShowCreate(false)
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    run(() => createCategory(new FormData(e.currentTarget)), 'Category created.')
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('id', id)
    run(() => updateCategory(fd), 'Category updated.')
  }

  async function handleDelete(id: string, label: string) {
    const ok = await confirm({
      title: `Delete "${label}"?`,
      body: 'The category must have no documents. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return
    run(() => deleteCategory(id), 'Category deleted.')
  }

  return (
    <div className="space-y-4">
      {/* Create form */}
      {showCreate ? (
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">New Category</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Key (auto-slug)</label>
              <input name="key" required placeholder="e.g. financials" className={`${INPUT_CLASS} w-full`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Label</label>
              <input name="label" required placeholder="e.g. Financials" className={`${INPUT_CLASS} w-full`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Sort Order</label>
              <input name="sort_order" type="number" defaultValue={0} className={`${INPUT_CLASS} w-full`} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending}
              className="rounded bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50">
              {pending ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors w-full justify-center">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      )}

      {/* Category table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Key</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Label</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] hidden sm:table-cell">Sort</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Active</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{cat.key}</td>
                <td className="px-5 py-3">
                  {editingId === cat.id ? (
                    <form onSubmit={e => handleUpdate(e, cat.id)} className="flex items-center gap-2">
                      <input name="label" defaultValue={cat.label} required autoFocus
                        className={`${INPUT_CLASS} text-xs`} />
                      <input name="sort_order" type="number" defaultValue={cat.sort_order}
                        className={`${INPUT_CLASS} text-xs w-16`} />
                      <button type="submit" disabled={pending} aria-label="Save"
                        className="text-green-600 hover:text-green-700 disabled:opacity-50">
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel"
                        className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                  ) : (
                    <span className={cat.is_active ? '' : 'text-muted-foreground/50 line-through'}>
                      {cat.label}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                  {editingId !== cat.id && cat.sort_order}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    cat.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {editingId !== cat.id && (
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setEditingId(cat.id)}
                        className="rounded border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" disabled={pending}
                        onClick={() => run(() => setCategoryActive(cat.id, !cat.is_active), cat.is_active ? 'Category deactivated.' : 'Category activated.')}
                        className="rounded border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        aria-label={cat.is_active ? 'Deactivate' : 'Activate'}>
                        <PowerOff className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" disabled={pending}
                        onClick={() => handleDelete(cat.id, cat.label)}
                        className="rounded border border-destructive/30 bg-background p-1.5 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
