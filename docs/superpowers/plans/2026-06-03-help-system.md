# Help System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a data-driven help framework (tooltips + articles in Supabase) with a contextual `<HelpTip>` component, `/client/help` center, `/provider/help` reference panel, and `/admin/help` CRUD — all expandable by adding DB rows without code changes.

**Architecture:** Server Component `HelpTip` fetches from `help_tooltips` by `area_key` and passes content to a thin Client Component popover wrapper. Article and tooltip data lives in two new Supabase tables with admin-only writes and dynamic reads (cookie-based auth client). The admin CRUD page fetches server-side and passes serializable props to client tab components.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS), `@base-ui/react/popover`, Tailwind v4, Lucide icons, Sonner toasts, `useConfirm()` for destructive actions.

---

## File Index

| Status | Path | What |
|--------|------|------|
| Create | `supabase/migrations/028_help_system.sql` | Two tables + RLS + triggers |
| Modify | `src/types/database.ts` | Add `help_tooltips` + `help_articles` table types |
| Modify | `src/types/app.ts` | Type aliases + `HELP_CATEGORY_LABELS` |
| Create | `src/components/ui/popover.tsx` | Base UI Popover wrapper |
| Create | `src/components/help/help-escalate.tsx` | "Talk to your concierge" button |
| Create | `src/components/help/help-tip-popover.tsx` | Client popover wrapper |
| Create | `src/components/help/help-tip.tsx` | Async Server Component |
| Create | `src/actions/help.ts` | Admin-only CRUD server actions |
| Create | `src/components/admin/help-tooltips-tab.tsx` | Admin tooltips list + dialog |
| Create | `src/components/admin/help-articles-tab.tsx` | Admin articles list + dialog |
| Create | `src/app/(admin)/admin/help/page.tsx` | Admin help management page |
| Create | `src/components/help/help-center-content.tsx` | Client-side search + article list |
| Create | `src/app/(client)/client/help/page.tsx` | Client help center page |
| Create | `src/app/(provider)/provider/help/page.tsx` | Provider reference panel |
| Modify | `src/components/client/client-nav.tsx` | Add Help link |
| Modify | `src/app/(provider)/layout.tsx` | Add Reference link |
| Modify | `src/app/(admin)/layout.tsx` | Add Help Content link |
| Modify | `src/app/(client)/client/wardrobe/page.tsx` | Place `<HelpTip areaKey="client.wardrobe" />` |
| Modify | `src/app/(client)/client/orders/new/page.tsx` | Place `<HelpTip areaKey="client.ondemand" />` |
| Modify | `src/app/(client)/client/rotations/new/page.tsx` | Place `<HelpTip areaKey="client.rotation" />` |
| Modify | `src/app/(client)/client/settings/billing/page.tsx` | Place `<HelpTip areaKey="client.billing" />` |
| Modify | `src/app/(client)/client/orders/page.tsx` | Place `<HelpTip areaKey="client.returns" />` |
| Create | `src/lib/seed/seed-help.ts` | Seed 2 tooltips + 2 articles |
| Modify | `src/lib/seed/manifest.ts` | Register seed-help script |

---

## Task 1: Migration — `028_help_system.sql`

**Files:**
- Create: `supabase/migrations/028_help_system.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/028_help_system.sql
-- Help system: contextual tooltips + help articles
-- Two admin-editable tables. RLS: authenticated reads published rows (admin reads all).
-- All writes are admin-only.

CREATE TABLE IF NOT EXISTS public.help_tooltips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  linked_article_slug text,
  is_published boolean NOT NULL DEFAULT true,
  is_seed_data boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  area_key text,
  audience text NOT NULL DEFAULT 'client',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_seed_data boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance index for the help-center list query
CREATE INDEX IF NOT EXISTS help_articles_audience_idx
  ON public.help_articles (audience, category, is_published, sort_order);

-- updated_at triggers (uses existing handle_updated_at() function)
CREATE TRIGGER set_help_tooltips_updated_at
  BEFORE UPDATE ON public.help_tooltips
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE public.help_tooltips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users see published rows; admins see all (including drafts)
CREATE POLICY "help_tooltips_select" ON public.help_tooltips
  FOR SELECT TO authenticated
  USING (is_published = true OR get_my_role() = 'admin');

CREATE POLICY "help_articles_select" ON public.help_articles
  FOR SELECT TO authenticated
  USING (is_published = true OR get_my_role() = 'admin');

-- INSERT / UPDATE / DELETE: admin only
CREATE POLICY "help_tooltips_admin_write" ON public.help_tooltips
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "help_articles_admin_write" ON public.help_articles
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/028_help_system.sql
git commit -m "feat: add help_tooltips + help_articles migration (028)"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/database.ts` (insert before closing `}` of Tables block, which is the `    }` line immediately before `    Views: {`)
- Modify: `src/types/app.ts`

- [ ] **Step 1: Add `help_articles` and `help_tooltips` to `database.ts`**

In `src/types/database.ts`, find the line `    }` that immediately precedes `    Views: {` (around line 1547). Insert the two new table entries before it:

```typescript
      help_articles: {
        Row: {
          id: string
          slug: string
          category: string
          title: string
          body: string
          area_key: string | null
          audience: string
          sort_order: number
          is_published: boolean
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          category: string
          title: string
          body: string
          area_key?: string | null
          audience?: string
          sort_order?: number
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          category?: string
          title?: string
          body?: string
          area_key?: string | null
          audience?: string
          sort_order?: number
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_tooltips: {
        Row: {
          id: string
          area_key: string
          title: string
          body: string
          linked_article_slug: string | null
          is_published: boolean
          is_seed_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_key: string
          title: string
          body: string
          linked_article_slug?: string | null
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_key?: string
          title?: string
          body?: string
          linked_article_slug?: string | null
          is_published?: boolean
          is_seed_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 2: Add type aliases and `HELP_CATEGORY_LABELS` to `src/types/app.ts`**

Append to `src/types/app.ts` (after the last existing export):

```typescript
export type HelpTooltip = Database['public']['Tables']['help_tooltips']['Row']
export type HelpArticle = Database['public']['Tables']['help_articles']['Row']

export const HELP_CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting Started',
  rotations: 'Seasonal Rotations',
  on_demand: 'On-Demand',
  billing: 'Billing',
  returns: 'Returns',
  coverage: 'Coverage & Care',
  provider: 'Provider Reference',
}
```

- [ ] **Step 3: Run verify to check types compile**

```bash
npm run verify
```

Expected: passes (or only pre-existing errors — no new errors from these additions).

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts src/types/app.ts
git commit -m "feat: add help_tooltips and help_articles types"
```

---

## Task 3: Popover UI Primitive

**Files:**
- Create: `src/components/ui/popover.tsx`

- [ ] **Step 1: Create `src/components/ui/popover.tsx`**

Pattern mirrors `src/components/ui/dropdown-menu.tsx` which wraps `@base-ui/react/menu`.

```tsx
"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "side" | "sideOffset" | "align">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "w-72 rounded-lg bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
```

- [ ] **Step 2: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/popover.tsx
git commit -m "feat: add Base UI Popover UI primitive"
```

---

## Task 4: Help Components — HelpEscalate, HelpTipPopover, HelpTip

**Files:**
- Create: `src/components/help/help-escalate.tsx`
- Create: `src/components/help/help-tip-popover.tsx`
- Create: `src/components/help/help-tip.tsx`

- [ ] **Step 1: Create `src/components/help/help-escalate.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface HelpEscalateProps {
  href?: string
}

export function HelpEscalate({ href = '/client/concierge' }: HelpEscalateProps) {
  return (
    <Link
      href={href}
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
    >
      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
      Talk to your concierge
    </Link>
  )
}
```

- [ ] **Step 2: Create `src/components/help/help-tip-popover.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HelpEscalate } from './help-escalate'

interface HelpTipPopoverProps {
  title: string
  body: string
  linkedArticleSlug: string | null
}

export function HelpTipPopover({ title, body, linkedArticleSlug }: HelpTipPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
          {linkedArticleSlug && (
            <Link
              href={`/client/help#${linkedArticleSlug}`}
              className="text-xs text-primary hover:underline block"
            >
              Learn more →
            </Link>
          )}
          <div className="pt-1 border-t border-border">
            <HelpEscalate />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 3: Create `src/components/help/help-tip.tsx`**

This is an **async Server Component**. It must only be placed in server-rendered files (page.tsx, layout.tsx). Never import it into a `'use client'` file.

```tsx
import { createClient } from '@/lib/supabase/server'
import { HelpTipPopover } from './help-tip-popover'

interface HelpTipProps {
  areaKey: string
}

export async function HelpTip({ areaKey }: HelpTipProps) {
  const supabase = await createClient()
  const { data: tooltip } = await supabase
    .from('help_tooltips')
    .select('title, body, linked_article_slug')
    .eq('area_key', areaKey)
    .eq('is_published', true)
    .maybeSingle()

  if (!tooltip) return null

  return (
    <HelpTipPopover
      title={tooltip.title}
      body={tooltip.body}
      linkedArticleSlug={tooltip.linked_article_slug}
    />
  )
}
```

- [ ] **Step 4: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/help/
git commit -m "feat: add HelpEscalate, HelpTipPopover, HelpTip components"
```

---

## Task 5: Server Actions — `src/actions/help.ts`

**Files:**
- Create: `src/actions/help.ts`

- [ ] **Step 1: Create `src/actions/help.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return supabase
}

// ── Tooltips ────────────────────────────────────────────────────────────────

export async function createTooltip(data: {
  area_key: string
  title: string
  body: string
  linked_article_slug?: string | null
  is_published?: boolean
}) {
  const supabase = await requireAdmin()
  const { data: created, error } = await supabase
    .from('help_tooltips')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true, data: created }
}

export async function updateTooltip(
  id: string,
  data: {
    area_key?: string
    title?: string
    body?: string
    linked_article_slug?: string | null
    is_published?: boolean
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_tooltips').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}

export async function deleteTooltip(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_tooltips').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}

// ── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(data: {
  slug: string
  category: string
  title: string
  body: string
  area_key?: string | null
  audience?: string
  sort_order?: number
  is_published?: boolean
}) {
  const supabase = await requireAdmin()
  const { data: created, error } = await supabase
    .from('help_articles')
    .insert(data)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true, data: created }
}

export async function updateArticle(
  id: string,
  data: {
    slug?: string
    category?: string
    title?: string
    body?: string
    area_key?: string | null
    audience?: string
    sort_order?: number
    is_published?: boolean
  }
) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_articles').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}

export async function deleteArticle(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('help_articles').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/help')
  return { success: true }
}
```

- [ ] **Step 2: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/actions/help.ts
git commit -m "feat: add help system server actions (tooltip + article CRUD)"
```

---

## Task 6: Admin Help Page + Components

**Files:**
- Create: `src/components/admin/help-tooltips-tab.tsx`
- Create: `src/components/admin/help-articles-tab.tsx`
- Create: `src/app/(admin)/admin/help/page.tsx`

- [ ] **Step 1: Create `src/components/admin/help-tooltips-tab.tsx`**

```tsx
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
        <p className="text-sm text-muted-foreground">{tooltips.length} tooltip{tooltips.length !== 1 ? 's' : ''}</p>
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
                  {t.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)} disabled={isPending}>
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
                onChange={(e) => setForm((f) => ({ ...f, linked_article_slug: e.target.value }))}
                placeholder="how-on-demand-fulfillment-works"
              />
              <p className="text-xs text-muted-foreground">If set, adds a "Learn more" link to this article in the popover.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tip_published"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="tip_published">Published (visible to clients)</Label>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave} disabled={isPending || !form.area_key.trim() || !form.title.trim() || !form.body.trim()}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/admin/help-articles-tab.tsx`**

```tsx
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
        <p className="text-sm text-muted-foreground">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
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
                <p className="text-xs text-muted-foreground">{categoryLabel(a.category)}{a.area_key ? ` · ${a.area_key}` : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleTogglePublish(a)}
                  title={a.is_published ? 'Unpublish' : 'Publish'}
                  disabled={isPending}
                >
                  {a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} disabled={isPending}>
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
                <p className="text-xs text-muted-foreground">e.g. on_demand, rotations, billing, returns, provider</p>
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
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="art_published">Published (visible to clients/providers)</Label>
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
```

- [ ] **Step 3: Create `src/app/(admin)/admin/help/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { HelpTooltipsTab } from '@/components/admin/help-tooltips-tab'
import { HelpArticlesTab } from '@/components/admin/help-articles-tab'

export default async function AdminHelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [tooltipsResult, articlesResult] = await Promise.all([
    supabase.from('help_tooltips').select('*').order('area_key'),
    supabase
      .from('help_articles')
      .select('*')
      .order('category')
      .order('sort_order'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Content</p>
        <h1 className="font-serif text-3xl font-light mt-1">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage contextual tooltips and help articles. Add a row to make a tip appear on any screen — no code change needed.
        </p>
      </div>

      <Tabs defaultValue="tooltips">
        <TabsList>
          <TabsTrigger value="tooltips">Tooltips</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>
        <TabsContent value="tooltips" className="mt-4">
          <HelpTooltipsTab tooltips={tooltipsResult.data ?? []} />
        </TabsContent>
        <TabsContent value="articles" className="mt-4">
          <HelpArticlesTab articles={articlesResult.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 4: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/help-tooltips-tab.tsx src/components/admin/help-articles-tab.tsx src/app/\(admin\)/admin/help/page.tsx
git commit -m "feat: add /admin/help CRUD page (tooltips + articles)"
```

---

## Task 7: Client Help Center

**Files:**
- Create: `src/components/help/help-center-content.tsx`
- Create: `src/app/(client)/client/help/page.tsx`

- [ ] **Step 1: Create `src/components/help/help-center-content.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { HELP_CATEGORY_LABELS } from '@/types/app'
import type { HelpArticle } from '@/types/app'

interface HelpCenterContentProps {
  grouped: Record<string, HelpArticle[]>
}

export function HelpCenterContent({ grouped }: HelpCenterContentProps) {
  const [query, setQuery] = useState('')

  const categories = Object.keys(grouped)

  const filtered: Record<string, HelpArticle[]> = {}
  for (const cat of categories) {
    const matches = query.trim()
      ? grouped[cat].filter(
          (a) =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.body.toLowerCase().includes(query.toLowerCase())
        )
      : grouped[cat]
    if (matches.length > 0) filtered[cat] = matches
  }

  const hasResults = Object.keys(filtered).length > 0

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="pl-8"
        />
      </div>

      {!hasResults && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No articles match "{query}".
        </p>
      )}

      {Object.entries(filtered).map(([cat, articles]) => (
        <section key={cat} className="space-y-4">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium border-b border-border pb-2">
            {HELP_CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <div className="space-y-6">
            {articles.map((article) => (
              <section key={article.id} id={article.slug} className="space-y-2 scroll-mt-4">
                <h3 className="font-medium text-sm">{article.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {article.body}
                </p>
              </section>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/(client)/client/help/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { HelpCenterContent } from '@/components/help/help-center-content'
import { HelpEscalate } from '@/components/help/help-escalate'
import type { HelpArticle } from '@/types/app'

export default async function ClientHelpPage() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('help_articles')
    .select('*')
    .eq('audience', 'client')
    .eq('is_published', true)
    .order('category')
    .order('sort_order')

  // Group by category (server-side, so client component receives serializable props)
  const grouped: Record<string, HelpArticle[]> = {}
  for (const article of articles ?? []) {
    if (!grouped[article.category]) grouped[article.category] = []
    grouped[article.category].push(article)
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Support</p>
          <h1 className="font-serif text-3xl font-light mt-1">Help Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Answers to common questions. A member of your concierge team is always available if you need more help.
          </p>
        </div>
        <HelpEscalate />
      </div>

      <HelpCenterContent grouped={grouped} />

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">Still have questions?</p>
        <HelpEscalate />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/help/help-center-content.tsx src/app/\(client\)/client/help/page.tsx
git commit -m "feat: add /client/help center page"
```

---

## Task 8: Provider Help Page

**Files:**
- Create: `src/app/(provider)/provider/help/page.tsx`

- [ ] **Step 1: Create `src/app/(provider)/provider/help/page.tsx`**

No `HelpEscalate` — provider portal has no provider-facing messaging route.

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function ProviderHelpPage() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('help_articles')
    .select('*')
    .eq('audience', 'provider')
    .eq('is_published', true)
    .order('sort_order')

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <Link href="/provider" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Reference</p>
          <h1 className="font-serif text-3xl font-light mt-1">Handling Protocols</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stage definitions and care standards for Luxury Lifestyle Vault garments.
          </p>
        </div>
      </div>

      {(articles ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No reference articles published yet.
        </p>
      ) : (
        <div className="space-y-8">
          {(articles ?? []).map((article) => (
            <section key={article.id} id={article.slug} className="space-y-2 scroll-mt-4">
              <h2 className="font-medium">{article.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {article.body}
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(provider\)/provider/help/page.tsx
git commit -m "feat: add /provider/help reference panel"
```

---

## Task 9: Nav Additions

**Files:**
- Modify: `src/components/client/client-nav.tsx`
- Modify: `src/app/(provider)/layout.tsx`
- Modify: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Add Help link to client nav**

In `src/components/client/client-nav.tsx`, update the `NAV_LINKS` array and the import. Add `HelpCircle` to the Lucide imports, then add the Help entry to `NAV_LINKS`:

Change:
```typescript
import { LayoutGrid, Package, MessageSquare, LogOut, Menu, ShoppingBag, Settings, Shirt } from 'lucide-react'
```
To:
```typescript
import { LayoutGrid, Package, MessageSquare, LogOut, Menu, ShoppingBag, Settings, Shirt, HelpCircle } from 'lucide-react'
```

Change `NAV_LINKS`:
```typescript
const NAV_LINKS = [
  { href: '/client', label: 'Overview', icon: LayoutGrid },
  { href: '/client/wardrobe', label: 'Wardrobe', icon: Package },
  { href: '/client/outfits', label: 'Outfits', icon: Shirt },
  { href: '/client/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/client/concierge', label: 'Concierge', icon: MessageSquare },
  { href: '/client/settings', label: 'Settings', icon: Settings },
  { href: '/client/help', label: 'Help', icon: HelpCircle },
]
```

- [ ] **Step 2: Add Reference link to provider layout**

In `src/app/(provider)/layout.tsx`, add a navigation link. Find the `return (` block and add a header row with the Reference link. Update the return to:

```tsx
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
        <AuthWatcher />
        <div className="flex items-center justify-end mb-6">
          <Link
            href="/provider/help"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            Reference guide
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
```

Also add `import Link from 'next/link'` to the imports at the top of `src/app/(provider)/layout.tsx`.

- [ ] **Step 3: Add Help Content link to admin layout**

In `src/app/(admin)/layout.tsx`, update the `NAV_ITEMS` array and imports. Add `BookOpen` to the Lucide imports:

Change:
```typescript
import { LayoutGrid, Users, Package, Building2, MessageSquare, LogOut, FlaskConical, ShoppingBag, Settings, Route, CreditCard, BarChart2, ScrollText } from 'lucide-react'
```
To:
```typescript
import { LayoutGrid, Users, Package, Building2, MessageSquare, LogOut, FlaskConical, ShoppingBag, Settings, Route, CreditCard, BarChart2, ScrollText, BookOpen } from 'lucide-react'
```

Add the Help Content entry to `NAV_ITEMS` (after `seed-data`):
```typescript
  { href: '/admin/help', label: 'Help Content', icon: BookOpen },
```

Full updated `NAV_ITEMS`:
```typescript
const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/concierge', label: 'Concierge', icon: MessageSquare },
  { href: '/admin/providers', label: 'Providers', icon: Building2 },
  { href: '/admin/settings/tiers', label: 'Service Tiers', icon: Settings },
  { href: '/admin/settings/corridors', label: 'Corridors', icon: Route },
  { href: '/admin/settings/notifications', label: 'Notifications', icon: MessageSquare },
  { href: '/admin/seed-data', label: 'Seed Data', icon: FlaskConical },
  { href: '/admin/help', label: 'Help Content', icon: BookOpen },
]
```

- [ ] **Step 4: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/client/client-nav.tsx src/app/\(provider\)/layout.tsx src/app/\(admin\)/layout.tsx
git commit -m "feat: add Help nav links (client, provider, admin)"
```

---

## Task 10: HelpTip Placements on 5 Client Pages

Each placement adds `<HelpTip areaKey="..." />` next to the page's `<h1>` in the server component. All five target pages are server components so no boundary issue.

**Files:**
- Modify: `src/app/(client)/client/wardrobe/page.tsx`
- Modify: `src/app/(client)/client/orders/new/page.tsx`
- Modify: `src/app/(client)/client/rotations/new/page.tsx`
- Modify: `src/app/(client)/client/settings/billing/page.tsx`
- Modify: `src/app/(client)/client/orders/page.tsx`

- [ ] **Step 1: `wardrobe/page.tsx` — place `client.wardrobe` tip**

Add `import { HelpTip } from '@/components/help/help-tip'` to the imports.

Find:
```tsx
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-light">Wardrobe</h1>
```
Replace with:
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-3xl font-light">Wardrobe</h1>
          <HelpTip areaKey="client.wardrobe" />
        </div>
```

- [ ] **Step 2: `orders/new/page.tsx` — place `client.ondemand` tip**

Add `import { HelpTip } from '@/components/help/help-tip'` to the imports.

Find:
```tsx
          <h1 className="font-serif text-3xl font-light mt-1">Request an item</h1>
```
Replace with:
```tsx
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-serif text-3xl font-light">Request an item</h1>
            <HelpTip areaKey="client.ondemand" />
          </div>
```

- [ ] **Step 3: `rotations/new/page.tsx` — place `client.rotation` tip**

Add `import { HelpTip } from '@/components/help/help-tip'` to the imports.

In `rotations/new/page.tsx`, find:
```tsx
          <h1 className="font-serif text-3xl font-light mt-1">Request a delivery</h1>
```
Replace with:
```tsx
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-serif text-3xl font-light">Request a delivery</h1>
            <HelpTip areaKey="client.rotation" />
          </div>
```

- [ ] **Step 4: `settings/billing/page.tsx` — place `client.billing` tip**

Add `import { HelpTip } from '@/components/help/help-tip'` to the imports.

In `billing/page.tsx`, the page has no top-level h1 — it starts directly with section headers. Add a page header before the first section. Find:
```tsx
  return (
    <div className="space-y-8">
      {/* Active subscription */}
```
Replace with:
```tsx
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <h1 className="font-serif text-3xl font-light">Billing</h1>
        <HelpTip areaKey="client.billing" />
      </div>
      {/* Active subscription */}
```

- [ ] **Step 5: `orders/page.tsx` — place `client.returns` tip**

Add `import { HelpTip } from '@/components/help/help-tip'` to the imports.

In `orders/page.tsx`, find:
```tsx
        <h1 className="font-serif text-3xl font-light">Orders</h1>
```
Replace with:
```tsx
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-3xl font-light">Orders</h1>
          <HelpTip areaKey="client.returns" />
        </div>
```

- [ ] **Step 6: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(client\)/client/wardrobe/page.tsx \
        src/app/\(client\)/client/orders/new/page.tsx \
        src/app/\(client\)/client/rotations/new/page.tsx \
        src/app/\(client\)/client/settings/billing/page.tsx \
        src/app/\(client\)/client/orders/page.tsx
git commit -m "feat: place HelpTip on 5 client pages (wardrobe, ondemand, rotation, billing, orders)"
```

---

## Task 11: Seed Data

**Files:**
- Create: `src/lib/seed/seed-help.ts`
- Modify: `src/lib/seed/manifest.ts`

- [ ] **Step 1: Create `src/lib/seed/seed-help.ts`**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import type { SeedResult } from './types'

export async function seedHelp(): Promise<SeedResult> {
  const supabase = createAdminClient()
  const result: SeedResult = { seeded: 0, skipped: 0, errors: [] }

  // ── Tooltips ────────────────────────────────────────────────────────────────
  const tooltips = [
    {
      area_key: 'client.ondemand',
      title: 'How on-demand works',
      body: "Request any stored item delivered to your current address within your service tier's lead time. Rush delivery is available for an additional fee.",
      linked_article_slug: 'how-on-demand-fulfillment-works',
      is_published: true,
      is_seed_data: true,
    },
    {
      area_key: 'client.returns',
      title: 'Starting a return',
      body: 'Use the return order type to schedule pickup of items you no longer need in your current location. Items are cleaned and returned to your vault.',
      linked_article_slug: null,
      is_published: true,
      is_seed_data: true,
    },
  ]

  for (const tooltip of tooltips) {
    const { data: existing } = await supabase
      .from('help_tooltips')
      .select('id')
      .eq('area_key', tooltip.area_key)
      .maybeSingle()

    if (existing) {
      result.skipped++
      continue
    }

    const { error } = await supabase.from('help_tooltips').insert(tooltip)
    if (error) {
      result.errors.push(`tooltip ${tooltip.area_key}: ${error.message}`)
    } else {
      result.seeded++
    }
  }

  // ── Articles ─────────────────────────────────────────────────────────────────
  const articles = [
    {
      slug: 'how-on-demand-fulfillment-works',
      category: 'on_demand',
      title: 'How On-Demand Fulfillment Works',
      body: `On-demand orders let you request any item from your vault delivered to your current address — whether you're in Scottsdale or back in Wisconsin.

When you place a request, your concierge team coordinates with your assigned care provider to inspect, press, and ship the item. Standard lead time is 3–5 business days; rush delivery can often be arranged within 24–48 hours for an additional fee.

Your service tier determines the per-request base fee and any per-item surcharges. Founding members receive a discount on all on-demand orders.`,
      area_key: 'client.ondemand',
      audience: 'client',
      sort_order: 0,
      is_published: true,
      is_seed_data: true,
    },
    {
      slug: 'garment-care-stages',
      category: 'provider',
      title: 'Garment Care Stages',
      body: `Every LLV garment moves through four stages when in your facility:

**Received** — Log the item into the system and perform a condition assessment. Note any pre-existing damage in the condition record before proceeding.

**Cleaning** — Apply the care method specified for the garment's fabric and construction. For delicate pieces (silk, beading, structured tailoring), use specialist dry-cleaning protocols. Never use heat on embellishments or structured shoulders.

**Pressing** — Press according to fabric type. Steam-only for wool and cashmere; light press cloth for silk. Ensure all fold lines from storage are fully removed.

**Ready for pickup** — Garment is bagged, tagged with the LLV item SKU, and staged for pickup or shipment. Update the order status to trigger client notification.`,
      area_key: 'provider.stages',
      audience: 'provider',
      sort_order: 0,
      is_published: true,
      is_seed_data: true,
    },
  ]

  for (const article of articles) {
    const { data: existing } = await supabase
      .from('help_articles')
      .select('id')
      .eq('slug', article.slug)
      .maybeSingle()

    if (existing) {
      result.skipped++
      continue
    }

    const { error } = await supabase.from('help_articles').insert(article)
    if (error) {
      result.errors.push(`article ${article.slug}: ${error.message}`)
    } else {
      result.seeded++
    }
  }

  return result
}
```

- [ ] **Step 2: Register in `src/lib/seed/manifest.ts`**

Add import at the top:
```typescript
import { seedHelp } from './seed-help'
```

Add entry to `SEED_MANIFEST` array (append at the end):
```typescript
  {
    id: 'help',
    name: 'Help Content',
    description: '2 tooltips (client.ondemand, client.returns) + 2 articles (on-demand fulfillment + garment care stages). Proves the framework; other area keys intentionally empty.',
    script: seedHelp,
  },
```

- [ ] **Step 3: Run verify**

```bash
npm run verify
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/seed/seed-help.ts src/lib/seed/manifest.ts
git commit -m "feat: add help system seed data (2 tooltips + 2 articles)"
```

---

## Task 12: Deploy Migration + Final Verify

- [ ] **Step 1: Run final verify (must be clean)**

```bash
npm run verify
```

Expected output: No errors. If there are errors, fix them before proceeding.

- [ ] **Step 2: Deploy migration (founder runs this)**

The migration creates `help_tooltips` and `help_articles` tables with RLS. Run:

```bash
npx supabase db push
```

Expected: migration 028 applied successfully.

- [ ] **Step 3: Verify types still match (optional sanity check)**

After migration deploy, the founder can regenerate types to confirm schema matches:

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

Then re-run `npm run verify` to confirm no regressions.

---

## Manual Verification Checklist (for the founder)

After deploying the migration and running the app:

1. **Admin `/admin/help`:** Add a tooltip with `area_key = client.wardrobe` via the Tooltips tab. Save. Confirm it appears with no code change.
2. **Client wardrobe page:** Navigate to `/client/wardrobe`. The `HelpCircle` icon should now appear next to "Wardrobe" — click it to see the popover with the tooltip content.
3. **Edit + unpublish:** In `/admin/help`, edit the tooltip body text. Refresh `/client/wardrobe` — the new text should appear. Toggle to Draft. Refresh again — icon should disappear.
4. **Learn more link:** Set `linked_article_slug = how-on-demand-fulfillment-works` on the `client.ondemand` tooltip. Navigate to `/client/orders/new`, click the help icon, click "Learn more" — should scroll to that article on `/client/help`.
5. **"Talk to your concierge":** Click the HelpEscalate button in any tooltip popover or on `/client/help` — confirm it navigates to `/client/concierge`.
6. **`/client/help`:** Page lists the seeded article. Search "on-demand" — article appears. Clear search — all articles visible.
7. **Provider `/provider/help`:** Navigate to `/provider/help` — shows the garment care stages article. No "Talk to your concierge" button visible.
8. **Admin sees drafts:** Unpublish an article via `/admin/help`. Reload `/admin/help` — the article appears with "Draft" badge. Navigate to `/client/help` — article not visible.
9. **Empty area keys render nothing:** Navigate to `/client/settings/billing` — no HelpTip icon visible (no seed row for `client.billing`). No error, no empty popover.
10. **Seed data:** Run the "Help Content" seed script from `/admin/seed-data`. Confirm `client.ondemand` and `client.returns` tooltips + both articles appear in `/admin/help`.
