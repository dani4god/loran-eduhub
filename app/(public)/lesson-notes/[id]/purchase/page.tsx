// app/(public)/lesson-notes/[id]/purchase/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { verifyWithRetry } from '@/lib/verifyWithRetry'
import {
  Loader2,
  CheckCircle2,
  Download,
  ArrowLeft,
} from 'lucide-react'

interface PublicLessonNote {
  _id: string
  title: string
  description?: string
  coverImageUrl?: string | null
  price: number
  isFree: boolean
  subject?: string
  studentClass?: string
}

export default function LessonNotePurchasePage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const id = params.id as string

  const [note, setNote] = useState<PublicLessonNote | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [loadingNote, setLoadingNote] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [error, setError] = useState('')

  const [downloadRef, setDownloadRef] = useState<string | null>(null)

  // ============================================================
  // LOAD LESSON NOTE
  // ============================================================

  useEffect(() => {
    let cancelled = false

    const loadNote = async () => {
      try {
        setLoadingNote(true)
        setError('')

        const response = await fetch(
          `/api/lesson-notes/${id}/public`,
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data?.error || 'Failed to load lesson note'
          )
        }

        if (!cancelled) {
          setNote(data)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message || 'Failed to load lesson note'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingNote(false)
        }
      }
    }

    if (id) {
      loadNote()
    }

    return () => {
      cancelled = true
    }
  }, [id])

  // ============================================================
  // VERIFY PAYMENT AFTER PAYSTACK REDIRECT
  // ============================================================

  useEffect(() => {
    const reference =
      searchParams.get('reference') ||
      searchParams.get('trxref')

    if (!reference || !id) {
      return
    }

    let cancelled = false

    const verifyPayment = async () => {
      try {
        setVerifying(true)
        setSubmitting(true)
        setError('')

        const data = await verifyWithRetry(
          `/api/lesson-notes/${id}/verify?reference=${encodeURIComponent(
            reference
          )}`
        )

        if (cancelled) {
          return
        }

        if (data?.success) {
          setDownloadRef(reference)
        } else {
          setError(
            `${
              data?.error || 'Verification failed'
            } — if you were charged, do not pay again. Your reference is: ${reference}`
          )
        }
      } catch {
        if (!cancelled) {
          setError(
            `Could not confirm payment. If you were charged, do not pay again. Contact support with reference: ${reference}`
          )
        }
      } finally {
        if (!cancelled) {
          setVerifying(false)
          setSubmitting(false)
        }
      }
    }

    verifyPayment()

    return () => {
      cancelled = true
    }
  }, [id, searchParams])

  // ============================================================
  // START PURCHASE
  // ============================================================

  const submit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!note) {
      setError('Lesson note is still loading')
      return
    }

    const buyerName = name.trim()
    const buyerEmail = email.trim().toLowerCase()

    if (!buyerName || !buyerEmail) {
      setError('Name and email are required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(
        `/api/lesson-notes/${id}/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: buyerName,
            email: buyerEmail,
          }),
        }
      )

      let data: any = null

      try {
        data = await response.json()
      } catch {
        throw new Error(
          'The server returned an invalid response'
        )
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to process purchase'
        )
      }

      // --------------------------------------------------------
      // FREE LESSON NOTE
      // --------------------------------------------------------

      if (data?.isFree) {
        setDownloadRef('free')
        setSubmitting(false)
        return
      }

      // --------------------------------------------------------
      // PAID LESSON NOTE
      // --------------------------------------------------------

      const authorizationUrl = data?.authorizationUrl

      if (!authorizationUrl) {
        throw new Error(
          'Payment authorization link was not returned'
        )
      }

      /**
       * Redirect directly to Paystack.
       *
       * Paystack will redirect back to:
       *
       * /lesson-notes/[id]/purchase?reference=...
       *
       * or
       *
       * /lesson-notes/[id]/purchase?trxref=...
       */
      window.location.href = authorizationUrl
    } catch (err: any) {
      setError(
        err?.message || 'Something went wrong'
      )

      setSubmitting(false)
    }
  }

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  const download = () => {
    if (!downloadRef) {
      return
    }

    const url =
      downloadRef === 'free'
        ? `/api/lesson-notes/${id}/download`
        : `/api/lesson-notes/${id}/download?reference=${encodeURIComponent(
            downloadRef
          )}`

    window.location.href = url
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingNote && !downloadRef) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6">

            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">

              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />

              <p className="font-semibold text-gray-900">
                Loading lesson note...
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Please wait a moment.
              </p>

            </div>

          </div>
        </div>

        <Footer />
      </>
    )
  }

  // ============================================================
  // VERIFICATION SCREEN
  // ============================================================

  if (verifying && !downloadRef) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6">

            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">

              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />

              <h1 className="font-bold text-gray-900 text-lg mb-1">
                Confirming your payment
              </h1>

              <p className="text-sm text-gray-500">
                Please do not refresh or pay again while we confirm your transaction.
              </p>

            </div>

          </div>
        </div>

        <Footer />
      </>
    )
  }

  // ============================================================
  // ERROR LOADING NOTE
  // ============================================================

  if (!note && error && !downloadRef) {
    return (
      <>
        <Navbar />

        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6">

            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">

              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">
                  ⚠️
                </span>
              </div>

              <p className="text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-4 text-sm text-blue-600 font-semibold hover:underline"
              >
                Try again
              </button>

            </div>

          </div>
        </div>

        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-24 pb-16">

        <div className="max-w-md mx-auto px-4 sm:px-6">

          {/* ==================================================
              SUCCESS / DOWNLOAD
          =================================================== */}

          {downloadRef ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">

              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />

              <h1 className="font-bold text-gray-900 text-lg mb-1">
                You're all set!
              </h1>

              <p className="text-sm text-gray-500 mb-6">
                {downloadRef === 'free'
                  ? 'Your free lesson note is ready.'
                  : 'Your payment has been confirmed and your lesson note is ready.'}
              </p>

              <button
                type="button"
                onClick={download}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Download size={16} />

                Download Lesson Note
              </button>

              <a
                href={`/lesson-notes/${id}`}
                className="inline-flex items-center justify-center gap-1 mt-5 text-sm text-gray-500 hover:text-blue-600 transition"
              >
                <ArrowLeft size={15} />
                Back to lesson note
              </a>

            </div>
          ) : (
            /* ==================================================
                PURCHASE FORM
            =================================================== */

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

              {/* COVER */}

              {note?.coverImageUrl && (
                <div className="h-44 bg-gray-100">
                  <img
                    src={note.coverImageUrl}
                    alt={note.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">

                <a
                  href={`/lesson-notes/${id}`}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-4"
                >
                  <ArrowLeft size={14} />
                  Back to lesson note
                </a>

                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {note?.title}
                </h1>

                {(note?.subject ||
                  note?.studentClass) && (
                  <p className="text-xs text-gray-500 mb-2">
                    {note?.subject || 'General'}

                    {note?.studentClass &&
                      ` · ${note.studentClass.toUpperCase()}`}
                  </p>
                )}

                <p
                  className={`text-base font-bold mb-6 ${
                    note?.isFree
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}
                >
                  {note?.isFree
                    ? 'Free'
                    : `₦${Number(
                        note?.price || 0
                      ).toLocaleString(
                        'en-NG'
                      )}`}
                </p>

                <form
                  onSubmit={submit}
                  className="space-y-4"
                >

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />

                    <p className="text-xs text-gray-400 mt-1.5">
                      Use a valid email address for your purchase record.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                      <p className="text-xs text-red-600 leading-relaxed">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !note
                    }
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                  >
                    {submitting && (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    )}

                    {submitting
                      ? note?.isFree
                        ? 'Preparing...'
                        : 'Redirecting to Paystack...'
                      : note?.isFree
                      ? 'Get Free Lesson Note'
                      : `Pay ₦${Number(
                          note?.price || 0
                        ).toLocaleString(
                          'en-NG'
                        )}`}
                  </button>

                  {!note?.isFree && (
                    <p className="text-[11px] text-gray-400 text-center">
                      Secure payment powered by Paystack.
                    </p>
                  )}

                </form>

              </div>

            </div>
          )}

        </div>

      </div>

      <Footer />
    </>
  )
}