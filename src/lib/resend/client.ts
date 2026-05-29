import { Resend } from 'resend'

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@luxurylifestylevault.com'
export const FROM_NAME = 'Luxury Lifestyle Vault'

export const isDevMode = process.env.RESEND_DEV_MODE === 'true' || !process.env.RESEND_API_KEY

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}
