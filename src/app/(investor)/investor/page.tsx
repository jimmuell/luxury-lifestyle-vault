import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen, BarChart2, Presentation } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { PROJECTION_3YR, YEAR1_REVENUE } from '@/lib/investor/financials'

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount}`
}

export default async function InvestorOverviewPage() {
  const year1Total = YEAR1_REVENUE.reduce((sum, item) => sum + item.amount, 0)
  const year1Data = PROJECTION_3YR[0]
  const year3Data = PROJECTION_3YR[2]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, investor_tier')
    .eq('id', user.id)
    .maybeSingle()

  const fullName = profile?.full_name?.trim() ?? ''
  const firstName = fullName
    ? fullName.split(/\s+/)[0]
    : (user?.email?.split('@')[0] ?? '')
  const greeting = firstName ? `Welcome, ${firstName}.` : 'Welcome.'

  const { data: recent } = await supabase
    .from('investor_documents')
    .select('id, title, section, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const kpis = [
    { label: 'Year 1 revenue', value: formatCompact(year1Total) },
    { label: 'Year 1 members', value: year1Data.members },
    { label: 'Year 3 revenue', value: formatCompact(year3Data.revenue) },
    { label: 'Insured value (Yr 3)', value: formatCompact(year3Data.insuredValue) },
  ]

  const TIER_RANK: Record<string, number> = { prospect: 1, investor: 2, board: 3 }
  const userRank = TIER_RANK[profile?.investor_tier ?? 'prospect'] ?? 1

  const cards = [
    { href: '/investor/presentations', label: 'Presentations', icon: Presentation, description: 'View investor presentations.',         minRank: 1 },
    { href: '/investor/documents',     label: 'Documents',     icon: FolderOpen,   description: 'Review the full data room library.',  minRank: 2 },
    { href: '/investor/financials',    label: 'Financials',    icon: BarChart2,    description: 'Explore the 3-year financial model.', minRank: 3 },
  ].filter(c => userRank >= c.minRank)

  return (
    <div className="space-y-8">
      <div>
        <p className="font-serif text-3xl font-light">{greeting}</p>
        <p className="font-serif text-lg font-light text-muted-foreground mt-1">Your Lifestyle, Wherever Life Takes You.</p>
        <p className="mt-2 text-muted-foreground text-sm max-w-xl">
          Welcome to the Luxury Lifestyle Vault investor data room. Review our financials, explore the full document library, and view the pitch deck.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border px-4 py-4 bg-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
            <p className="font-serif text-2xl font-light mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Jump-in cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="border border-border rounded-lg bg-card p-6 flex flex-col gap-3 hover:border-foreground/30 transition-colors"
          >
            <Icon className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recently added section */}
      {recent && recent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">Recently added</h2>
          <div className="space-y-2">
            {recent.map(doc => (
              <div key={doc.id} className="border border-border rounded-lg bg-card px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-sm font-light">{doc.title}</p>
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-wide mt-0.5">{doc.section}</p>
                </div>
                <Link href="/investor/documents" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
