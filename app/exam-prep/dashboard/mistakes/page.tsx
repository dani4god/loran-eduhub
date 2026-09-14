'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  XCircle,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type Mistake = {
  attemptId: string

  createdAt?: string

  subject: string

  topic: string

  question: string

  options?: {
    a?: string
    b?: string
    c?: string
    d?: string
  }

  selected: string

  correct: string

  selectedText?: string

  correctText?: string

  selectedDisplay?: string

  correctDisplay?: string

  explanation: string
}

// ============================================================
// PAGE
// ============================================================

export default function MistakesPage() {
  const [
    mistakes,
    setMistakes,
  ] =
    useState<
      Mistake[]
    >(
      []
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    )

  const [
    error,
    setError,
  ] =
    useState(
      ''
    )

  const [
    currentIndex,
    setCurrentIndex,
  ] =
    useState(
      0
    )

  // ==========================================================
  // LOAD MISTAKES
  // ==========================================================

  useEffect(
    () => {
      let active =
        true

      const loadMistakes =
        async () => {
          try {
            setLoading(
              true
            )

            setError(
              ''
            )

            const response =
              await fetch(
                '/api/exam-prep/mistakes',
                {
                  cache:
                    'no-store',

                  credentials:
                    'include',
                }
              )

            const data =
              await response.json()

            if (
              !response.ok
            ) {
              throw new Error(
                data?.error ||
                  'Could not load your Mistake Bank.'
              )
            }

            if (
              active
            ) {
              const loadedMistakes =
                Array.isArray(
                  data?.mistakes
                )
                  ? data.mistakes
                  : []

              setMistakes(
                loadedMistakes
              )

              setCurrentIndex(
                0
              )
            }
          } catch (
            error:
              any
          ) {
            if (
              active
            ) {
              setError(
                error
                  ?.message ||
                  'Could not load your Mistake Bank.'
              )
            }
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              )
            }
          }
        }

      loadMistakes()

      return () => {
        active =
          false
      }
    },
    []
  )

  // ==========================================================
  // CURRENT MISTAKE
  // ==========================================================

  const currentMistake =
    useMemo(
      () =>
        mistakes[
          currentIndex
        ] ||
        null,
      [
        mistakes,
        currentIndex,
      ]
    )

  const totalMistakes =
    mistakes.length

  const currentNumber =
    totalMistakes >
      0
      ? currentIndex +
        1
      : 0

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const canGoPrevious =
    currentIndex >
    0

  const canGoNext =
    currentIndex <
    totalMistakes -
      1

  const goPrevious =
    () => {
      if (
        !canGoPrevious
      ) {
        return
      }

      setCurrentIndex(
        (
          previous
        ) =>
          previous -
          1
      )

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      })
    }

  const goNext =
    () => {
      if (
        !canGoNext
      ) {
        return
      }

      setCurrentIndex(
        (
          previous
        ) =>
          previous +
          1
      )

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      })
    }

  const goFirst =
    () => {
      setCurrentIndex(
        0
      )

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      })
    }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Mistake Bank
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Loading your mistakes...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Mistake Bank
        </h1>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (
    !currentMistake
  ) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Mistake Bank
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review questions you answered incorrectly and learn
          from them.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />

          <p className="mt-4 font-semibold text-slate-800">
            No mistakes yet
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Questions you answer incorrectly will appear here.
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Mistake Bank
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review one mistake at a time and learn from each
            question.
          </p>
        </div>

        <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
          Mistake {currentNumber} of {totalMistakes}
        </div>
      </div>

      {/* =====================================================
          PROGRESS BAR
      ====================================================== */}

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{
            width:
              `${
                (
                  currentNumber /
                  totalMistakes
                ) *
                100
              }%`,
          }}
        />
      </div>

      {/* =====================================================
          MAIN CARD
      ====================================================== */}

      <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {/* SUBJECT / TOPIC */}

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
            {currentMistake.subject}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {currentMistake.topic}
          </span>
        </div>

        {/* QUESTION */}

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Question
          </p>

          <p className="mt-2 text-base font-semibold leading-7 text-slate-900">
            {currentMistake.question}
          </p>
        </div>

        {/* OPTIONS */}

        {currentMistake.options && (
          <div className="mt-5 grid gap-2">
            {(
              [
                'a',
                'b',
                'c',
                'd',
              ] as const
            ).map(
              (
                key
              ) => {
                const option =
                  currentMistake
                    .options?.[
                    key
                  ]

                if (
                  !option
                ) {
                  return null
                }

                const isCorrect =
                  currentMistake
                    .correct
                    ?.toLowerCase() ===
                  key

                const isSelected =
                  currentMistake
                    .selected
                    ?.toLowerCase() ===
                  key

                return (
                  <div
                    key={
                      key
                    }
                    className={[
                      'rounded-xl border p-3 text-sm',
                      isCorrect
                        ? 'border-green-200 bg-green-50 text-green-900'
                        : isSelected
                          ? 'border-red-200 bg-red-50 text-red-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
                    ].join(
                      ' '
                    )}
                  >
                    <span className="mr-2 font-bold uppercase">
                      {key}.
                    </span>

                    {option}
                  </div>
                )
              }
            )}
          </div>
        )}

        {/* ANSWERS */}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {/* USER ANSWER */}

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />

              <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">
                Your answer
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-red-900">
              {currentMistake.selectedDisplay ||
                currentMistake.selectedText ||
                currentMistake.selected ||
                'Unanswered'}
            </p>
          </div>

          {/* CORRECT ANSWER */}

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />

              <p className="text-[11px] font-bold uppercase tracking-wide text-green-600">
                Correct answer
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-green-900">
              {currentMistake.correctDisplay ||
                currentMistake.correctText ||
                currentMistake.correct}
            </p>
          </div>
        </div>

        {/* EXPLANATION */}

        {currentMistake.explanation && (
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
              Explanation
            </p>

            <p className="mt-2 text-sm leading-6 text-indigo-900">
              {currentMistake.explanation}
            </p>
          </div>
        )}
      </article>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={
            goPrevious
          }
          disabled={
            !canGoPrevious
          }
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />

          Previous
        </button>

        <div className="hidden text-xs font-medium text-slate-500 sm:block">
          {currentNumber} / {totalMistakes}
        </div>

        {canGoNext ? (
          <button
            type="button"
            onClick={
              goNext
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Next mistake

            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={
              goFirst
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <RotateCcw className="h-4 w-4" />

            Review again
          </button>
        )}
      </div>

      {/* =====================================================
          MOBILE COUNTER
      ====================================================== */}

      <div className="mt-4 text-center text-xs font-medium text-slate-500 sm:hidden">
        {currentNumber} of {totalMistakes}
      </div>
    </div>
  )
}