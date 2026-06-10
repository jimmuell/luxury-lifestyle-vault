import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NDA_SUMMARY } from '@/lib/legal/investor-nda'
import { AcknowledgeForm } from '@/components/investor/acknowledge-form'

export default async function AcknowledgePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nda_acknowledged')
    .eq('id', user.id)
    .single()

  if (profile?.nda_acknowledged) redirect('/investor')

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-1">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Luxury Lifestyle Vault
          </p>
          <h1 className="font-serif text-3xl font-light">Investor Data Room</h1>
          <p className="text-sm text-muted-foreground">
            Confidential — authorised recipients only
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-6 space-y-4">
          <h2 className="font-medium text-sm">Confidentiality Agreement</h2>
          <div className="max-h-72 overflow-y-auto rounded border border-border bg-background p-4">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {NDA_SUMMARY}
            </pre>
          </div>
        </div>

        <AcknowledgeForm />
      </div>
    </div>
  )
}
