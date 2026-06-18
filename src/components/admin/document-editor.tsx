'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, Edit3, Upload, FileText } from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { HOUSE_CSS, buildDocHtml } from '@/lib/docs/house-style'
import { createDocument, saveDocument, uploadDocumentPdf } from '@/actions/admin-documents'

marked.setOptions({ gfm: true, breaks: false })

interface Category {
  id: string
  key: string
  label: string
}

interface DocumentData {
  id: string
  title: string
  category_id: string
  audience: string
  doc_type: string
  body_markdown: string | null
  source_kind: string
  status: string
  sort_order: number
  current_version: number
}

interface DocumentEditorProps {
  categories: Category[]
  doc?: DocumentData
}

const LABEL_CLASS = 'block text-xs font-medium text-muted-foreground uppercase tracking-[0.1em] mb-1'
const INPUT_CLASS = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
const SELECT_CLASS = INPUT_CLASS

export function DocumentEditor({ categories, doc }: DocumentEditorProps) {
  const router = useRouter()
  const [saving, startSaving] = useTransition()
  const [uploading, startUploading] = useTransition()

  const [title, setTitle]               = useState(doc?.title ?? '')
  const [categoryId, setCategoryId]     = useState(doc?.category_id ?? (categories[0]?.id ?? ''))
  const [audience, setAudience]         = useState(doc?.audience ?? 'investor')
  const docType                         = doc?.doc_type ?? 'document'
  const [sourceKind, setSourceKind]     = useState(doc?.source_kind ?? 'markdown')
  const [body, setBody]                 = useState(doc?.body_markdown ?? '')
  const [sortOrder, setSortOrder]       = useState(doc?.sort_order ?? 0)
  const [activeTab, setActiveTab]       = useState<'edit' | 'preview'>('edit')

  const previewHtml = useCallback(() => {
    const raw = marked.parse(body) as string
    // DOMPurify requires the browser DOM; safe in a 'use client' component.
    const bodyHtml = typeof window !== 'undefined' ? DOMPurify.sanitize(raw) : raw
    return buildDocHtml({ title: title || 'Untitled', bodyHtml })
  }, [title, body])

  function handleSave() {
    const fd = new FormData()
    if (doc) fd.append('id', doc.id)
    fd.append('title', title)
    fd.append('category_id', categoryId)
    fd.append('audience', audience)
    fd.append('doc_type', docType)
    fd.append('source_kind', sourceKind)
    fd.append('body_markdown', body)
    fd.append('sort_order', String(sortOrder))

    startSaving(async () => {
      try {
        const result = doc
          ? await saveDocument(fd)
          : await createDocument(fd)

        if ('error' in result && result.error) {
          toast.error(result.error)
          return
        }

        if (!doc && 'id' in result && result.id) {
          toast.success('Document created.')
          router.push(`/admin/documents/${result.id}/edit`)
        } else {
          toast.success('Draft saved.')
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
  }

  function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!doc) return
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('id', doc.id)
    fd.append('file', file)
    startUploading(async () => {
      try {
        const result = await uploadDocumentPdf(fd)
        if ('error' in result && result.error) {
          toast.error(result.error)
        } else {
          toast.success('PDF uploaded and document published.')
        }
      } catch {
        toast.error('An unexpected error occurred.')
      }
    })
    e.target.value = ''
  }

  const isCreate = !doc

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* ── metadata bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 p-5 border-b border-border bg-card rounded-t-lg">
        <div className="col-span-2 md:col-span-1">
          <label className={LABEL_CLASS}>Title <span className="text-destructive">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Document title"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Category</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={SELECT_CLASS}>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Audience</label>
          <select value={audience} onChange={e => setAudience(e.target.value)} className={SELECT_CLASS}>
            <option value="prospect">Prospect</option>
            <option value="investor">Investor</option>
            <option value="board">Board</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLASS}>Sort</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Source</label>
            <select value={sourceKind} onChange={e => setSourceKind(e.target.value)} className={SELECT_CLASS}>
              <option value="markdown">Markdown</option>
              <option value="upload">Upload</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── tab bar ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'edit'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Edit3 className="h-3 w-3" /> Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="h-3 w-3" /> Preview
        </button>

        <div className="ml-auto flex items-center gap-2">
          {sourceKind === 'upload' && doc && (
            <label className={`flex items-center gap-1.5 cursor-pointer rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="h-3 w-3" />
              {uploading ? 'Uploading…' : 'Upload PDF'}
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={handlePdfUpload}
                disabled={uploading}
              />
            </label>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title || !categoryId}
            className="rounded bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isCreate ? 'Create Draft' : 'Save Draft'}
          </button>
        </div>
      </div>

      {/* ── pane ──────────────────────────────────────────────────────────────── */}
      {activeTab === 'edit' ? (
        sourceKind === 'upload' ? (
          <div className="flex-1 flex items-center justify-center p-10 bg-card rounded-b-lg">
            <div className="text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">Upload-type document</p>
              <p className="text-xs text-muted-foreground/70 max-w-xs">
                No Markdown body — this document is published by uploading a finished PDF.
                {!doc && ' Save the draft first, then upload the PDF.'}
              </p>
            </div>
          </div>
        ) : (
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your document in Markdown…&#10;&#10;# Heading&#10;&#10;Paragraph text."
            spellCheck
            className="flex-1 w-full resize-none rounded-b-lg border-0 bg-card px-6 py-5 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-h-[520px]"
          />
        )
      ) : (
        <div className="flex-1 overflow-auto rounded-b-lg bg-[#F8F4EE] border-t-0">
          <style dangerouslySetInnerHTML={{ __html: HOUSE_CSS }} />
          <div
            dangerouslySetInnerHTML={{ __html: previewHtml() }}
          />
        </div>
      )}
    </div>
  )
}
