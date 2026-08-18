// components/self-paced/SelfPacedContent.tsx
'use client'

interface SelfPacedContentProps {
  html: string
}

export default function SelfPacedContent({ html }: SelfPacedContentProps) {
  return (
    <div 
      className="sp-content max-w-full overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  )
}