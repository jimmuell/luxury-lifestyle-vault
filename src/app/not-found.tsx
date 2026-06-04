import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
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
          Page not found
        </h1>
        <p
          className="text-sm"
          style={{ color: 'rgba(248, 244, 238, 0.55)' }}
        >
          The page you&apos;re looking for isn&apos;t in the vault.
        </p>
      </div>

      <Link
        href="/"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
        style={{
          borderColor: '#C9A96E',
          color: '#C9A96E',
          backgroundColor: 'transparent',
        }}
      >
        Return home
      </Link>
    </div>
  )
}
