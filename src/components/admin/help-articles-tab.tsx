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
import { createArticle, updateArticle, deleteArticle } from '@/actions/help'
import { HELP_CATEGORY_LABELS } from '@/types/app'
import type { HelpArticle } from '@/types/app'

const AREA_KEY_HINT =
  'Optional: dot-namespaced area id (e.g. client.ondemand). Links this article to a specific screen for future surfacing.'

interface HelpArticlesTabProps {
  articles: HelpArticle[]
}

type FormState = {
  slug: string
  category: string
  title: string
  body: string
  area_key: string
  audience: string
  sort_order: string
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  slug: '',
  category: '',
  title: '',
  body: '',
  area_key: '',
  audience: 'client',
  sort_order: '0',
  is_published: true,
}

export function HelpArticlesTab({ articles }: HelpArticlesTabProps) {
  const router = useRouter()
  const confirm = useConfirm()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<HelpArticle | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const dialogOpen = creating || editing !== null

  function openCreate() {
    setForm(EMPTY_FORM)
    setCreating(true)
    setEditing(null)
  }

  function openEdit(a: HelpArticle) {
    setForm({
      slug: a.slug,
      category: a.category,
      title: a.title,
      body: a.body,
      area_key: a.area_key ?? '',
      audience: a.audience,
      sort_order: String(a.sort_order),
      is_published: a.is_published,
    })
    setEditing(a)
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
        slug: form.slug.trim(),
        category: form.category.trim(),
        title: form.title.trim(),
        body: form.body.trim(),
        area_key: form.area_key.trim() || null,
        audience: form.audience,
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_published: form.is_published,
      }
      const result = editing
        ? await updateArticle(editing.id, payload)
        : await createArticle(payload)

      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(editing ? 'Article updated' : 'Article created')
      closeDialog()
      router.refresh()
    })
  }

  async function handleDelete(a: HelpArticle) {
    const confirmed = await confirm({
      title: 'Delete article?',
      body: `This will permanently delete "${a.title}" (/${a.slug}).`,
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!confirmed) return
    startTransition(async () => {
      const result = await deleteArticle(a.id)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Article deleted')
      router.refresh()
    })
  }

  async function handleTogglePublish(a: HelpArticle) {
    startTransition(async () => {
      const result = await updateArticle(a.id, { is_published: !a.is_published })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(a.is_published ? 'Article unpublished' : 'Article published')
      router.refresh()
    })
  }

  const categoryLabel = (cat: string) => HELP_CATEGORY_LABELS[cat] ?? cat

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add article
        </Button>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          No articles yet.
        </p>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {articles.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{a.title}</span>
                  <Badge variant={a.is_published ? 'default' : 'outline'} className="shrink-0">
                    {a.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge variant="secondary" className="shrink-0">
                    {a.audience}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{a.slug}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(a.category)}
                  {a.area_key ? ` · ${a.area_key}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleTogglePublish(a)}
                  title={a.is_published ? 'Unpublish' : 'Publish'}
                  disabled={isPending}
                >
                  {a.is_published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(a)}
                  disabled={isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(a)}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{creating ? 'Add article' : 'Edit article'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="art_slug">Slug (URL-safe, unique)</Label>
              <Input
                id="art_slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="how-on-demand-fulfillment-works"
                disabled={!!editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="art_title">Title</Label>
              <Input
                id="art_title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="How On-Demand Fulfillment Works"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="art_body">Body</Label>
              <Textarea
                id="art_body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Article content (plain text or markdown)."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="art_category">Category</Label>
                <Input
                  id="art_category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="on_demand"
                />
                <p className="text-xs text-muted-foreground">
                  e.g. on_demand, rotations, billing, returns, provider
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="art_audience">Audience</Label>
                <Input
                  id="art_audience"
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                  placeholder="client"
                />
                <p className="text-xs text-muted-foreground">client or provider</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="art_area_key">Area key (optional)</Label>
                <Input
                  id="art_area_key"
                  value={form.area_key}
                  onChange={(e) => setForm((f) => ({ ...f, area_key: e.target.value }))}
                  placeholder="client.ondemand"
                />
                <p className="text-xs text-muted-foreground">{AREA_KEY_HINT}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="art_sort_order">Sort order</Label>
                <Input
                  id="art_sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="art_published"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_published: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="art_published">
                Published (visible to clients/providers)
              </Label>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button
              onClick={handleSave}
              disabled={
                isPending ||
                !form.slug.trim() ||
                !form.title.trim() ||
                !form.body.trim() ||
                !form.category.trim()
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
