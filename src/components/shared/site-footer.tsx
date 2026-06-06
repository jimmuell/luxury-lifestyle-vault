import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-6">
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-4 flex-wrap">
        <span>© 2026 Luxury Lifestyle Vault</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
      </p>
    </footer>
  )
}
