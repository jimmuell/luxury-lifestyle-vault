import * as Sentry from '@sentry/nextjs'

export async function withSentryCapture<T>(
  fn: () => Promise<T>,
  functionId: string
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    Sentry.withScope((scope) => {
      scope.setTag('inngest.function_id', functionId)
      scope.setContext('inngest', { functionId })
      Sentry.captureException(err)
    })
    throw err
  }
}
