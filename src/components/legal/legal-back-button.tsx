'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function LegalBackButton() {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleBack}
      className={buttonVariants({ variant: 'ghost' }) + ' gap-2 -ml-2 mb-6'}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  )
}
