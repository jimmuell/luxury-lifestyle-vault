import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/shared/site-footer'

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground text-center">
          Luxury Lifestyle Vault
        </p>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
