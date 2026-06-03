'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { createTooltip, updateTooltip, deleteTooltip } from '@/actions/help'
import type { HelpTooltip } from '@/types/app'

const AREA_KEY_HINT =
  'Dot-namespaced placement id (e.g. client.ondemand, provider.stages). Controls which screen this tip appears on.'

interface HelpTooltipsTabProps {
  tooltips: HelpTooltip[]
}

type FormState = {
  area_key: string
  title: string
  body: string
  linked_article_slug: string
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  area_key: '',
  title: '',
  body: '',
  linked_article_slug: '',
  is_published: true,
}

export function HelpTooltipsTab({ tooltips }: HelpTooltipsTabProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<HelpTooltip | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const dialogOpen = creating || editing !== null

  function openCreate() {
    setForm(EMPTY_FORM)
    setCreating(true)
    setEditing(null)
  }

  function openEdit(t: HelpTooltip) {
    setForm({
      area_key: t.area_key,
      title: t.title,
      body: t.body,
      linked_article_slug: t.linked_article_slug ?? '',
      is_published: t.is_published,
    })
    setEditing(t)
    setCreating(false)
  }

  function closeDialog() {
    setCreating(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        area_key: form.area_key.trim(),
        title: form.title.trim(),
        body: form.body.trim(),
        linked_article_slug: form.linked_article_slug.trim() || null,
        is_published: form.is_published,
      }
      const result = editing
        ? await updateTooltip(editing.id, payload)
        : await createTooltip(payload)

      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(editing ? 'Tooltip updated' : 'Tooltip created')
      closeDialog()
      router.refresh()
    })
  }

  async function handleDelete(t: HelpTooltip) {
    const confirmed = await confirm({
      title: 'Delete tooltip?',
      body: `This will permanently delete the "${t.title}" tooltip (${t.area_key}).`,
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!confirmed) return
    startTransition(async () => {
      const result = await deleteTooltip(t.id)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Tooltip deleted')
      router.refresh()
    })
  }

  async function handleTogglePublish(t: HelpTooltip) {
    startTransition(async () => {
      const result = await updateTooltip(t.id, { is_published: !t.is_published })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(t.is_published ? 'Tooltip unpublished' : 'Tooltip published')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tooltips.length} tooltip{tooltips.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add tooltip
        </Button>
      </div>

      {tooltips.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          No tooltips yet. Add one to make help appear on a screen.
        </p>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {tooltips.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{t.title}</span>
                  <Badge variant={t.is_published ? 'default' : 'outline'} className="shrink-0">
                    {t.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{t.area_key}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleTogglePublish(t)}
                  title={t.is_published ? 'Unpublish' : 'Publish'}
                  disabled={isPending}
                >
                  {t.is_published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(t)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(t)}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creating ? 'Add tooltip' : 'Edit tooltip'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="area_key">Area key</Label>
              <Input
                id="area_key"
                value={form.area_key}
                onChange={(e) => setForm((f) => ({ ...f, area_key: e.target.value }))}
                placeholder="client.ondemand"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground">{AREA_KEY_HINT}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tip_title">Title</Label>
              <Input
                id="tip_title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="How on-demand works"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tip_body">Body (1–3 sentences)</Label>
              <Textarea
                id="tip_body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Short explanation shown in the popover."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linked_slug">Linked article slug (optional)</Label>
              <Input
                id="linked_slug"
                value={form.linked_article_slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linked_article_slug: e.target.value }))
                }
                placeholder="how-on-demand-fulfillment-works"
              />
              <p className="text-xs text-muted-foreground">
                If set, adds a &quot;Learn more&quot; link to this article in the popover.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tip_published"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_published: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="tip_published">Published (visible to clients)</Label>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button
              onClick={handleSave}
              disabled={
                isPending ||
                !form.area_key.trim() ||
                !form.title.trim() ||
                !form.body.trim()
              }
            >
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
