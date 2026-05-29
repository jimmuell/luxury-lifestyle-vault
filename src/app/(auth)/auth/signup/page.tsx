import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Luxury Lifestyle Vault
          </p>
          <h1 className="font-serif text-3xl font-light">Request membership</h1>
          <p className="text-sm text-muted-foreground">
            Founding member access is by invitation.
          </p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-muted-foreground">
          Already a member?{' '}
          <Link href="/auth/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
