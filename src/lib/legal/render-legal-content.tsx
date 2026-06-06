import type React from 'react'
import Link from 'next/link'
import type { LegalNode } from '@/lib/legal/parse-markdown'

function renderInline(text: string): React.ReactNode {
  // Matches **bold**, `code`, [label](url) — in that priority order
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={match.index} className="text-xs font-mono bg-muted px-1 rounded">
          {match[2]}
        </code>
      )
    } else if (match[3] !== undefined) {
      parts.push(
        <Link key={match.index} href={match[4]!} className="underline underline-offset-2 hover:text-foreground">
          {match[3]}
        </Link>
      )
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

type GroupedBlock =
  | { kind: 'draft-notice'; items: LegalNode[] }
  | { kind: 'list'; items: LegalNode[] }
  | { kind: 'single'; node: LegalNode }

function groupNodes(nodes: LegalNode[]): GroupedBlock[] {
  const blocks: GroupedBlock[] = []
  let i = 0
  while (i < nodes.length) {
    const node = nodes[i]
    if (node.type === 'draft-notice') {
      const items: LegalNode[] = [node]
      while (i + 1 < nodes.length && nodes[i + 1].type === 'draft-notice') {
        i++
        items.push(nodes[i])
      }
      blocks.push({ kind: 'draft-notice', items })
    } else if (node.type === 'list-item') {
      const items: LegalNode[] = [node]
      while (i + 1 < nodes.length && nodes[i + 1].type === 'list-item') {
        i++
        items.push(nodes[i])
      }
      blocks.push({ kind: 'list', items })
    } else {
      blocks.push({ kind: 'single', node })
    }
    i++
  }
  return blocks
}

interface LegalContentProps {
  nodes: LegalNode[]
}

export function LegalContent({ nodes }: LegalContentProps) {
  const blocks = groupNodes(nodes)

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIdx) => {
        if (block.kind === 'draft-notice') {
          return (
            <div
              key={blockIdx}
              className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-1 text-sm text-amber-800"
            >
              {block.items.map((item, i) => (
                <p key={i} className="text-sm text-amber-800">
                  {renderInline(item.text)}
                </p>
              ))}
            </div>
          )
        }

        if (block.kind === 'list') {
          return (
            <ul key={blockIdx} className="list-disc pl-5 space-y-1 text-sm">
              {block.items.map((item, i) => (
                <li key={i} className="text-sm leading-relaxed text-foreground">
                  {renderInline(item.text)}
                </li>
              ))}
            </ul>
          )
        }

        // Single node
        const { node } = block

        if (node.type === 'heading1') {
          return (
            <h1 key={blockIdx} className="font-serif text-3xl font-light mb-2">
              {renderInline(node.text)}
            </h1>
          )
        }
        if (node.type === 'heading2') {
          return (
            <h2
              key={blockIdx}
              className="font-serif text-xl font-normal mt-8 mb-2 border-b border-border pb-1"
            >
              {renderInline(node.text)}
            </h2>
          )
        }
        if (node.type === 'heading3') {
          return (
            <h3 key={blockIdx} className="font-serif text-base font-medium mt-4 mb-1 text-muted-foreground">
              {renderInline(node.text)}
            </h3>
          )
        }
        if (node.type === 'hr') {
          return <hr key={blockIdx} className="my-6 border-border" />
        }
        if (node.type === 'paragraph') {
          return (
            <p key={blockIdx} className="text-sm leading-relaxed text-foreground">
              {renderInline(node.text)}
            </p>
          )
        }
        return null
      })}
    </div>
  )
}
