import { createHmac, timingSafeEqual } from 'crypto'

export function generateUnsubscribeToken(profileId: string, documentId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not configured')
  return createHmac('sha256', secret).update(`${profileId}:${documentId}`).digest('hex')
}

export function verifyUnsubscribeToken(profileId: string, documentId: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(profileId, documentId)
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(token, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
