'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Request access'}
    </Button>
  )
}

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(formData: FormData) {
    setError(null)
    const result = await signUp(formData)
    if ('error' in result) {
      setError(result.error ?? 'Unknown error')
    } else {
      router.push('/auth/verify')
    }
  }

  return (
    <form action={handleSignup} className="space-y-4">
      {error && (
        <p className="text-sm text-center px-4 py-3 rounded-md bg-destructive/10 text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" type="text" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>
      <SubmitButton />
    </form>
  )
}
