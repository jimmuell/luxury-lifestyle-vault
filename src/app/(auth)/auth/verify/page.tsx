import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
          Luxury Lifestyle Vault
        </p>
        <h1 className="font-serif text-3xl font-light">Check your inbox</h1>
        <p className="text-muted-foreground leading-relaxed">
          We&apos;ve sent you a confirmation link. Click it to complete your account setup.
        </p>
        <Link
          href="/auth/login"
          className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
