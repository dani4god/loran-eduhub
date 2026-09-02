// app/exam-prep/dashboard/live-exams/[roomCode]/page.tsx

'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useParams,
  useRouter,
} from 'next/navigation'

import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MonitorUp,
  Play,
  RefreshCw,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react'

// ============================================================
// HELPERS
// ============================================================

function fmt(
  seconds: number
) {
  const safe =
    Math.max(
      0,
      Math.floor(
        Number(seconds) || 0
      )
    )

  return `${Math.floor(safe / 60)}:${String(
    safe % 60
  ).padStart(2, '0')}`
}

function getErrorMessage(
  value: any,
  fallback: string
) {
  return (
    value?.error ||
    value?.message ||
    fallback
  )
}

// ============================================================
// PAGE
// ============================================================

export default function ArenaRoom() {
  const {
    roomCode,
  } =
    useParams<{
      roomCode: string
    }>()

  const router =
    useRouter()

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    data,
    setData,
  ] =
    useState<any>(
      null
    )

  const [
    seconds,
    setSeconds,
  ] =
    useState(
      0
    )

  const [
    answers,
    setAnswers,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({})

  const [
    current,
    setCurrent,
  ] =
    useState(
      0
    )

  const [
    sharing,
    setSharing,
  ] =
    useState(
      false
    )

  const [
    skipOptionalShare,
    setSkipOptionalShare,
  ] =
    useState(
      false
    )

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    )

  const [
    starting,
    setStarting,
  ] =
    useState(
      false
    )

  const [
    preparing,
    setPreparing,
  ] =
    useState(
      false
    )

  const [
    preparationError,
    setPreparationError,
  ] =
    useState<
      string | null
    >(
      null
    )

  const [
    preparingSubject,
    setPreparingSubject,
  ] =
    useState<
      string | null
    >(
      null
    )

  // ==========================================================
  // REFS
  // ==========================================================

  const streamRef =
    useRef<
      MediaStream | null
    >(
      null
    )

  const subjectRef =
    useRef(
      -99
    )

  const autoRef =
    useRef(
      false
    )

  const answersRef =
    useRef<
      Record<
        string,
        string
      >
    >({})

  const secondsRef =
    useRef(
      0
    )

  const dataRef =
    useRef<any>(
      null
    )

  /*
   * Prevent multiple preparation loops from starting because
   * /state is polled every few seconds.
   */
  const preparationRunningRef =
    useRef(
      false
    )

  /*
   * Prevent repeatedly retrying a failed generation on every
   * state poll.
   */
  const preparationFailedRef =
    useRef(
      false
    )

  // ==========================================================
  // KEEP REFS CURRENT
  // ==========================================================

  useEffect(
    () => {
      answersRef.current =
        answers
    },
    [
      answers,
    ]
  )

  useEffect(
    () => {
      secondsRef.current =
        seconds
    },
    [
      seconds,
    ]
  )

  useEffect(
    () => {
      dataRef.current =
        data
    },
    [
      data,
    ]
  )

  // ==========================================================
  // LOAD ARENA STATE
  // ==========================================================

  const load =
    useCallback(
      async () => {
        try {
          const res =
            await fetch(
              `/api/exam-prep/arena/${roomCode}/state`,
              {
                cache:
                  'no-store',
              }
            )

          let d:
            any = {}

          try {
            d =
              await res.json()
          } catch {
            d = {}
          }

          if (
            res.status ===
            401
          ) {
            router.replace(
              '/exam-prep/login'
            )

            return null
          }

          if (
            !res.ok
          ) {
            console.error(
              '[ARENA PAGE] State load failed:',
              d
            )

            return null
          }

          setData(
            d
          )

          dataRef.current =
            d

          const serverSeconds =
            Number(
              d?.state
                ?.secondsLeft ??
              d?.state
                ?.startsIn ??
              0
            )

          setSeconds(
            serverSeconds
          )

          secondsRef.current =
            serverSeconds

          const newSubjectIndex =
            Number(
              d?.state
                ?.currentSubjectIndex ??
              -1
            )

          if (
            newSubjectIndex !==
            subjectRef.current
          ) {
            subjectRef.current =
              newSubjectIndex

            setAnswers(
              {}
            )

            answersRef.current =
              {}

            setCurrent(
              0
            )

            autoRef.current =
              false
          }

          return d
        } catch (
          error
        ) {
          console.error(
            '[ARENA PAGE] State request error:',
            error
          )

          return null
        }
      },
      [
        roomCode,
        router,
      ]
    )

  // ==========================================================
  // POLL ARENA STATE
  // ==========================================================

  useEffect(
    () => {
      load()

      const interval =
        setInterval(
          load,
          3000
        )

      return () =>
        clearInterval(
          interval
        )
    },
    [
      load,
    ]
  )

  // ==========================================================
  // LOCAL COUNTDOWN
  // ==========================================================

  useEffect(
    () => {
      const timer =
        setInterval(
          () => {
            setSeconds(
              (
                currentSeconds
              ) =>
                Math.max(
                  0,
                  currentSeconds -
                    1
                )
            )
          },
          1000
        )

      return () =>
        clearInterval(
          timer
        )
    },
    []
  )

  // ==========================================================
  // SCREEN SHARE HEARTBEAT
  // ==========================================================

  const heartbeat =
    useCallback(
      async (
        active: boolean
      ) => {
        try {
          await fetch(
            `/api/exam-prep/arena/${roomCode}/screen-share`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  active,
                }),
            }
          )
        } catch {
          // Heartbeat failure is handled by server freshness.
        }
      },
      [
        roomCode,
      ]
    )

  // ==========================================================
  // START SCREEN SHARE
  // ==========================================================

  const startShare =
    async () => {
      try {
        const stream =
          await navigator
            .mediaDevices
            .getDisplayMedia({
              video:
                true,

              audio:
                false,
            })

        streamRef.current =
          stream

        setSharing(
          true
        )

        setSkipOptionalShare(
          false
        )

        await heartbeat(
          true
        )

        const track =
          stream
            .getVideoTracks()[0]

        track?.addEventListener(
          'ended',
          async () => {
            streamRef.current =
              null

            setSharing(
              false
            )

            await heartbeat(
              false
            )
          }
        )
      } catch (
        error
      ) {
        console.error(
          '[ARENA PAGE] Screen share failed:',
          error
        )

        setSharing(
          false
        )
      }
    }

  // ==========================================================
  // CONTINUOUS SCREEN SHARE HEARTBEAT
  // ==========================================================

  useEffect(
    () => {
      if (
        !sharing
      ) {
        return
      }

      const interval =
        setInterval(
          () => {
            heartbeat(
              true
            )
          },
          15000
        )

      return () =>
        clearInterval(
          interval
        )
    },
    [
      sharing,
      heartbeat,
    ]
  )

  // ==========================================================
  // CLEAN UP SCREEN SHARE
  // ==========================================================

  useEffect(
    () => {
      return () => {
        if (
          streamRef.current
        ) {
          for (
            const track of
            streamRef.current.getTracks()
          ) {
            track.stop()
          }
        }
      }
    },
    []
  )

  // ==========================================================
  // PREPARE ONE SUBJECT
  // ==========================================================

  const prepareSubject =
    useCallback(
      async (
        subjectIndex: number
      ) => {
        const res =
          await fetch(
            `/api/exam-prep/arena/${roomCode}/prepare`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  subjectIndex,
                }),
            }
          )

        let result:
          any = {}

        try {
          result =
            await res.json()
        } catch {
          result = {}
        }

        if (
          !res.ok
        ) {
          throw new Error(
            getErrorMessage(
              result,
              'Could not prepare subject questions.'
            )
          )
        }

        return result
      },
      [
        roomCode,
      ]
    )

  // ==========================================================
  // PREPARE ALL SUBJECTS
  // ==========================================================

  const prepareRoom =
    useCallback(
      async (
        roomState?:
          any
      ) => {
        if (
          preparationRunningRef.current
        ) {
          return
        }

        const snapshot =
          roomState ||
          dataRef.current

        if (
          !snapshot
            ?.isCreator
        ) {
          return
        }

        if (
          snapshot
            ?.room
            ?.status !==
          'preparing'
        ) {
          return
        }

        if (
          snapshot
            ?.room
            ?.startedAt
        ) {
          return
        }

        const subjects =
          Array.isArray(
            snapshot
              ?.room
              ?.subjects
          )
            ? snapshot
                .room
                .subjects
            : []

        if (
          subjects.length ===
          0
        ) {
          setPreparationError(
            'This competition does not contain any subjects.'
          )

          return
        }

        preparationRunningRef.current =
          true

        preparationFailedRef.current =
          false

        setPreparing(
          true
        )

        setPreparationError(
          null
        )

        try {
          /*
           * Generate sequentially.
           *
           * This avoids sending several expensive AI requests
           * simultaneously and makes the preparation progress
           * predictable.
           */

          for (
            let index = 0;
            index <
            subjects.length;
            index += 1
          ) {
            /*
             * Refresh before each generation so we do not
             * regenerate a subject that another request has
             * already completed.
             */

            const fresh =
              index === 0
                ? snapshot
                : await load()

            const freshSubject =
              fresh
                ?.room
                ?.subjects?.[
                  index
                ]

            if (
              !freshSubject
            ) {
              throw new Error(
                `Could not find Arena subject ${index + 1}.`
              )
            }

            const ready =
              freshSubject
                .generationStatus ===
                'ready' &&
              Boolean(
                freshSubject
                  .ready
              )

            if (
              ready
            ) {
              continue
            }

            setPreparingSubject(
              freshSubject
                .subject ||
              `Round ${index + 1}`
            )

            console.log(
              '[ARENA PAGE] Preparing subject:',
              {
                roomCode,

                subjectIndex:
                  index,

                subject:
                  freshSubject
                    .subject,

                questionCount:
                  freshSubject
                    .questionCount,
              }
            )

            await prepareSubject(
              index
            )

            await load()
          }

          setPreparingSubject(
            null
          )

          /*
           * Final refresh should now return:
           *
           * room.status === 'lobby'
           */

          const finalState =
            await load()

          if (
            finalState
              ?.room
              ?.status !==
            'lobby'
          ) {
            throw new Error(
              'Question preparation finished, but the room has not become ready yet. Refresh and try again.'
            )
          }

          console.log(
            '[ARENA PAGE] Room preparation complete:',
            {
              roomCode,

              status:
                finalState
                  ?.room
                  ?.status,
            }
          )
        } catch (
          error
        ) {
          console.error(
            '[ARENA PAGE] Room preparation failed:',
            error
          )

          preparationFailedRef.current =
            true

          setPreparationError(
            error instanceof
            Error
              ? error.message
              : 'Could not prepare competition questions.'
          )
        } finally {
          preparationRunningRef.current =
            false

          setPreparing(
            false
          )

          setPreparingSubject(
            null
          )
        }
      },
      [
        load,
        prepareSubject,
        roomCode,
      ]
    )

  // ==========================================================
  // AUTOMATICALLY PREPARE CREATOR'S ROOM
  // ==========================================================

  useEffect(
    () => {
      if (
        !data
      ) {
        return
      }

      if (
        !data.isCreator
      ) {
        return
      }

      if (
        data.room
          ?.status !==
        'preparing'
      ) {
        return
      }

      if (
        data.room
          ?.startedAt
      ) {
        return
      }

      /*
       * If a generation attempt failed, don't repeatedly hit
       * Groq every 3 seconds because /state is polling.
       *
       * The creator gets a Retry button instead.
       */

      if (
        preparationFailedRef.current
      ) {
        return
      }

      prepareRoom(
        data
      )
    },
    [
      data,
      prepareRoom,
    ]
  )

  // ==========================================================
  // MANUAL PREPARATION RETRY
  // ==========================================================

  const retryPreparation =
    async () => {
      preparationFailedRef.current =
        false

      setPreparationError(
        null
      )

      const fresh =
        await load()

      await prepareRoom(
        fresh
      )
    }

  // ==========================================================
  // START ROOM
  // ==========================================================

  const startRoom =
    async () => {
      if (
        starting
      ) {
        return
      }

      const snapshot =
        dataRef.current

      if (
        snapshot
          ?.room
          ?.status !==
        'lobby'
      ) {
        alert(
          'Competition questions are still being prepared.'
        )

        return
      }

      const allReady =
        snapshot
          ?.room
          ?.subjects
          ?.every(
            (
              subject:
                any
            ) =>
              subject
                ?.ready ===
              true
          )

      if (
        !allReady
      ) {
        alert(
          'One or more subjects are not ready yet.'
        )

        return
      }

      setStarting(
        true
      )

      try {
        const res =
          await fetch(
            `/api/exam-prep/arena/${roomCode}/start`,
            {
              method:
                'POST',
            }
          )

        let result:
          any = {}

        try {
          result =
            await res.json()
        } catch {
          result = {}
        }

        if (
          !res.ok
        ) {
          alert(
            getErrorMessage(
              result,
              'Could not start competition.'
            )
          )

          return
        }

        await load()
      } catch (
        error
      ) {
        console.error(
          '[ARENA PAGE] Start failed:',
          error
        )

        alert(
          'Could not start competition.'
        )
      } finally {
        setStarting(
          false
        )
      }
    }

  // ==========================================================
  // SUBMIT ROUND
  // ==========================================================

  const submit =
    useCallback(
      async () => {
        const active =
          dataRef.current

        if (
          !active
            ?.currentSubject ||
          active
            .viewerSubmitted ||
          submitting
        ) {
          return
        }

        setSubmitting(
          true
        )

        try {
          /*
           * The server now calculates the authoritative Arena
           * duration. This client value is kept only for backward
           * compatibility and diagnostics.
           */

          const used =
            active
              .currentSubject
              .durationMinutes *
              60 -
            secondsRef.current

          const res =
            await fetch(
              `/api/exam-prep/arena/${roomCode}/submit`,
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body:
                  JSON.stringify({
                    answers:
                      answersRef.current,

                    durationSeconds:
                      Math.max(
                        0,
                        used
                      ),
                  }),
              }
            )

          let result:
            any = {}

          try {
            result =
              await res.json()
          } catch {
            result = {}
          }

          if (
            !res.ok
          ) {
            alert(
              getErrorMessage(
                result,
                'Could not submit Arena round.'
              )
            )

            return
          }

          await load()
        } catch (
          error
        ) {
          console.error(
            '[ARENA PAGE] Submit failed:',
            error
          )

          alert(
            'Could not submit Arena round.'
          )
        } finally {
          setSubmitting(
            false
          )
        }
      },
      [
        load,
        roomCode,
        submitting,
      ]
    )

  // ==========================================================
  // AUTO SUBMIT AT ZERO
  // ==========================================================

  useEffect(
    () => {
      if (
        data
          ?.state
          ?.phase ===
          'subject' &&
        !data
          .viewerSubmitted &&
        seconds <=
          0 &&
        !autoRef.current
      ) {
        autoRef.current =
          true

        submit()
      }
    },
    [
      seconds,
      data,
      submit,
    ]
  )

  // ==========================================================
  // INITIAL LOADING
  // ==========================================================

  if (
    !data
  ) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="mx-auto animate-spin" />

        <p className="mt-3 text-sm text-slate-500">
          Loading Arena...
        </p>
      </div>
    )
  }

  const {
    room,
    state,
  } =
    data

  const shareRequired =
    room.screenShareMode ===
    'required'

  const shareOptional =
    room.screenShareMode ===
    'optional'

  const allSubjectsReady =
    Array.isArray(
      room.subjects
    ) &&
    room.subjects.length >
      0 &&
    room.subjects.every(
      (
        subject:
          any
      ) =>
        subject
          ?.ready ===
        true
    )

  // ==========================================================
  // PREPARING / LOBBY
  // ==========================================================

  if (
    state.phase ===
      'lobby'
  ) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* ====================================================
            ROOM HEADER
        ==================================================== */}

        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Room {room.roomCode}
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            {room.name}
          </h1>

          {room.official && (
            <div className="mt-3 inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-200">
              Official Loran Arena
            </div>
          )}

          {room.instructions && (
            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm leading-6 text-slate-300">
              {room.instructions}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>
              <Users
                size={
                  13
                }
                className="mr-1 inline"
              />

              {data.participantCount}{' '}
              participant
              {data.participantCount ===
              1
                ? ''
                : 's'}
            </span>

            <span>
              {room.subjects.length}{' '}
              round
              {room.subjects.length ===
              1
                ? ''
                : 's'}
            </span>
          </div>
        </div>

        {/* ====================================================
            PREPARATION STATUS
        ==================================================== */}

        {room.status ===
          'preparing' && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              {preparationError ? (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              ) : (
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-blue-600" />
              )}

              <div className="flex-1">
                <p className="font-bold text-slate-900">
                  {preparationError
                    ? 'Question preparation stopped'
                    : 'Preparing competition questions'}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {preparationError
                    ? preparationError
                    : data.isCreator
                      ? preparingSubject
                        ? `Generating ${preparingSubject} questions...`
                        : 'Preparing the exam rounds. This may take a moment.'
                      : 'The creator is preparing the competition questions.'}
                </p>

                {preparationError &&
                  data.isCreator && (
                    <button
                      type="button"
                      disabled={
                        preparing
                      }
                      onClick={
                        retryPreparation
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw
                        size={
                          14
                        }
                        className={
                          preparing
                            ? 'animate-spin'
                            : ''
                        }
                      />

                      Retry Preparation
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        {room.status ===
          'lobby' &&
          allSubjectsReady && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />

                <div>
                  <p className="text-sm font-bold text-green-900">
                    Competition ready
                  </p>

                  <p className="mt-0.5 text-xs text-green-700">
                    All subject questions have been prepared.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* ====================================================
            SCREEN SHARE
        ==================================================== */}

        {room.screenShareMode !==
          'off' && (
          <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-bold text-purple-900">
              Screen sharing:{' '}
              {room.screenShareMode}
            </p>

            <p className="mt-1 text-xs leading-5 text-purple-700">
              The browser will ask you to choose a screen,
              window, or tab.
              {shareRequired
                ? ' Screen sharing must remain active during the exam.'
                : ' Screen sharing is optional for this competition.'}
            </p>

            <button
              type="button"
              onClick={
                startShare
              }
              disabled={
                sharing
              }
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            >
              <MonitorUp
                size={
                  14
                }
              />

              {sharing
                ? 'Sharing Active'
                : 'Start Screen Share'}
            </button>
          </div>
        )}

        {/* ====================================================
            SUBJECT ROUNDS
        ==================================================== */}

        <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
          {room.subjects.map(
            (
              subject:
                any,
              index:
                number
            ) => {
              const ready =
                subject
                  .ready ===
                true

              const generating =
                subject
                  .generationStatus ===
                'generating'

              const failed =
                subject
                  .generationStatus ===
                'failed'

              return (
                <div
                  key={`${subject.subject}-${index}`}
                  className="border-b p-4 last:border-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Round{' '}
                        {index +
                          1}
                        :{' '}
                        {
                          subject.subject
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          subject.questionCount
                        }{' '}
                        questions ·{' '}
                        {
                          subject.durationMinutes
                        }{' '}
                        min
                      </p>
                    </div>

                    {ready ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase text-green-700">
                        <CheckCircle2
                          size={
                            12
                          }
                        />
                        Ready
                      </span>
                    ) : generating ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">
                        <Loader2
                          size={
                            12
                          }
                          className="animate-spin"
                        />
                        Generating
                      </span>
                    ) : failed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase text-red-700">
                        <XCircle
                          size={
                            12
                          }
                        />
                        Failed
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                        Waiting
                      </span>
                    )}
                  </div>
                </div>
              )
            }
          )}
        </div>

        {/* ====================================================
            START BUTTON
        ==================================================== */}

        {data.isCreator ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={
                startRoom
              }
              disabled={
                room.status !==
                  'lobby' ||
                !allSubjectsReady ||
                preparing ||
                starting
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {starting ? (
                <>
                  <Loader2
                    size={
                      15
                    }
                    className="animate-spin"
                  />

                  Starting...
                </>
              ) : room.status ===
                  'preparing' ? (
                <>
                  <Loader2
                    size={
                      15
                    }
                    className="animate-spin"
                  />

                  Preparing Questions...
                </>
              ) : (
                <>
                  <Play
                    size={
                      15
                    }
                  />

                  Start Competition
                </>
              )}
            </button>

            {room.status ===
              'preparing' && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Start becomes available when every subject is ready.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-blue-50 p-3 text-center text-xs font-semibold text-blue-700">
            {room.status ===
            'preparing'
              ? 'The competition questions are being prepared...'
              : 'Waiting for creator to start...'}
          </p>
        )}
      </div>
    )
  }

  // ==========================================================
  // COUNTDOWN
  // ==========================================================

  if (
    state.phase ===
    'countdown'
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Competition starts in
          </p>

          <p className="mt-4 text-8xl font-black text-slate-950">
            {state.startsIn ??
              seconds}
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Get ready for{' '}
            {room.subjects?.[0]
              ?.subject ||
              'the first round'}
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // INTERMISSION
  // ==========================================================

  if (
    state.phase ===
    'intermission'
  ) {
    const nextSubject =
      Number.isInteger(
        Number(
          state.nextSubjectIndex
        )
      )
        ? room.subjects?.[
            Number(
              state.nextSubjectIndex
            )
          ]
        : null

    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Check className="mx-auto h-12 w-12 text-green-500" />

        <h1 className="mt-4 text-2xl font-bold">
          Round Complete
        </h1>

        {nextSubject && (
          <p className="mt-2 font-semibold text-slate-700">
            Next:{' '}
            {
              nextSubject.subject
            }
          </p>
        )}

        <p className="mt-2 text-slate-500">
          Next round in{' '}
          {fmt(
            seconds
          )}
        </p>

        <Leaderboard
          rows={
            data.leaderboard
          }
        />
      </div>
    )
  }

  // ==========================================================
  // COMPLETED
  // ==========================================================

  if (
    state.phase ===
    'completed'
  ) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 p-8 text-center text-white">
          <Trophy className="mx-auto h-12 w-12" />

          <h1 className="mt-3 text-2xl font-bold">
            Competition Complete
          </h1>

          {data
            .leaderboard?.[0] && (
            <>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/80">
                Champion
              </p>

              <p className="mt-1 text-xl font-black">
                {
                  data
                    .leaderboard[0]
                    .name
                }
              </p>
            </>
          )}
        </div>

        <Leaderboard
          rows={
            data.leaderboard
          }
          final
        />
      </div>
    )
  }

  // ==========================================================
  // SUBMITTED CURRENT ROUND
  // ==========================================================

  if (
    data.viewerSubmitted
  ) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl bg-green-600 p-7 text-center text-white">
          <Check className="mx-auto h-10 w-10" />

          <p className="mt-3 text-4xl font-black">
            {
              data
                .viewerResult
                ?.score
            }
            /
            {
              data
                .viewerResult
                ?.total
            }
          </p>

          <p>
            {
              data
                .viewerResult
                ?.percentage
            }
            %
          </p>

          <p className="mt-3 text-xs">
            Round ends in{' '}
            {fmt(
              seconds
            )}
          </p>
        </div>

        <Leaderboard
          rows={
            data.leaderboard
          }
        />
      </div>
    )
  }

  // ==========================================================
  // REQUIRED SCREEN SHARE
  // ==========================================================

  if (
    shareRequired &&
    !sharing
  ) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <MonitorUp className="mx-auto h-12 w-12 text-purple-600" />

        <h1 className="mt-4 text-xl font-bold">
          Screen sharing is required
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Start browser screen sharing to unlock the exam interface.
        </p>

        <button
          type="button"
          onClick={
            startShare
          }
          className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white"
        >
          Start Screen Share
        </button>
      </div>
    )
  }

  // ==========================================================
  // OPTIONAL SCREEN SHARE
  // ==========================================================

  if (
    shareOptional &&
    !sharing &&
    !skipOptionalShare
  ) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <MonitorUp className="mx-auto h-12 w-12 text-purple-600" />

        <h1 className="mt-4 text-xl font-bold">
          Share your screen?
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          This competition allows optional browser screen sharing.
        </p>

        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={
              startShare
            }
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white"
          >
            Start Screen Share
          </button>

          <button
            type="button"
            onClick={() =>
              setSkipOptionalShare(
                true
              )
            }
            className="rounded-xl border px-5 py-3 text-sm font-semibold"
          >
            Continue Without Sharing
          </button>
        </div>
      </div>
    )
  }

  // ==========================================================
  // ACTIVE QUESTION
  // ==========================================================

  const q =
    data
      .currentSubject
      ?.questions?.[
        current
      ]

  if (
    !q
  ) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="mx-auto animate-spin" />

        <p className="mt-3 text-sm text-slate-500">
          Loading questions...
        </p>
      </div>
    )
  }

  // ==========================================================
  // ACTIVE EXAM
  // ==========================================================

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-4 flex items-center justify-between rounded-2xl border bg-white p-4">
        <div>
          <p className="text-[10px] font-bold uppercase text-blue-600">
            Round{' '}
            {state.currentSubjectIndex +
              1}
            /
            {room.subjects.length}
          </p>

          <p className="font-bold">
            {
              data
                .currentSubject
                .subject
            }
          </p>
        </div>

        <p className="font-mono font-bold">
          <Clock
            size={
              14
            }
            className="mr-1 inline"
          />

          {fmt(
            seconds
          )}
        </p>
      </div>

      {/* ======================================================
          SCREEN SHARE STATUS
      ====================================================== */}

      {sharing && (
        <div className="mb-3 rounded-xl bg-purple-50 p-2 text-center text-[10px] font-bold text-purple-700">
          Screen sharing active
        </div>
      )}

      {/* ======================================================
          QUESTION
      ====================================================== */}

      <div className="rounded-2xl border bg-white p-5">
        <p className="font-semibold leading-7">
          {current +
            1}
          . {q.text}
        </p>

        <div className="mt-5 space-y-2">
          {Object.entries(
            q.options ||
              {}
          ).map(
            ([
              key,
              value,
            ]) => (
              <button
                type="button"
                key={
                  key
                }
                onClick={() =>
                  setAnswers(
                    (
                      previous
                    ) => ({
                      ...previous,

                      [q.id]:
                        key,
                    })
                  )
                }
                className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                  answers[
                    q.id
                  ] ===
                  key
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <b className="mr-2 uppercase">
                  {key}.
                </b>

                {String(
                  value
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* ======================================================
          QUESTION NAVIGATION
      ====================================================== */}

      <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-10">
        {data
          .currentSubject
          .questions
          .map(
            (
              item:
                any,
              index:
                number
            ) => (
              <button
                type="button"
                key={
                  item.id
                }
                onClick={() =>
                  setCurrent(
                    index
                  )
                }
                className={`rounded-lg py-2 text-[10px] font-bold ${
                  index ===
                  current
                    ? 'bg-slate-950 text-white'
                    : answers[
                          item.id
                        ]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index +
                  1}
              </button>
            )
          )}
      </div>

      {/* ======================================================
          PREVIOUS / NEXT / SUBMIT
      ====================================================== */}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={
            current ===
            0
          }
          onClick={() =>
            setCurrent(
              (
                value
              ) =>
                Math.max(
                  0,
                  value -
                    1
                )
            )
          }
          className="flex-1 rounded-xl border py-3 text-sm font-semibold disabled:opacity-30"
        >
          Previous
        </button>

        {current <
        data
          .currentSubject
          .questions
          .length -
          1 ? (
          <button
            type="button"
            onClick={() =>
              setCurrent(
                (
                  value
                ) =>
                  Math.min(
                    data
                      .currentSubject
                      .questions
                      .length -
                      1,

                    value +
                      1
                  )
              )
            }
            className="flex-1 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={
              submitting
            }
            onClick={
              submit
            }
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Round'}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// LEADERBOARD
// ============================================================

function Leaderboard({
  rows,
  final = false,
}: {
  rows:
    any[]
  final?:
    boolean
}) {
  const safeRows =
    Array.isArray(
      rows
    )
      ? rows
      : []

  if (
    safeRows.length ===
    0
  ) {
    return (
      <div className="mt-5 rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">
        No participants yet.
      </div>
    )
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
      {safeRows.map(
        (
          row:
            any
        ) => (
          <div
            key={
              row.studentId
            }
            className="flex items-center justify-between border-b p-4 last:border-0"
          >
            <span>
              <b className="mr-3">
                {
                  row.rank
                }
                .
              </b>

              {row.name}

              {row.isViewer && (
                <span className="ml-2 text-xs font-semibold text-blue-600">
                  You
                </span>
              )}
            </span>

            <span className="font-bold">
              {final
                ? `${row.totalScore ?? 0}/${row.totalPossible ?? 0}`
                : row.currentSubjectScore
                  ? `${row.currentSubjectScore.score}/${row.currentSubjectScore.total}`
                  : row.submitted
                    ? 'Submitted'
                    : 'Taking exam'}
            </span>
          </div>
        )
      )}
    </div>
  )
}