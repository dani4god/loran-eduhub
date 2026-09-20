// components/self-paced/AIStudyAssistant.tsx

'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  Bot,
  X,
  Send,
  Sparkles,
  Lightbulb,
  FileText,
  Brain,
  Trash2,
  Copy,
  Check,
  Loader2,
  BookOpen,
  RotateCcw,
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================

type AIAction =
  | 'chat'
  | 'explain'
  | 'example'
  | 'summarize'
  | 'quiz'

interface AIMessage {
  _id?: string

  role:
    | 'user'
    | 'assistant'

  content: string

  createdAt?: string

  pending?: boolean
}

interface AIStudyAssistantProps {
  courseId: string

  courseTitle: string

  weekNumber: number

  weekTitle: string

  pageId: string

  pageTitle: string

  disabled?: boolean
}

// ============================================================
// QUICK ACTIONS
// ============================================================

const QUICK_ACTIONS = [
  {
    action:
      'explain' as AIAction,

    label:
      'Explain simply',

    description:
      'Break this lesson down',

    icon:
      Sparkles,
  },

  {
    action:
      'example' as AIAction,

    label:
      'Give an example',

    description:
      'Show me how it works',

    icon:
      Lightbulb,
  },

  {
    action:
      'summarize' as AIAction,

    label:
      'Summarize',

    description:
      'Create revision notes',

    icon:
      FileText,
  },

  {
    action:
      'quiz' as AIAction,

    label:
      'Quiz me',

    description:
      'Test my understanding',

    icon:
      Brain,
  },
]

// ============================================================
// NORMALIZE AI MARKDOWN
// ============================================================

function normalizeMarkdown(
  content: string
) {
  if (!content) {
    return ''
  }

  return content
    /*
     * Some models occasionally escape Markdown characters
     * even though the response is already plain text.
     *
     * Example:
     * \| Column \| Value \|
     * \---
     * \> Quote
     * \*word\*
     *
     * Those escapes prevent Markdown renderers from
     * recognizing tables, rules, quotes, etc.
     */
    .replace(
      /\\\|/g,
      '|'
    )

    .replace(
      /\\>/g,
      '>'
    )

    .replace(
      /\\#/g,
      '#'
    )

    .replace(
      /\\-/g,
      '-'
    )

    .replace(
      /\\\*/g,
      '*'
    )

    .replace(
      /\\_/g,
      '_'
    )

    .replace(
      /\\`/g,
      '`'
    )

    /*
     * Normalize excessive blank lines.
     */
    .replace(
      /\n{4,}/g,
      '\n\n\n'
    )

    .trim()
}

// ============================================================
// RICH MARKDOWN MESSAGE
// ============================================================

function RichMessage({
  content,
}: {
  content: string
}) {
  const markdown =
    normalizeMarkdown(
      content
    )

  return (
    <div className="min-w-0 break-words">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
        ]}
        components={{
          // ==================================================
          // PARAGRAPH
          // ==================================================

          p({
            children,
          }) {
            return (
              <p className="my-2 text-sm leading-6 text-slate-700 first:mt-0 last:mb-0">
                {children}
              </p>
            )
          },

          // ==================================================
          // HEADINGS
          // ==================================================

          h1({
            children,
          }) {
            return (
              <h1 className="mb-2 mt-5 text-lg font-bold leading-7 text-slate-950 first:mt-0">
                {children}
              </h1>
            )
          },

          h2({
            children,
          }) {
            return (
              <h2 className="mb-2 mt-5 text-base font-bold leading-6 text-slate-950 first:mt-0">
                {children}
              </h2>
            )
          },

          h3({
            children,
          }) {
            return (
              <h3 className="mb-2 mt-4 text-[15px] font-bold leading-6 text-slate-900 first:mt-0">
                {children}
              </h3>
            )
          },

          h4({
            children,
          }) {
            return (
              <h4 className="mb-1.5 mt-4 text-sm font-bold leading-6 text-slate-900 first:mt-0">
                {children}
              </h4>
            )
          },

          // ==================================================
          // BOLD / ITALIC
          // ==================================================

          strong({
            children,
          }) {
            return (
              <strong className="font-bold text-slate-900">
                {children}
              </strong>
            )
          },

          em({
            children,
          }) {
            return (
              <em className="italic text-slate-700">
                {children}
              </em>
            )
          },

          // ==================================================
          // LISTS
          // ==================================================

          ul({
            children,
          }) {
            return (
              <ul className="my-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                {children}
              </ul>
            )
          },

          ol({
            children,
          }) {
            return (
              <ol className="my-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                {children}
              </ol>
            )
          },

          li({
            children,
          }) {
            return (
              <li className="pl-1">
                {children}
              </li>
            )
          },

          // ==================================================
          // BLOCKQUOTE
          // ==================================================

          blockquote({
            children,
          }) {
            return (
              <blockquote className="my-4 rounded-r-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-2 text-sm leading-6 text-blue-900">
                {children}
              </blockquote>
            )
          },

          // ==================================================
          // HORIZONTAL RULE
          // ==================================================

          hr() {
            return (
              <hr className="my-5 border-0 border-t border-slate-200" />
            )
          },

          // ==================================================
          // TABLE
          // ==================================================

          table({
            children,
          }) {
            return (
              <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                  {children}
                </table>
              </div>
            )
          },

          thead({
            children,
          }) {
            return (
              <thead className="bg-slate-100">
                {children}
              </thead>
            )
          },

          tbody({
            children,
          }) {
            return (
              <tbody className="divide-y divide-slate-100 bg-white">
                {children}
              </tbody>
            )
          },

          tr({
            children,
          }) {
            return (
              <tr className="transition-colors hover:bg-slate-50">
                {children}
              </tr>
            )
          },

          th({
            children,
          }) {
            return (
              <th className="border-r border-slate-200 px-3 py-2.5 align-top font-bold leading-5 text-slate-800 last:border-r-0">
                {children}
              </th>
            )
          },

          td({
            children,
          }) {
            return (
              <td className="border-r border-slate-100 px-3 py-2.5 align-top leading-5 text-slate-600 last:border-r-0">
                {children}
              </td>
            )
          },

          // ==================================================
          // CODE
          // ==================================================

          code({
            className,
            children,
            ...props
          }) {
            const match =
              /language-(\w+)/.exec(
                className || ''
              )

            const codeText =
              String(
                children
              ).replace(
                /\n$/,
                ''
              )

            const isBlock =
              Boolean(
                match
              ) ||
              codeText.includes(
                '\n'
              )

            if (
              !isBlock
            ) {
              return (
                <code
                  {...props}
                  className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] font-medium text-pink-700"
                >
                  {children}
                </code>
              )
            }

            return (
              <code
                {...props}
                className={`${className || ''} block font-mono`}
              >
                {children}
              </code>
            )
          },

          pre({
            children,
          }) {
            return (
              <div className="my-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-600" />

                    <span className="h-2 w-2 rounded-full bg-slate-600" />

                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                  </div>

                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    Code
                  </span>
                </div>

                <pre className="max-w-full overflow-x-auto p-4 text-xs leading-6 text-slate-100">
                  {children}
                </pre>
              </div>
            )
          },

          // ==================================================
          // LINKS
          // ==================================================

          a({
            href,
            children,
          }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800"
              >
                {children}
              </a>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

// ============================================================
// COMPONENT
// ============================================================

export default function AIStudyAssistant({
  courseId,
  courseTitle,
  weekNumber,
  weekTitle,
  pageId,
  pageTitle,
  disabled = false,
}: AIStudyAssistantProps) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    )

  const [
    messages,
    setMessages,
  ] =
    useState<
      AIMessage[]
    >([])

  const [
    input,
    setInput,
  ] =
    useState(
      ''
    )

  const [
    loadingHistory,
    setLoadingHistory,
  ] =
    useState(
      false
    )

  const [
    sending,
    setSending,
  ] =
    useState(
      false
    )

  const [
    error,
    setError,
  ] =
    useState(
      ''
    )

  const [
    copiedIndex,
    setCopiedIndex,
  ] =
    useState<
      number |
      null
    >(
      null
    )

  const [
    clearing,
    setClearing,
  ] =
    useState(
      false
    )

  const messagesEndRef =
    useRef<HTMLDivElement>(
      null
    )

  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null
    )

  // ==========================================================
  // SCROLL TO BOTTOM
  // ==========================================================

  const scrollToBottom =
    useCallback(
      (
        behavior:
          ScrollBehavior =
          'smooth'
      ) => {
        requestAnimationFrame(
          () => {
            messagesEndRef
              .current
              ?.scrollIntoView({
                behavior,

                block:
                  'end',
              })
          }
        )
      },
      []
    )

  useEffect(
    () => {
      if (
        open
      ) {
        scrollToBottom(
          'smooth'
        )
      }
    },
    [
      messages,
      sending,
      open,
      scrollToBottom,
    ]
  )

  // ==========================================================
  // RESET LOCAL STATE WHEN LESSON CHANGES
  // ==========================================================

  useEffect(
    () => {
      setMessages(
        []
      )

      setError(
        ''
      )

      setInput(
        ''
      )

      setCopiedIndex(
        null
      )
    },
    [
      courseId,
      weekNumber,
      pageId,
    ]
  )

  // ==========================================================
  // LOAD HISTORY
  // ==========================================================

  const loadHistory =
    useCallback(
      async () => {
        if (
          disabled ||
          !pageId
        ) {
          return
        }

        setLoadingHistory(
          true
        )

        setError(
          ''
        )

        try {
          const params =
            new URLSearchParams({
              courseId,

              weekNumber:
                String(
                  weekNumber
                ),

              pageId,
            })

          const response =
            await fetch(
              `/api/self-paced/ai/conversation?${params.toString()}`,
              {
                cache:
                  'no-store',
              }
            )

          const data =
            await response.json()

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
                'Could not load your study conversation.'
            )
          }

          setMessages(
            data.messages ||
              []
          )

          setTimeout(
            () =>
              scrollToBottom(
                'auto'
              ),
            50
          )
        } catch (
          err:
            any
        ) {
          setError(
            err?.message ||
              'Could not load your study conversation.'
          )
        } finally {
          setLoadingHistory(
            false
          )
        }
      },
      [
        courseId,
        weekNumber,
        pageId,
        disabled,
        scrollToBottom,
      ]
    )

  useEffect(
    () => {
      if (
        open
      ) {
        void loadHistory()
      }
    },
    [
      open,
      pageId,
      weekNumber,
      loadHistory,
    ]
  )

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  const sendMessage =
    async (
      action:
        AIAction =
        'chat',

      customMessage?:
        string
    ) => {
      if (
        sending ||
        disabled
      ) {
        return
      }

      const message =
        (
          customMessage ??
          input
        ).trim()

      if (
        action ===
          'chat' &&
        !message
      ) {
        return
      }

      setError(
        ''
      )

      setSending(
        true
      )

      const visibleUserMessage =
        message ||
        (
          action ===
            'explain'
            ? 'Explain this lesson simply'
            : action ===
                'example'
              ? 'Give me another example'
              : action ===
                  'summarize'
                ? 'Summarize this lesson'
                : 'Quiz me on this lesson'
        )

      const optimisticMessage:
        AIMessage = {
        role:
          'user',

        content:
          visibleUserMessage,

        createdAt:
          new Date().toISOString(),

        pending:
          true,
      }

      setMessages(
        (
          previous
        ) => [
          ...previous,
          optimisticMessage,
        ]
      )

      setInput(
        ''
      )

      try {
        const response =
          await fetch(
            '/api/self-paced/ai/chat',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  courseId,

                  weekNumber,

                  pageId,

                  action,

                  message,
                }),
            }
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              'Loran AI could not respond.'
          )
        }

        setMessages(
          (
            previous
          ) => {
            const updated =
              previous.map(
                (
                  item,
                  index
                ) =>
                  index ===
                  previous.length -
                    1
                    ? {
                        ...item,

                        pending:
                          false,
                      }
                    : item
              )

            return [
              ...updated,

              {
                role:
                  'assistant',

                content:
                  data.answer,

                createdAt:
                  new Date().toISOString(),
              },
            ]
          }
        )
      } catch (
        err:
          any
      ) {
        setMessages(
          (
            previous
          ) =>
            previous.filter(
              (
                _,
                index
              ) =>
                index !==
                previous.length -
                  1
            )
        )

        setError(
          err?.message ||
            'Loran AI could not respond. Please try again.'
        )
      } finally {
        setSending(
          false
        )

        setTimeout(
          () =>
            textareaRef
              .current
              ?.focus(),
          100
        )
      }
    }

  // ==========================================================
  // CLEAR CONVERSATION
  // ==========================================================

  const clearConversation =
    async () => {
      if (
        clearing ||
        messages.length ===
          0
      ) {
        return
      }

      const confirmed =
        window.confirm(
          'Clear your AI conversation for this lesson?'
        )

      if (
        !confirmed
      ) {
        return
      }

      setClearing(
        true
      )

      setError(
        ''
      )

      try {
        const response =
          await fetch(
            '/api/self-paced/ai/conversation',
            {
              method:
                'DELETE',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  courseId,

                  weekNumber,

                  pageId,
                }),
            }
          )

        const data =
          await response.json()

        if (
          !response.ok
        ) {
          throw new Error(
            data.error ||
              'Could not clear conversation.'
          )
        }

        setMessages(
          []
        )
      } catch (
        err:
          any
      ) {
        setError(
          err?.message ||
            'Could not clear conversation.'
        )
      } finally {
        setClearing(
          false
        )
      }
    }

  // ==========================================================
  // COPY MESSAGE
  // ==========================================================

  const copyMessage =
    async (
      content:
        string,

      index:
        number
    ) => {
      try {
        await navigator.clipboard.writeText(
          content
        )

        setCopiedIndex(
          index
        )

        setTimeout(
          () =>
            setCopiedIndex(
              null
            ),
          1600
        )
      } catch {
        // Clipboard API may be unavailable.
      }
    }

  // ==========================================================
  // KEYBOARD
  // ==========================================================

  const handleKeyDown =
    (
      event:
        React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (
        event.key ===
          'Enter' &&
        !event.shiftKey
      ) {
        event.preventDefault()

        void sendMessage(
          'chat'
        )
      }
    }

  // ==========================================================
  // DISABLED
  // ==========================================================

  if (
    disabled
  ) {
    return null
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* =====================================================
          FLOATING BUTTON
      ====================================================== */}

      {!open && (
        <button
          type="button"
          onClick={() =>
            setOpen(
              true
            )
          }
          className="
            fixed
            bottom-5
            right-4
            z-40
            flex
            items-center
            gap-2
            rounded-full
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            px-4
            py-3
            text-sm
            font-bold
            text-white
            shadow-xl
            shadow-blue-600/20
            transition
            hover:-translate-y-0.5
            hover:shadow-2xl
            sm:bottom-6
            sm:right-6
          "
          aria-label="Open Loran AI Study Assistant"
        >
          <div className="relative">
            <Bot
              size={
                19
              }
            />

            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-green-400" />
          </div>

          <span>
            Ask Loran AI
          </span>

          <Sparkles
            size={
              14
            }
            className="text-blue-100"
          />
        </button>
      )}

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {open && (
        <button
          type="button"
          aria-label="Close AI assistant"
          onClick={() =>
            setOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* =====================================================
          CHAT PANEL
      ====================================================== */}

      <section
        className={`
          fixed
          z-50
          flex
          flex-col
          overflow-hidden
          bg-white
          shadow-2xl
          transition-all
          duration-300

          bottom-0
          left-0
          right-0
          h-[88dvh]
          rounded-t-[28px]

          sm:left-auto
          sm:bottom-5
          sm:right-5
          sm:h-[min(760px,calc(100dvh-40px))]
          sm:w-[460px]
          sm:rounded-[24px]
          sm:border
          sm:border-slate-200

          ${
            open
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-[110%] opacity-0 pointer-events-none sm:translate-y-8 sm:scale-95'
          }
        `}
        aria-hidden={
          !open
        }
      >
        {/* MOBILE HANDLE */}

        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* ===================================================
            HEADER
        ==================================================== */}

        <header className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-4 pb-4 pt-4 text-white">
          <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/10" />

          <div className="absolute -bottom-16 left-10 h-28 w-28 rounded-full bg-indigo-300/10" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                <Bot
                  size={
                    23
                  }
                />

                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-blue-600 bg-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold">
                    Loran AI
                  </h2>

                  <Sparkles
                    size={
                      13
                    }
                    className="text-blue-200"
                  />
                </div>

                <p className="mt-0.5 text-xs text-blue-100">
                  Your AI study assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearConversation
                  }
                  disabled={
                    clearing
                  }
                  title="Clear conversation"
                  className="rounded-lg p-2 text-blue-100 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {clearing ? (
                    <Loader2
                      size={
                        16
                      }
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2
                      size={
                        16
                      }
                    />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-blue-100 transition hover:bg-white/10 hover:text-white"
                aria-label="Close Loran AI"
              >
                <X
                  size={
                    19
                  }
                />
              </button>
            </div>
          </div>

          {/* CURRENT LESSON */}

          <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
            <BookOpen
              size={
                15
              }
              className="shrink-0 text-blue-100"
            />

            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-blue-200">
                Studying now
              </p>

              <p className="truncate text-xs font-semibold text-white">
                Week{' '}
                {weekNumber}
                {' · '}
                {pageTitle}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-blue-200">
                {courseTitle}
                {' · '}
                {weekTitle}
              </p>
            </div>
          </div>
        </header>

        {/* ===================================================
            MESSAGES
        ==================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/70 px-3 py-4 sm:px-4">
          {loadingHistory ? (
            <div className="flex h-full min-h-[250px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />

                <p className="mt-2 text-xs text-slate-400">
                  Loading your study conversation...
                </p>
              </div>
            </div>
          ) : messages.length ===
            0 ? (
            <div>
              {/* WELCOME */}

              <div className="px-2 pb-5 pt-2 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                  <Bot className="h-7 w-7 text-blue-600" />
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  How can I help you study?
                </h3>

                <p className="mx-auto mt-1.5 max-w-[330px] text-xs leading-5 text-slate-500">
                  I know the lesson you're currently reading.
                  Ask me to explain a concept, show an
                  example, summarize it, or test your
                  understanding.
                </p>
              </div>

              {/* QUICK ACTIONS */}

              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon

                    return (
                      <button
                        type="button"
                        key={
                          item.action
                        }
                        onClick={() =>
                          void sendMessage(
                            item.action,
                            ''
                          )
                        }
                        disabled={
                          sending
                        }
                        className="group rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm disabled:opacity-50"
                      >
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                          <Icon
                            size={
                              16
                            }
                          />
                        </div>

                        <p className="text-xs font-bold text-slate-800">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                          {item.description}
                        </p>
                      </button>
                    )
                  }
                )}
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                <p className="text-[11px] leading-5 text-blue-700">
                  <strong>
                    Tip:
                  </strong>{' '}
                  Try asking, “Explain the most difficult
                  part of this lesson like I'm a
                  beginner.”
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(
                (
                  message,
                  index
                ) => {
                  const isUser =
                    message.role ===
                    'user'

                  return (
                    <div
                      key={
                        message._id ||
                        `${message.role}-${index}`
                      }
                      className={`flex ${
                        isUser
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`group relative min-w-0 ${
                          isUser
                            ? 'max-w-[88%]'
                            : 'w-full max-w-full'
                        }`}
                      >
                        {!isUser && (
                          <div className="mb-1.5 flex items-center gap-1.5 px-1">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white">
                              <Bot
                                size={
                                  12
                                }
                              />
                            </div>

                            <span className="text-[10px] font-bold text-slate-500">
                              Loran AI
                            </span>
                          </div>
                        )}

                        <div
                          className={
                            isUser
                              ? 'rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-sm'
                              : 'min-w-0 overflow-hidden rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm'
                          }
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.content}
                            </p>
                          ) : (
                            <RichMessage
                              content={
                                message.content
                              }
                            />
                          )}
                        </div>

                        {!isUser &&
                          !message.pending && (
                          <div className="mt-1 flex items-center gap-1 px-1">
                            <button
                              type="button"
                              onClick={() =>
                                void copyMessage(
                                  message.content,
                                  index
                                )
                              }
                              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                              {copiedIndex ===
                              index ? (
                                <>
                                  <Check
                                    size={
                                      11
                                    }
                                  />

                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy
                                    size={
                                      11
                                    }
                                  />

                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              )}

              {/* TYPING INDICATOR */}

              {sending && (
                <div className="flex justify-start">
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 px-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white">
                        <Bot
                          size={
                            12
                          }
                        />
                      </div>

                      <span className="text-[10px] font-bold text-slate-500">
                        Loran AI
                      </span>
                    </div>

                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="text-xs leading-5 text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setError(
                    ''
                  )
                }
                className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-700"
              >
                <RotateCcw
                  size={
                    10
                  }
                />

                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* ===================================================
            QUICK ACTION STRIP
        ==================================================== */}

        {messages.length >
          0 && (
          <div className="border-t border-slate-100 bg-white px-3 py-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_ACTIONS.map(
                (
                  item
                ) => {
                  const Icon =
                    item.icon

                  return (
                    <button
                      type="button"
                      key={
                        item.action
                      }
                      disabled={
                        sending
                      }
                      onClick={() =>
                        void sendMessage(
                          item.action,
                          ''
                        )
                      }
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"
                    >
                      <Icon
                        size={
                          11
                        }
                      />

                      {item.label}
                    </button>
                  )
                }
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            INPUT
        ==================================================== */}

        <footer className="border-t border-slate-100 bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
            <textarea
              ref={
                textareaRef
              }
              value={
                input
              }
              onChange={(
                event
              ) =>
                setInput(
                  event.target.value.slice(
                    0,
                    2500
                  )
                )
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                sending
              }
              rows={
                2
              }
              placeholder="Ask about this lesson..."
              className="max-h-32 min-h-[48px] w-full resize-none bg-transparent px-2 py-1 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
            />

            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[9px] text-slate-400">
                {input.length >
                  2000
                  ? `${input.length}/2500`
                  : 'Enter to send · Shift + Enter for a new line'}
              </span>

              <button
                type="button"
                onClick={() =>
                  void sendMessage(
                    'chat'
                  )
                }
                disabled={
                  sending ||
                  !input.trim()
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2
                    size={
                      16
                    }
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={
                      15
                    }
                  />
                )}
              </button>
            </div>
          </div>

          <p className="mt-2 text-center text-[9px] leading-4 text-slate-400">
            Loran AI can make mistakes. Use it to
            understand your course material, not as a
            substitute for your tutor.
          </p>
        </footer>
      </section>
    </>
  )
}