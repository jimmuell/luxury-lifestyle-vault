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
            Answers to common questions. A member of your concierge team is always
            available if you need more help.
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
