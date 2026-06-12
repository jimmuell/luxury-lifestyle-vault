import { createHmac } from 'crypto'

export function generateUnsubscribeToken(profileId: string, documentId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not configured')
  return createHmac('sha256', secret).update(`${profileId}:${documentId}`).digest('hex')
}

export function verifyUnsubscribeToken(profileId: string, documentId: string, token: string): boolean {
  return generateUnsubscribeToken(profileId, documentId) === token
}
