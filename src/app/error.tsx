'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { buttonVariants } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 gap-8"
      style={{ backgroundColor: '#0A0A0A', color: '#F8F4EE' }}
    >
      <Image
        src="/brand/llv-card.png"
        alt="Luxury Lifestyle Vault membership card"
        width={1536}
        height={1024}
        className="w-full max-w-[400px] h-auto rounded-xl shadow-2xl"
      />

      <div className="text-center space-y-3">
        <p
          className="text-[10px] tracking-[0.3em] uppercase"
          style={{ color: '#C9A96E' }}
        >
          Luxury Lifestyle Vault
        </p>
        <h1
          className="font-serif text-4xl font-light"
          style={{ color: '#F8F4EE' }}
        >
          Something went wrong
        </h1>
        <p
          className="text-sm"
          style={{ color: 'rgba(248, 244, 238, 0.55)' }}
        >
          We hit an unexpected issue. Your vault and its contents are safe.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          style={{
            borderColor: '#C9A96E',
            color: '#C9A96E',
            backgroundColor: 'transparent',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          style={{ color: 'rgba(248, 244, 238, 0.55)' }}
        >
          Return home
        </Link>
      </div>
    </div>
  )
}
