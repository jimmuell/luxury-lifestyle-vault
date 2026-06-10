// Server-only. Uses admin client to mint short-lived signed URLs for the
// private investor-room bucket. Never import from a Client Component.

import { createAdminClient } from '@/lib/supabase/admin'
import { INVESTOR_BUCKET, SIGNED_URL_TTL } from './constants'

export async function getInvestorDocSignedUrl(
  storagePath: string,
  expiresIn = SIGNED_URL_TTL,
  downloadName?: string
): Promise<string> {
  const sb = createAdminClient()
  const { data, error } = await sb.storage
    .from(INVESTOR_BUCKET)
    .createSignedUrl(storagePath, expiresIn, downloadName ? { download: downloadName } : undefined)
  if (error) throw new Error(`Failed to sign investor doc URL: ${error.message}`)
  return data.signedUrl
}
