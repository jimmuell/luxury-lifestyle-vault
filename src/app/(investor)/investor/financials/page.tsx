import { BarChart2 } from 'lucide-react'
import { InvestorPlaceholder } from '@/components/investor/investor-placeholder'

export default function InvestorFinancialsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Financials</h1>
      <InvestorPlaceholder
        icon={BarChart2}
        title="Coming soon"
        description="Revenue, costs, and the 3-year projection will appear here."
      />
    </div>
  )
}
