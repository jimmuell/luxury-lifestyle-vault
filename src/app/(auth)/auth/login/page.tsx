import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { SiteFooter } from '@/components/shared/site-footer'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Luxury Lifestyle Vault
            </p>
            <h1 className="font-serif text-3xl font-light">Welcome back</h1>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
            New member?{' '}
            <Link href="/auth/signup" className="underline underline-offset-4 hover:text-foreground">
              Request access
            </Link>
          </p>

        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
