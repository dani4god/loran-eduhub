// components/home/AdCorner.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink, Megaphone } from 'lucide-react'

interface Ad {
  _id: string
  title: string
  message: string
  imageUrl: string | null
  linkUrl: string | null
  linkLabel: string
}

const DISMISS_KEY = 'loran-dismissed-ads'

export default function AdCorner() {
  const [ads, setAds] = useState<Ad[]>([])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    fetch('/api/ads')
      .then((r) => r.json())
      .then((d) => {
        const dismissed: string[] = JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')
        const active = (d.ads || []).filter((a: Ad) => !dismissed.includes(a._id))
        if (active.length > 0) {
          setAds(active)
          setTimeout(() => { setVisible(true); requestAnimationFrame(() => setEntered(true)) }, 1200)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), 8000)
    return () => clearInterval(timer)
  }, [ads.length])

  const dismiss = () => {
    const dismissed: string[] = JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')
    const current = ads[index]
    if (current) {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed, current._id]))
    }
    setEntered(false)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible || ads.length === 0) return null
  const ad = ads[index]
  if (!ad) return null

  return (
    <div
      className={`fixed z-40 bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm transition-all duration-300 ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/30 border border-gray-100 overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <X size={14} className="text-white" />
        </button>

        {ad.imageUrl ? (
          <div className="relative h-32 sm:h-36 w-full">
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : (
          <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600" />
        )}

        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Megaphone size={12} className="text-blue-500" />
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Sponsored</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm mb-1 pr-2">{ad.title}</h3>
          {ad.message && <p className="text-xs text-gray-500 leading-relaxed mb-3">{ad.message}</p>}

          {ad.linkUrl && (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              {ad.linkLabel} <ExternalLink size={11} />
            </a>
          )}

          {ads.length > 1 && (
            <div className="flex items-center gap-1 mt-3">
              {ads.map((_, i) => (
                <span key={i} className={`h-1 rounded-full transition-all ${i === index ? 'w-4 bg-blue-500' : 'w-1 bg-gray-200'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}