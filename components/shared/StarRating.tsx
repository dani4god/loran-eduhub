// components/shared/StarRating.tsx
'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readOnly?: boolean
}

export default function StarRating({ value, onChange, size = 16, readOnly = false }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(null)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            size={size}
            className={star <= display ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
          />
        </button>
      ))}
    </div>
  )
}