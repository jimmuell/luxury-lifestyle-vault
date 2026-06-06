export type LegalNodeType =
  | 'draft-notice'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'hr'
  | 'list-item'
  | 'paragraph'

export interface LegalNode {
  type: LegalNodeType
  text: string
}

export function parseLegalMarkdown(content: string): LegalNode[] {
  const nodes: LegalNode[] = []

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('**DRAFT') || line.startsWith('Prepared by Cowork')) {
      nodes.push({ type: 'draft-notice', text: line })
    } else if (line.startsWith('### ')) {
      nodes.push({ type: 'heading3', text: line.slice(4) })
    } else if (line.startsWith('## ')) {
      nodes.push({ type: 'heading2', text: line.slice(3) })
    } else if (line.startsWith('# ')) {
      nodes.push({ type: 'heading1', text: line.slice(2) })
    } else if (line === '---') {
      nodes.push({ type: 'hr', text: '' })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push({ type: 'list-item', text: line.slice(2) })
    } else {
      nodes.push({ type: 'paragraph', text: line })
    }
  }

  return nodes
}
