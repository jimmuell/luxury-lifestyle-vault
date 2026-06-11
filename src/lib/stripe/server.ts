import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia', typescript: true })
  }
  return _stripe
}

export function isTestMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false
}
