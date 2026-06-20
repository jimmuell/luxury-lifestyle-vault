import { google } from 'googleapis'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

// Folder id for temporary Google Doc conversions (SA has Editor access).
export const CONVERSION_FOLDER_ID = '1JRVNMZ-bHaC0ZbiNPoxIUf_OzeSb-eRn'

// Orphan cutoff: temp Docs older than this are stale and should be deleted.
export const ORPHAN_MAX_AGE_MS = 30 * 60 * 1000

function parseServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY env var is not set')
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON')
  }
}

export function createDriveClient() {
  const key = parseServiceAccountKey()
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [DRIVE_SCOPE],
  })
  return google.drive({ version: 'v3', auth })
}

export type DriveClient = ReturnType<typeof createDriveClient>

export const MIME = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf:  'application/pdf',
  gDoc: 'application/vnd.google-apps.document',
  gSlides: 'application/vnd.google-apps.presentation',
} as const
