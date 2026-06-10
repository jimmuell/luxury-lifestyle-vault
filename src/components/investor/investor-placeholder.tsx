import type { LucideIcon } from 'lucide-react'

interface InvestorPlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
}

export function InvestorPlaceholder({ icon: Icon, title, description }: InvestorPlaceholderProps) {
  return (
    <div className="border border-border rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>
    </div>
  )
}
