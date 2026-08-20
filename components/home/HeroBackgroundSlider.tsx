// components/home/HeroBackgroundSlider.tsx
'use client'

import { useEffect, useState } from 'react'

export default function HeroBackgroundSlider({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 6000)
    return () => clearInterval(t)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      {/* Gradient overlays ensure the hero text stays readable regardless
          of what the uploaded image contains, without hiding it entirely. */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/85 via-gray-950/55 to-gray-950/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 via-transparent to-gray-950/60" />
    </div>
  )
}