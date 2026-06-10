import { Presentation } from 'lucide-react'
import { InvestorPlaceholder } from '@/components/investor/investor-placeholder'

export default function InvestorDeckPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Pitch Deck</h1>
      <InvestorPlaceholder
        icon={Presentation}
        title="Coming soon"
        description="The pitch deck will be embedded here."
      />
    </div>
  )
}
