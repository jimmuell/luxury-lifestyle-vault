'use client'

import dynamic from 'next/dynamic'

const DeckViewer = dynamic(() => import('./DeckViewer'), { ssr: false })

interface Props {
  signedUrl: string
  title: string
  downloadUrl: string
  viewerEmail: string
}

export function DeckViewerClient(props: Props) {
  return <DeckViewer {...props} />
}
