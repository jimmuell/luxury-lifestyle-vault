/**
 * One-time script — mint a Google OAuth refresh token for Drive access.
 * Runs locally; never imported by app code.
 *
 * Usage:
 *   GOOGLE_OAUTH_CLIENT_ID=<id> GOOGLE_OAUTH_CLIENT_SECRET=<secret> node scripts/mint-drive-token.mjs
 *
 * Prerequisites:
 *   1. GCP project with Google Drive API enabled.
 *   2. OAuth 2.0 "Desktop app" client credentials (Client ID + Secret).
 *   3. Add http://127.0.0.1 (any port) to "Authorised redirect URIs" in GCP Console.
 *   4. Share the LLV vault folder (Viewer) and "98 Document Conversion" folder (Editor)
 *      with the Google account you sign in with.
 *
 * After running, copy the printed refresh_token into:
 *   - .env (local): GOOGLE_OAUTH_REFRESH_TOKEN=<token>
 *   - Vercel Production env vars: GOOGLE_OAUTH_REFRESH_TOKEN=<token>
 */

import http from 'http'
import { URL } from 'url'
import { google } from 'googleapis'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Error: GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set.')
  process.exit(1)
}

// Pick a random ephemeral port for the loopback redirect.
const server = http.createServer()
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const { port } = server.address()
const redirectUri = `http://127.0.0.1:${port}`

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: DRIVE_SCOPE,
})

console.log('\nOpen this URL in your browser to authorise Drive access:')
console.log('\n' + authUrl + '\n')

// Try to auto-open; fall back silently if unavailable.
try {
  const { default: open } = await import('open').catch(() => ({ default: null }))
  if (open) await open(authUrl)
} catch {
  // ignore — URL already printed above
}

// Wait for the loopback redirect with ?code=...
const code = await new Promise((resolve, reject) => {
  server.once('request', (req, res) => {
    const url = new URL(req.url, redirectUri)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    res.writeHead(200, { 'Content-Type': 'text/html' })
    if (code) {
      res.end('<h2>Authorised — you can close this tab.</h2>')
      resolve(code)
    } else {
      res.end(`<h2>Error: ${error ?? 'unknown'}</h2>`)
      reject(new Error(`OAuth error: ${error ?? 'unknown'}`))
    }
  })
})

server.close()

const { tokens } = await oauth2.getToken(code)

if (!tokens.refresh_token) {
  console.error('\nNo refresh_token returned. Make sure you included prompt=consent and access_type=offline,')
  console.error('and that this is a fresh authorisation (revoke existing access at myaccount.google.com/permissions first).')
  process.exit(1)
}

console.log('\n✓ Refresh token minted successfully.\n')
console.log('Add the following to your .env and to Vercel Production env vars:\n')
console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`)
console.log('')
