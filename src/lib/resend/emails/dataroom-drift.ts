import { emailLayout, h1, para, ctaButton, divider, label, value } from './layout'

export interface DriftedDoc {
  id: string
  title: string
  section: string
  audience: string
  source_name: string | null
  source_version: string | null
  content_status: string
}

export function dataroomDriftEmail(props: {
  adminName: string
  driftedDocs: DriftedDoc[]
  runAt: string
  dataRoomUrl: string
}): { subject: string; html: string; text: string } {
  const { adminName, driftedDocs, runAt, dataRoomUrl } = props
  const firstName = adminName.split(' ')[0]
  const n = driftedDocs.length
  const runDate = new Date(runAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Phoenix',
  })

  const docRows = driftedDocs.map(doc => {
    const statusLabel = doc.content_status === 'source_missing' ? 'Source missing' : 'Content changed'
    const sourceInfo = doc.source_name
      ? `${doc.source_name}${doc.source_version ? ` (${doc.source_version})` : ''}`
      : 'Source unknown'
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e6e0;font-size:14px;color:#1a1a1a;">${doc.title}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e6e0;font-size:13px;color:#6b6b5a;text-transform:capitalize;">${doc.section}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e6e0;font-size:13px;color:#9a4a2a;font-weight:500;">${statusLabel}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e6e0;font-size:12px;color:#6b6b5a;">${sourceInfo}</td>
    </tr>`
  }).join('')

  const html = emailLayout(`
    ${h1(`Data room attention needed, ${firstName}.`)}
    ${para(`The daily audit on ${runDate} found <strong>${n} document${n === 1 ? '' : 's'}</strong> in the investor data room that ${n === 1 ? 'is' : 'are'} out of sync with ${n === 1 ? 'its' : 'their'} canonical source.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
      <thead>
        <tr style="background:#f8f7f4;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9a8a;border-bottom:2px solid #e8e6e0;">Document</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9a8a;border-bottom:2px solid #e8e6e0;">Section</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9a8a;border-bottom:2px solid #e8e6e0;">Status</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9a8a;border-bottom:2px solid #e8e6e0;">Source</th>
        </tr>
      </thead>
      <tbody>${docRows}</tbody>
    </table>
    ${label('Next step')}
    ${value('For each stale document: export the updated source from Drive, update manifest.json, run --check, then --publish.')}
    ${divider()}
    ${ctaButton('View Data Room Status', dataRoomUrl)}
  `)

  const textLines = driftedDocs.map(doc => {
    const statusLabel = doc.content_status === 'source_missing' ? 'Source missing' : 'Content changed'
    return `  - ${doc.title} [${doc.section}] — ${statusLabel}`
  }).join('\n')

  const text = [
    `Data room attention needed, ${firstName}.`,
    '',
    `The daily audit on ${runDate} found ${n} document${n === 1 ? '' : 's'} out of sync:`,
    textLines,
    '',
    'For each stale document: export the updated source from Drive, update manifest.json,',
    'run --check, then --publish.',
    '',
    `View data room status: ${dataRoomUrl}`,
  ].join('\n')

  return {
    subject: `Data Room: ${n} document${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} attention`,
    html,
    text,
  }
}
