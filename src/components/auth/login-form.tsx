'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn, sendMagicLink } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

const DEV_ADMIN_EMAIL = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL

type QuickAccount = {
  label: string
  email: string
  password: string | null
}

const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true'

const QUICK_ACCOUNTS: QuickAccount[] = [
  ...(DEMO_LOGIN_ENABLED
    ? [
        { label: 'Demo — Admin',                   email: 'demo.admin@llv.dev',  password: 'demo1234' },
        { label: 'Demo — Client (fully onboarded)', email: 'demo.client@llv.dev', password: 'demo1234' },
      ]
    : []),
  ...(DEV_ADMIN_EMAIL
    ? [{ label: `Admin — ${DEV_ADMIN_EMAIL}`, email: DEV_ADMIN_EMAIL, password: null }]
    : []),
  { label: 'Client 1 — Margaret Hartwell', email: 'client1@test.llv.com', password: 'TestLLV2026!' },
  { label: 'Client 2 — Catherine Beaumont', email: 'client2@test.llv.com', password: 'TestLLV2026!' },
  { label: 'Client 3 — James Thornton', email: 'client3@test.llv.com', password: 'TestLLV2026!' },
  { label: 'Client 4 — Victoria Simmons', email: 'client4@test.llv.com', password: 'TestLLV2026!' },
  { label: 'Client 5 — Robert Whitmore', email: 'client5@test.llv.com', password: 'TestLLV2026!' },
  { label: 'Provider — RAVE FabriCARE', email: 'care@ravefabricare.com', password: 'TestLLV2026!' },
  { label: 'Provider — European Couture Cleaners', email: 'sophia@europeancouture.com', password: 'TestLLV2026!' },
]

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : children}
    </Button>
  )
}

export function LoginForm() {
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  function handleQuickSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = Number(e.target.value)
    if (isNaN(idx)) return
    const account = QUICK_ACCOUNTS[idx]
    if (!account) return
    setEmail(account.email)
    setPassword(account.password ?? '')
    setMessage(null)
  }

  async function handlePasswordLogin(formData: FormData) {
    setMessage(null)
    const result = await signIn(formData)
    if (result?.error != null) {
      setMessage({ type: 'error', text: result.error })
    }
  }

  async function handleMagicLink(formData: FormData) {
    setMessage(null)
    const result = await sendMagicLink(formData)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error ?? 'Unknown error' })
    } else {
      setMessage({ type: 'success', text: result.success })
    }
  }

  return (
    <div className="space-y-6">
      {/* Dev quick-select — gated by NEXT_PUBLIC_ENABLE_DEMO_LOGIN, not NODE_ENV */}
      {DEMO_LOGIN_ENABLED && (
        <div className="rounded-md border border-dashed border-border px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-widest uppercase font-mono text-muted-foreground border border-border rounded px-1 py-0.5">
              DEV
            </span>
            <span className="text-xs text-muted-foreground">Quick login</span>
          </div>
          <select
            onChange={handleQuickSelect}
            defaultValue=""
            className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="" disabled>Select a test account…</option>
            {QUICK_ACCOUNTS.map((account, i) => (
              <option key={account.email} value={i}>
                {account.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <p
          className={`text-sm text-center px-4 py-3 rounded-md ${
            message.type === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-accent/10 text-foreground'
          }`}
        >
          {message.text}
        </p>
      )}

      {mode === 'password' ? (
        <form action={handlePasswordLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <SubmitButton>Sign in</SubmitButton>
        </form>
      ) : (
        <form action={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-magic">Email</Label>
            <Input
              id="email-magic"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <SubmitButton>Send magic link</SubmitButton>
        </form>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'password' ? 'magic' : 'password')
          setMessage(null)
        }}
        className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        {mode === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
      </button>
    </div>
  )
}
