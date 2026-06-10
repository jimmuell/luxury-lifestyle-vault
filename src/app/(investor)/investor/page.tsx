import Link from 'next/link'
import { FolderOpen, BarChart2, Presentation } from 'lucide-react'

export default function InvestorOverviewPage() {
  const cards = [
    { href: '/investor/documents',  label: 'Documents',  icon: FolderOpen,   description: 'Review the full data room library.' },
    { href: '/investor/financials', label: 'Financials', icon: BarChart2,     description: 'Explore the 3-year financial model.' },
    { href: '/investor/deck',       label: 'Pitch Deck', icon: Presentation,  description: 'View the investor presentation.' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light">Your Lifestyle, Wherever Life Takes You.</h1>
        <p className="mt-2 text-muted-foreground text-sm">Welcome to the Luxury Lifestyle Vault investor data room.</p>
      </div>
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
    </div>
  )
}
