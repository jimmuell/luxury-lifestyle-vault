function escapeCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function objectsToCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return ''
  const keys = columns ?? Object.keys(rows[0])
  const header = keys.join(',')
  const body = rows.map(row => keys.map(k => escapeCell(row[k])).join(',')).join('\n')
  return `${header}\n${body}`
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
