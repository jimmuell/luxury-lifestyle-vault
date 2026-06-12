import { createHmac } from 'crypto'

export function generateUnsubscribeToken(profileId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? ''
  return createHmac('sha256', secret).update(profileId).digest('hex')
}

export function verifyUnsubscribeToken(profileId: string, token: string): boolean {
  return generateUnsubscribeToken(profileId) === token
}
