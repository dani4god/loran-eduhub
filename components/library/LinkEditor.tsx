// components/library/LinkEditor.tsx
'use client'

import { useState } from 'react'
import { Plus, X, Link as LinkIcon } from 'lucide-react'

interface LinkItem {
  _id?: string
  label: string
  url: string
}

export default function LinkEditor({
  links,
  onChange,
}: {
  links: LinkItem[]
  onChange: (links: LinkItem[]) => void
}) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const addLink = () => {
    if (!label.trim() || !url.trim()) return
    onChange([...links, { label: label.trim(), url: url.trim() }])
    setLabel('')
    setUrl('')
  }

  const removeLink = (idx: number) => {
    onChange(links.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        External Links
      </p>

      {links.length > 0 && (
        <div className="space-y-1.5">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <LinkIcon size={13} className="text-blue-500 shrink-0" />
              <span className="font-medium text-gray-700 truncate">{link.label}</span>
              <span className="text-gray-400 truncate flex-1">{link.url}</span>
              <button onClick={() => removeLink(idx)} type="button" className="text-gray-400 hover:text-red-500 shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Link label (e.g. Watch video)"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2"
        />
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2"
        />
        <button
          onClick={addLink}
          type="button"
          className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shrink-0"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  )
}