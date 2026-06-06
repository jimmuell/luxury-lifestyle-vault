import { NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'
import { SMS_HELP_REPLY } from '@/lib/sms/consent'

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const START_KEYWORDS = new Set(['START', 'UNSTOP'])

async function findProfileByPhone(phone: string): Promise<string | null> {
  const adminSupabase = createAdminClient()

  // Try exact match first (E.164 as stored)
  const { data: exact } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (exact) return exact.id

  // Try normalised E.164: strip non-digits, take last 10, prefix +1
  const digits = phone.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  if (last10.length < 10) return null

  const e164 = `+1${last10}`
  if (e164 === phone) return null // already tried this

  const { data: normalised } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('phone', e164)
    .maybeSingle()

  return normalised?.id ?? null
}

async function setConsent(profileId: string, enabled: boolean) {
  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('client_profiles')
    .update({
      sms_consent: enabled,
      sms_consent_at: enabled ? new Date().toISOString() : null,
      sms_consent_source: enabled ? 'inbound_start' : null,
    })
    .eq('profile_id', profileId)
}

export async function POST(req: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    return new NextResponse(null, { status: 500 })
  }

  // Twilio sends form-encoded bodies
  const rawBody = await req.text()
  const params = Object.fromEntries(new URLSearchParams(rawBody))

  // Validate Twilio signature
  const sig = req.headers.get('x-twilio-signature') ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const webhookUrl = new URL('/api/webhooks/twilio', appUrl).toString()

  const isValid = validateRequest(authToken, sig, webhookUrl, params)
  if (!isValid) {
    return new NextResponse(null, { status: 403 })
  }

  const from: string = params['From'] ?? ''
  const body: string = (params['Body'] ?? '').trim().toUpperCase()

  if (STOP_KEYWORDS.has(body)) {
    const profileId = await findProfileByPhone(from)
    if (profileId) await setConsent(profileId, false)
    return new NextResponse(null, { status: 204 })
  }

  if (START_KEYWORDS.has(body)) {
    const profileId = await findProfileByPhone(from)
    if (profileId) await setConsent(profileId, true)
    return new NextResponse(null, { status: 204 })
  }

  if (body === 'HELP') {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${SMS_HELP_REPLY}</Message></Response>`
    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  return new NextResponse(null, { status: 204 })
}
