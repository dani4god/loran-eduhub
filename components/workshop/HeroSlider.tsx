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
    <div className="relative w-full h-56 sm:h-72 lg:h-96 rounded-3xl overflow-hidden shadow-xl mb-10">
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={`Workshop visual ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
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