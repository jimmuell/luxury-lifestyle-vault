import { Mail } from 'lucide-react'
import { InvestorPlaceholder } from '@/components/investor/investor-placeholder'

export default function InvestorContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Contact</h1>
      <InvestorPlaceholder
        icon={Mail}
        title="Coming soon"
        description="Request a meeting or ask a question here."
      />
    </div>
  )
}
