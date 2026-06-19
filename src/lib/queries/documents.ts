import { createClient } from '@/lib/supabase/server'

export interface PublishedDoc {
  id: string
  title: string
  audience: string
  pdf_path: string | null
  published_at: string | null
  source_kind: string
  sort_order: number
  current_version: number
  category_id: string
  category_key: string
  category_label: string
  category_sort_order: number
}

export async function getPublishedDocuments(): Promise<PublishedDoc[]> {
  const supabase = await createClient()

  const [{ data: cats, error: catErr }, { data: docs, error: docsErr }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, key, label, sort_order')
      .eq('is_active', true),
    supabase
      .from('documents')
      .select('id, title, audience, pdf_path, published_at, source_kind, sort_order, current_version, category_id')
      .eq('status', 'published')
      .not('pdf_path', 'is', null),
  ])

  if (catErr) throw new Error(`Failed to fetch categories: ${catErr.message}`)
  if (docsErr) throw new Error(`Failed to fetch documents: ${docsErr.message}`)

  const catById = new Map((cats ?? []).map(c => [c.id, c]))

  return (docs ?? [])
    .map(d => {
      const cat = catById.get(d.category_id)
      return {
        id:                  d.id,
        title:               d.title,
        audience:            d.audience,
        pdf_path:            d.pdf_path,
        published_at:        d.published_at,
        source_kind:         d.source_kind,
        sort_order:          d.sort_order,
        current_version:     d.current_version,
        category_id:         d.category_id,
        category_key:        cat?.key ?? '',
        category_label:      cat?.label ?? '',
        category_sort_order: cat?.sort_order ?? 0,
      }
    })
    .sort((a, b) => {
      if (a.category_sort_order !== b.category_sort_order) {
        return a.category_sort_order - b.category_sort_order
      }
      return a.sort_order - b.sort_order
    })
}
