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
    supabase.from('help_articles').select('*').order('category').order('sort_order'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Content</p>
        <h1 className="font-serif text-3xl font-light mt-1">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage contextual tooltips and help articles. Add a row to make a tip appear on
          any screen — no code change needed.
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
