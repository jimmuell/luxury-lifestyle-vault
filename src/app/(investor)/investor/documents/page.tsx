import { FolderOpen } from 'lucide-react'
import { InvestorPlaceholder } from '@/components/investor/investor-placeholder'

export default function InvestorDocumentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-light">Documents</h1>
      <InvestorPlaceholder
        icon={FolderOpen}
        title="Coming soon"
        description="The data room library will appear here."
      />
    </div>
  )
}
