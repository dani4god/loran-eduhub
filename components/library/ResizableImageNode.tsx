// components/library/ResizableImageNode.tsx
'use client'

import { useState, useRef } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Crop } from 'lucide-react'
import ImageCropModal from './ImageCropModal'

export default function ResizableImageNode({ node, updateAttributes, selected }: NodeViewProps) {
  const [cropOpen, setCropOpen] = useState(false)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  const width = node.attrs.width || null

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault()
    const img = (e.currentTarget.parentElement as HTMLElement)?.querySelector('img')
    const startWidth = img?.getBoundingClientRect().width || 300
    dragState.current = { startX: e.clientX, startWidth }

    const onMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) return
      const delta = moveEvent.clientX - dragState.current.startX
      const newWidth = Math.max(80, Math.round(dragState.current.startWidth + delta))
      updateAttributes({ width: newWidth })
    }
    const onUp = () => {
      dragState.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const setPreset = (percent: number | null) => {
    if (percent === null) { updateAttributes({ width: null }); return }
    updateAttributes({ width: Math.round(600 * (percent / 100)) }) // 600 ≈ editor content width
  }

  return (
    <NodeViewWrapper as="span" className="inline-block relative align-top">
      <span className={`relative inline-block group ${selected ? 'ring-2 ring-blue-400 rounded' : ''}`}>
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={width ? { width: `${width}px`, height: 'auto' } : { maxWidth: '100%' }}
          className="rounded-lg block"
        />

        {/* Hover toolbar */}
        <span className="absolute top-1.5 left-1.5 hidden group-hover:flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg p-1">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded hover:bg-white/20"
            >
              {p}%
            </button>
          ))}
          <button type="button" onClick={() => setCropOpen(true)} className="p-1 rounded hover:bg-white/20" title="Crop image">
            <Crop size={12} className="text-white" />
          </button>
        </span>

        {/* Drag handle */}
        <span
          onPointerDown={startResize}
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-tl-md rounded-br-lg cursor-nwse-resize opacity-0 group-hover:opacity-100"
        />
      </span>

      {cropOpen && (
        <ImageCropModal
          src={node.attrs.src}
          onClose={() => setCropOpen(false)}
          onCropped={(newUrl) => { updateAttributes({ src: newUrl }); setCropOpen(false) }}
        />
      )}
    </NodeViewWrapper>
  )
}