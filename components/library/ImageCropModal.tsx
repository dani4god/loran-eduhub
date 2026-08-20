// components/library/ImageCropModal.tsx
'use client'

import { useRef, useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'

interface Props {
  src: string
  onClose: () => void
  onCropped: (newUrl: string) => void
}

export default function ImageCropModal({ src, onClose, onCropped }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState({ x: 20, y: 20, w: 200, h: 150 })
  const dragging = useRef<{ mode: 'move' | 'resize'; startX: number; startY: number; orig: typeof rect } | null>(null)
  const [processing, setProcessing] = useState(false)

  const startDrag = (mode: 'move' | 'resize') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...rect } }

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return
      const dx = ev.clientX - dragging.current.startX
      const dy = ev.clientY - dragging.current.startY
      const bounds = containerRef.current?.getBoundingClientRect()
      if (!bounds) return

      if (dragging.current.mode === 'move') {
        setRect((r) => ({
          ...r,
          x: Math.max(0, Math.min(bounds.width - r.w, dragging.current!.orig.x + dx)),
          y: Math.max(0, Math.min(bounds.height - r.h, dragging.current!.orig.y + dy)),
        }))
      } else {
        setRect((r) => ({
          ...r,
          w: Math.max(40, Math.min(bounds.width - r.x, dragging.current!.orig.w + dx)),
          h: Math.max(40, Math.min(bounds.height - r.y, dragging.current!.orig.h + dy)),
        }))
      }
    }
    const onUp = () => {
      dragging.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const applyCrop = async () => {
    const img = imgRef.current
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!img || !bounds) return

    setProcessing(true)
    try {
      const scaleX = img.naturalWidth / bounds.width
      const scaleY = img.naturalHeight / bounds.height

      const canvas = document.createElement('canvas')
      canvas.width = rect.w * scaleX
      canvas.height = rect.h * scaleY
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(
        img,
        rect.x * scaleX, rect.y * scaleY, rect.w * scaleX, rect.h * scaleY,
        0, 0, canvas.width, canvas.height
      )

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return

      const formData = new FormData()
      formData.append('file', blob, 'cropped.png')
      formData.append('type', 'image')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) onCropped(data.url)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 max-w-lg w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Crop Image</p>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div ref={containerRef} className="relative select-none" style={{ maxHeight: '60vh', overflow: 'hidden' }}>
          <img ref={imgRef} src={src} alt="" className="w-full block pointer-events-none" draggable={false} />
          <div className="absolute inset-0 bg-black/40" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${rect.y}px, ${rect.x + rect.w}px ${rect.y}px, ${rect.x + rect.w}px ${rect.y + rect.h}px, ${rect.x}px ${rect.y + rect.h}px, ${rect.x}px ${rect.y}px, 0 ${rect.y}px)` }} />
          <div
            onPointerDown={startDrag('move')}
            className="absolute border-2 border-blue-500 cursor-move"
            style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          >
            <div
              onPointerDown={startDrag('resize')}
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize"
            />
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-2">Drag the box to reposition, drag the bottom-right dot to resize.</p>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 text-gray-600 border border-gray-200 rounded-lg text-sm font-semibold">Cancel</button>
          <button onClick={applyCrop} disabled={processing} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}