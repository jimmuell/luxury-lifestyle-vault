import { google } from 'googleapis'

// Folder id for temporary Google Doc conversions (founder has Editor access).
export const CONVERSION_FOLDER_ID = '1JRVNMZ-bHaC0ZbiNPoxIUf_OzeSb-eRn'

// Orphan cutoff: temp Docs older than this are stale and should be deleted.
export const ORPHAN_MAX_AGE_MS = 30 * 60 * 1000

export function createDriveClient() {
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN

  if (!clientId)     throw new Error('GOOGLE_OAUTH_CLIENT_ID env var is not set')
  if (!clientSecret) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET env var is not set')
  if (!refreshToken) throw new Error('GOOGLE_OAUTH_REFRESH_TOKEN env var is not set')

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })
  return google.drive({ version: 'v3', auth: oauth2 })
}

export type DriveClient = ReturnType<typeof createDriveClient>

export const MIME = {
  docx:    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx:    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf:     'application/pdf',
  gDoc:    'application/vnd.google-apps.document',
  gSlides: 'application/vnd.google-apps.presentation',
} as const
