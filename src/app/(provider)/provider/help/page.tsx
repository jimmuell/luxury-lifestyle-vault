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
