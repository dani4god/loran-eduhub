'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FaqItem { question: string; answer: string }

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-gray-900">{item.question}</span>
              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 sm:px-5 pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {item.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}