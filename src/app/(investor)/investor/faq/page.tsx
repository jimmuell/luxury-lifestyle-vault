import { redirect } from 'next/navigation'
import { HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function InvestorFaqPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role
  if (role !== 'investor' && role !== 'admin') redirect('/')

  // RLS automatically filters entries to those the user's tier can see.
  // Admin uses createClient() here — the admin policy also covers selects.
  const { data: entries, error: faqError } = await supabase
    .from('investor_faq')
    .select('id, question, answer, audience, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (faqError) throw new Error(`Failed to load FAQ: ${faqError.message}`)
  const faqs = entries ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">Frequently Asked Questions</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Answers to common questions about Luxury Lifestyle Vault and your investment.
        </p>
      </div>

      {faqs.length === 0 ? (
        <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <HelpCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No FAQs yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            FAQ entries will appear here once they are published.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map(faq => (
            <div
              key={faq.id}
              className="border border-border rounded-lg bg-card px-6 py-5 space-y-2"
            >
              <p className="font-serif text-base font-light leading-snug">{faq.question}</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
