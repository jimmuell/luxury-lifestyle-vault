import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.SEED_TOOLS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  throw new Error('[LLV] Sentry smoke test — intentional server error from /api/_sentry-test')
}
