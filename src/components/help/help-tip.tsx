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
