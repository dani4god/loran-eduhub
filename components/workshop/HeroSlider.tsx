// components/workshop/HeroSlider.tsx
'use client'

import { useEffect, useState } from 'react'

export default function HeroSlider({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 5000)
    return () => clearInterval(timer)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-xl mb-10 bg-gray-900"
      style={{ height: 'clamp(360px, 80vh, 640px)' }}
    >
      {/* Blurred backdrop fills the frame regardless of the real image's
          orientation — always covers, so it never shows gaps. */}
      {images[index] && (
        <div
          className="absolute inset-0 opacity-50 blur-2xl scale-110"
          style={{
            backgroundImage: `url(${images[index]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Each slide is centered and sized by its OWN natural aspect ratio
          (via object-contain, no forced box shape) — a portrait flyer
          fills the height properly instead of shrinking to a landscape
          frame's width. */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Workshop visual ${i + 1}`}
            className={`absolute max-h-full max-w-full object-contain transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}