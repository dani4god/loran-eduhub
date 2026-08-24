// components/tutor/ContractPopup.tsx
'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, MessageSquare, AlertCircle } from 'lucide-react'

export default function ContractPopup() {
  const [show, setShow] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    fetch('/api/tutor/contract/status')
      .then((r) => r.json())
      .then((d) => { if (!d.acknowledged) setShow(true) })
      .catch(() => {})
  }, [])

  const downloadContract = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/tutor/contract/download')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Loran-EduHub-Tutor-Agreement.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const dismiss = async () => {
    setDismissing(true)
    try {
      await fetch('/api/tutor/contract/status', { method: 'POST' })
      setShow(false)
    } finally {
      setDismissing(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 sm:p-6 text-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">Tutor Agreement</h2>
          <p className="text-blue-100 text-xs mt-1">One last step to complete your onboarding</p>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            Please download, review, and sign your Tutor Agreement below. Once signed, submit it to
            our team via the <strong>support channel on our Discord server</strong>.
          </p>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Please ensure your submitted file is <strong>under 4MB</strong> — a clear phone photo or
              scan is fine, just avoid very large image files.
            </p>
          </div>

          <button
            onClick={downloadContract}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={16} /> {downloading ? 'Preparing PDF...' : 'Download Tutor Agreement'}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
            <MessageSquare size={13} /> Submit your signed copy on Discord once ready
          </div>

          <button
            onClick={dismiss}
            disabled={dismissing}
            className="w-full py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700"
          >
            {dismissing ? '...' : "I've got it, don't show this again"}
          </button>
        </div>
      </div>
    </div>
  )
}