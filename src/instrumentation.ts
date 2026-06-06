export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    })
  }
}

export async function onRequestError(
  err: Error,
  _request: { path: string; method: string; headers: Record<string, string> },
  _context: { routerKind: string; routeType: string; routePath: string }
): Promise<void> {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureException(err)
}
