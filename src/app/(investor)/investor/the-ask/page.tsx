import { Target } from 'lucide-react'
import { InvestorPlaceholder } from '@/components/investor/investor-placeholder'

export default function InvestorTheAskPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">The Ask</h1>
      <InvestorPlaceholder
        icon={Target}
        title="Coming soon"
        description="Round size, use of funds, and terms will appear here."
      />
    </div>
  )
}
