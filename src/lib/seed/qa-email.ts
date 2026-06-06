/**
 * When SEED_QA_EMAIL is set (e.g. "you@gmail.com"), returns a plus-alias:
 *   qaEmail('client1') → "you+client1@gmail.com"
 * Falls back to account@test.llv.com when the env var is unset.
 */
export function qaEmail(account: string): string {
  const base = process.env.SEED_QA_EMAIL
  if (!base) return `${account}@test.llv.com`
  const at = base.lastIndexOf('@')
  return `${base.slice(0, at)}+${account}@${base.slice(at + 1)}`
}
