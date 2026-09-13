// app/api/exam-prep/exam/start/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import crypto from 'crypto'

import connectDB from '@/lib/mongodb'

import ExamPrepSession from '@/models/ExamPrepSession'
import ExamPrepAttempt from '@/models/ExamPrepAttempt'

import {
  fetchExamQuestions,
} from '@/lib/alocApi'

import {
  classifyQuestionTopics,
  getAIQuestions,
  getQuestionBankQuestions,
  questionFingerprint,
  saveQuestionsToBank,
} from '@/lib/examAI'

import {
  requireExamPrepAccess,
} from '@/lib/examPrepAuth'

import {
  canonicalExamPrepSubject,
  isValidExamPrepClass,
  isValidExamStandard,
  type ExamStandard,
} from '@/lib/examPrepCatalog'

// ============================================================
// CONFIG
// ============================================================

const COUNT = 30

const ALLOWED_DURATIONS = [
  15,
  30,
  45,
  60,
]

// ============================================================
// TYPES
// ============================================================

type QuestionSource =
  | 'ai'
  | 'aloc'

type PreparedQuestion = {
  id: string

  fingerprint: string

  text: string

  options: {
    a: string
    b: string
    c: string
    d: string
  }

  correctAnswer:
    | 'a'
    | 'b'
    | 'c'
    | 'd'

  subject: string

  topic: string

  subtopic?: string

  difficulty:
    | 'easy'
    | 'medium'
    | 'hard'

  standard: string

  source:
    QuestionSource

  explanation?: string

  section?: string

  imageUrl?: string

  providerQuestionId?: string

  year?: number

  category?: string

  educationLevel?: string

  classLevel?: string

  country?: string

  publisher?: string

  authorised?: string

  curriculumMapping?: string
}

// ============================================================
// NORMALIZATION HELPERS
// ============================================================

function normalizeAnswer(
  value: unknown
):
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | '' {
  const answer =
    String(
      value || ''
    )
      .trim()
      .toLowerCase()

  if (
    answer === 'a' ||
    answer === 'b' ||
    answer === 'c' ||
    answer === 'd'
  ) {
    return answer
  }

  return ''
}

function normalizeDifficulty(
  value: unknown
):
  | 'easy'
  | 'medium'
  | 'hard' {
  const difficulty =
    String(
      value || ''
    )
      .trim()
      .toLowerCase()

  if (
    difficulty ===
    'easy'
  ) {
    return 'easy'
  }

  if (
    difficulty ===
    'hard'
  ) {
    return 'hard'
  }

  return 'medium'
}

function normalizeText(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
}

function normalizeYear(
  value: unknown
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const parsed =
    Number(
      value
    )

  if (
    !Number.isInteger(
      parsed
    )
  ) {
    return undefined
  }

  const currentYear =
    new Date()
      .getFullYear()

  if (
    parsed < 1980 ||
    parsed >
      currentYear
  ) {
    return undefined
  }

  return parsed
}

function normalizeSource(
  value: unknown
):
  QuestionSource {
  return normalizeText(
    value
  )
    .toLowerCase() ===
    'aloc'
    ? 'aloc'
    : 'ai'
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function hasValidOptions(
  options: any
) {
  return Boolean(
    normalizeText(
      options?.a
    ) &&
    normalizeText(
      options?.b
    ) &&
    normalizeText(
      options?.c
    ) &&
    normalizeText(
      options?.d
    )
  )
}

function questionAlreadyIncluded(
  questions:
    PreparedQuestion[],
  fingerprint: string
) {
  return questions.some(
    (
      question
    ) =>
      question
        .fingerprint ===
      fingerprint
  )
}

// ============================================================
// BUILD A PREPARED QUESTION
// ============================================================

function buildPreparedQuestion({
  raw,
  canonical,
  standard,
  source,
  idPrefix,
  fingerprint,
  topic,
  subtopic,
  difficulty,
}: {
  raw: any
  canonical: string
  standard: string
  source: QuestionSource
  idPrefix: string
  fingerprint?: string
  topic?: string
  subtopic?: string
  difficulty?: unknown
}):
  PreparedQuestion |
  null {
  const text =
    normalizeText(
      raw?.text ||
      raw?.question
    )

  if (!text) {
    return null
  }

  const options =
    raw?.options

  if (
    !hasValidOptions(
      options
    )
  ) {
    return null
  }

  const correctAnswer =
    normalizeAnswer(
      raw?.correctAnswer
    )

  if (
    !correctAnswer
  ) {
    return null
  }

  const safeFingerprint =
    normalizeText(
      fingerprint ||
      raw?.fingerprint
    ) ||
    questionFingerprint(
      canonical,
      text
    )

  /*
   * providerQuestionId should identify the external provider's
   * question, not our own locally generated question ID.
   *
   * ALOC questions may use raw.id as their provider ID.
   * AI questions must not accidentally expose their local ID as
   * though it came from an external provider.
   */
  const providerQuestionId =
    normalizeText(
      raw?.providerQuestionId
    ) ||
    (
      source ===
      'aloc'
        ? normalizeText(
            raw?.id
          )
        : ''
    )

  const rawId =
    normalizeText(
      raw?.id
    )

  const generatedId =
    `${idPrefix}-${crypto
      .randomBytes(
        8
      )
      .toString(
        'hex'
      )}`

  const safeId =
    rawId ||
    generatedId

  /*
   * Do not create IDs such as:
   *
   * ALOC-BANK-ALOC-123
   * AI-BANK-AI-123
   *
   * If the question already carries one of our recognised
   * prefixes, preserve it. Otherwise attach the requested prefix.
   */
  const preparedId =
    safeId.startsWith(
      'ALOC-'
    ) ||
    safeId.startsWith(
      'AI-'
    )
      ? safeId
      : `${idPrefix}-${safeId}`

  return {
    id:
      preparedId,

    fingerprint:
      safeFingerprint,

    text,

    options: {
      a:
        normalizeText(
          options.a
        ),

      b:
        normalizeText(
          options.b
        ),

      c:
        normalizeText(
          options.c
        ),

      d:
        normalizeText(
          options.d
        ),
    },

    correctAnswer,

    subject:
      canonical,

    topic:
      normalizeText(
        topic ||
        raw?.topic
      ) ||
      'General',

    subtopic:
      normalizeText(
        subtopic ||
        raw?.subtopic
      ) ||
      undefined,

    difficulty:
      normalizeDifficulty(
        difficulty ||
        raw?.difficulty
      ),

    standard:
      normalizeText(
        raw?.standard
      ) ||
      standard,

    source,

    explanation:
      normalizeText(
        raw?.explanation
      ) ||
      undefined,

    section:
      normalizeText(
        raw?.section
      ) ||
      undefined,

    imageUrl:
      normalizeText(
        raw?.imageUrl
      ) ||
      undefined,

    providerQuestionId:
      providerQuestionId ||
      undefined,

    year:
      Number.isFinite(
        Number(
          raw?.year
        )
      )
        ? Number(
            raw?.year
          )
        : undefined,

    category:
      normalizeText(
        raw?.category
      ) ||
      undefined,

    educationLevel:
      normalizeText(
        raw?.educationLevel
      ) ||
      undefined,

    classLevel:
      normalizeText(
        raw?.classLevel
      ) ||
      undefined,

    country:
      normalizeText(
        raw?.country
      ) ||
      undefined,

    publisher:
      normalizeText(
        raw?.publisher
      ) ||
      undefined,

    authorised:
      normalizeText(
        raw?.authorised
      ) ||
      undefined,

    curriculumMapping:
      normalizeText(
        raw?.curriculumMapping ||
        raw?.provenance
          ?.curriculumMapping
      ) ||
      undefined,
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    // ========================================================
    // 1. AUTH + SUBSCRIPTION + LOCK CHECK
    // ========================================================

    const access =
      await requireExamPrepAccess(
        req
      )

    if (
      !access.ok
    ) {
      return access.response
    }

    // ========================================================
    // 2. REQUEST BODY
    // ========================================================

    const body =
      await req.json()

    const {
      examType,
      subject,
      studentClass,
      durationMinutes = 30,
      year,
    } = body

    const standard =
      normalizeText(
        examType
      )
        .toLowerCase()

    const canonical =
      canonicalExamPrepSubject(
        normalizeText(
          subject
        )
      )

    const normalizedClass =
      normalizeText(
        studentClass
      )
        .toLowerCase()

    // ========================================================
    // 3. VALIDATE CONFIGURATION
    // ========================================================

    if (
      !isValidExamStandard(
        standard
      ) ||
      !canonical ||
      !isValidExamPrepClass(
        normalizedClass
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid exam configuration.',
        },
        {
          status:
            400,
        }
      )
    }

    const cleanYear =
      normalizeYear(
        year
      )

    // ========================================================
    // 4. DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // 5. RECENT QUESTIONS
    // ========================================================

    /*
     * Prevent a student from repeatedly receiving questions
     * from their most recent attempts for the same subject.
     */

    const recent =
      await ExamPrepAttempt
        .find({
          examPrepStudentId:
            access
              .student
              ._id,

          subject:
            canonical,
        })
        .sort({
          createdAt:
            -1,
        })
        .limit(
          10
        )
        .select(
          'breakdown.fingerprint'
        )
        .lean()

    const recentFingerprints =
      Array.from(
        new Set<string>(
          recent.flatMap(
            (
              attempt:
                any
            ) =>
              Array.isArray(
                attempt
                  ?.breakdown
              )
                ? attempt
                    .breakdown
                    .map(
                      (
                        item:
                          any
                      ) =>
                        normalizeText(
                          item
                            ?.fingerprint
                        )
                    )
                    .filter(
                      Boolean
                    )
                : []
          )
        )
      )

    // ========================================================
    // 6. PREPARED QUESTION STATE
    // ========================================================

    const questions:
      PreparedQuestion[] =
      []

    /*
     * These counters describe HOW questions were obtained.
     */

    let freshAlocLoaded =
      0

    let bankLoaded =
      0

    let bankAlocLoaded =
      0

    let bankAiLoaded =
      0

    let aiFallbackLoaded =
      0

    let alocWorked =
      false

    // ========================================================
    // 7. ALOC FIRST
    // ========================================================

    /*
     * Desired priority:
     *
     * JAMB / WAEC / NECO
     *
     * 1. ALOC
     * 2. Question Bank
     * 3. AI
     *
     * IGCSE / Mixed do not use ALOC directly, therefore:
     *
     * 1. Question Bank
     * 2. AI
     */

    const usesAloc =
      [
        'jamb',
        'waec',
        'neco',
      ].includes(
        standard
      )

    if (
      usesAloc
    ) {
      try {
        // ----------------------------------------------------
        // ASK ALOC FOR THE FULL EXAM FIRST
        // ----------------------------------------------------

        const raw =
          await fetchExamQuestions({
            examType:
              standard as
                | 'jamb'
                | 'waec'
                | 'neco',

            subject:
              canonical,

            year:
              cleanYear,

            count:
              COUNT,
          })

        // ----------------------------------------------------
        // VALIDATE ALOC RESPONSE
        // ----------------------------------------------------

        const seen =
          new Set<string>(
            recentFingerprints
          )

        const usable =
          (
            Array.isArray(
              raw
            )
              ? raw
              : []
          )
            .filter(
              (
                question:
                  any
              ) => {
                const text =
                  normalizeText(
                    question
                      ?.text
                  )

                if (!text) {
                  return false
                }

                if (
                  !normalizeAnswer(
                    question
                      ?.correctAnswer
                  )
                ) {
                  return false
                }

                if (
                  !hasValidOptions(
                    question
                      ?.options
                  )
                ) {
                  return false
                }

                const fingerprint =
                  questionFingerprint(
                    canonical,
                    text
                  )

                if (
                  seen.has(
                    fingerprint
                  )
                ) {
                  return false
                }

                seen.add(
                  fingerprint
                )

                return true
              }
            )
            .slice(
              0,
              COUNT
            )

        // ====================================================
        // 7A. CLASSIFY ALOC QUESTIONS
        // ====================================================

        /*
         * AI classification does not generate replacement questions.
         *
         * It only gives the real ALOC questions:
         *
         * - topic
         * - subtopic
         * - difficulty
         *
         * If classification fails, the ALOC questions remain usable.
         */

        let classified:
          any[] =
          []

        if (
          usable.length >
          0
        ) {
          try {
            const result =
              await classifyQuestionTopics(
                canonical,

                usable.map(
                  (
                    question:
                      any
                  ) => ({
                    id:
                      normalizeText(
                        question
                          ?.id
                      ),

                    fingerprint:
                      questionFingerprint(
                        canonical,
                        normalizeText(
                          question
                            ?.text
                        )
                      ),

                    text:
                      normalizeText(
                        question
                          ?.text
                      ),

                    topic:
                      normalizeText(
                        question
                          ?.topic
                      ),

                    subtopic:
                      normalizeText(
                        question
                          ?.subtopic
                      ),

                    difficulty:
                      normalizeText(
                        question
                          ?.difficulty
                      ),

                    category:
                      normalizeText(
                        question
                          ?.category
                      ),

                    section:
                      normalizeText(
                        question
                          ?.section
                      ),

                    curriculumMapping:
                      normalizeText(
                        question
                          ?.curriculumMapping ||
                        question
                          ?.provenance
                          ?.curriculumMapping
                      ),
                  })
                )
              )

            classified =
              Array.isArray(
                result
              )
                ? result
                : []
          } catch (
            classificationError
          ) {
            console.error(
              'ALOC topic classification failed:',
              classificationError
            )

            classified =
              []
          }
        }

        // ====================================================
        // 7B. NORMALIZE ALOC QUESTIONS
        // ====================================================

        const freshAlocQuestions:
          PreparedQuestion[] =
          []

        for (
          let index = 0;
          index <
          usable.length;
          index += 1
        ) {
          if (
            questions.length >=
            COUNT
          ) {
            break
          }

          const rawQuestion =
            usable[
              index
            ]

          const text =
            normalizeText(
              rawQuestion
                ?.text
            )

          if (!text) {
            continue
          }

          const fingerprint =
            questionFingerprint(
              canonical,
              text
            )

          if (
            recentFingerprints
              .includes(
                fingerprint
              )
          ) {
            continue
          }

          if (
            questionAlreadyIncluded(
              questions,
              fingerprint
            )
          ) {
            continue
          }

          // --------------------------------------------------
          // FIND AI CLASSIFICATION FOR THIS ALOC QUESTION
          // --------------------------------------------------

          const questionId =
            normalizeText(
              rawQuestion
                ?.id
            )

          const classifiedMeta =
            classified.find(
              (
                item:
                  any
              ) => {
                const itemId =
                  normalizeText(
                    item
                      ?.id
                  )

                const itemFingerprint =
                  normalizeText(
                    item
                      ?.fingerprint
                  )

                return (
                  (
                    questionId &&
                    itemId ===
                      questionId
                  ) ||
                  (
                    itemFingerprint &&
                    itemFingerprint ===
                      fingerprint
                  )
                )
              }
            ) ||
            classified[
              index
            ] ||
            {}

          const prepared =
            buildPreparedQuestion({
              raw:
                rawQuestion,

              canonical,

              standard,

              source:
                'aloc',

              idPrefix:
                'ALOC',

              fingerprint,

              topic:
                normalizeText(
                  classifiedMeta
                    ?.topic ||
                  rawQuestion
                    ?.topic
                ) ||
                'General',

              subtopic:
                normalizeText(
                  classifiedMeta
                    ?.subtopic ||
                  rawQuestion
                    ?.subtopic
                ),

              difficulty:
                classifiedMeta
                  ?.difficulty ||
                rawQuestion
                  ?.difficulty,
            })

          if (
            !prepared
          ) {
            continue
          }

          questions.push(
            prepared
          )

          freshAlocQuestions.push(
            prepared
          )

          freshAlocLoaded +=
            1
        }

        alocWorked =
          freshAlocQuestions
            .length >
          0

        // ====================================================
        // 7C. SAVE FRESH ALOC QUESTIONS TO BANK
        // ====================================================

        /*
         * Even though ALOC is always attempted first,
         * saving fresh questions to MongoDB is still useful.
         *
         * They can be used whenever ALOC later fails or does not
         * provide enough questions.
         */

        if (
          freshAlocQuestions
            .length >
          0
        ) {
          try {
            await saveQuestionsToBank(
              freshAlocQuestions
            )
          } catch (
            bankSaveError
          ) {
            /*
             * Bank saving is only caching.
             *
             * It must never destroy the current exam.
             */

            console.error(
              'Could not save ALOC questions to bank:',
              bankSaveError
            )
          }
        }

        if (
          process.env
            .NODE_ENV !==
          'production'
        ) {
          console.log(
            '[ALOC FIRST] Result:',
            {
              subject:
                canonical,

              standard,

              requested:
                COUNT,

              received:
                Array.isArray(
                  raw
                )
                  ? raw.length
                  : 0,

              usable:
                usable.length,

              added:
                freshAlocQuestions
                  .length,

              remaining:
                Math.max(
                  0,
                  COUNT -
                    questions.length
                ),
            }
          )
        }
      } catch (
        alocError
      ) {
        /*
         * This is the important fallback.
         *
         * ALOC failure does NOT fail the exam.
         *
         * The next stage now checks our own question bank.
         */

        console.error(
          'ALOC failed. Checking question bank:',
          alocError
        )
      }
    }

    // ========================================================
    // 8. QUESTION BANK SECOND
    // ========================================================

    /*
     * This only runs when:
     *
     * - ALOC failed
     * - ALOC returned too few questions
     * - ALOC questions were invalid/recent duplicates
     * - standard is IGCSE or Mixed
     *
     * Examples:
     *
     * ALOC = 30
     * → Bank is not needed
     *
     * ALOC = 20
     * → Bank is asked for 10
     *
     * ALOC = 0
     * → Bank is asked for 30
     */

    if (
      questions.length <
      COUNT
    ) {
      const bankNeeded =
        COUNT -
        questions.length

      try {
        const bankQuestions =
          await getQuestionBankQuestions({
            subject:
              canonical,

            standard:
              standard as
                ExamStandard,

            studentClass:
              normalizedClass,

            count:
              bankNeeded,

            source:
              'any',

            excludeFingerprints:
              [
                ...recentFingerprints,

                ...questions.map(
                  (
                    question
                  ) =>
                    question
                      .fingerprint
                ),
              ],

            incrementUsage:
              true,
          })

        for (
          const rawBankQuestion of
            Array.isArray(
              bankQuestions
            )
              ? bankQuestions
              : []
        ) {
          if (
            questions.length >=
            COUNT
          ) {
            break
          }

          const text =
            normalizeText(
              rawBankQuestion
                ?.text
            )

          if (!text) {
            continue
          }

          const fingerprint =
            normalizeText(
              rawBankQuestion
                ?.fingerprint
            ) ||
            questionFingerprint(
              canonical,
              text
            )

          if (
            recentFingerprints
              .includes(
                fingerprint
              )
          ) {
            continue
          }

          if (
            questionAlreadyIncluded(
              questions,
              fingerprint
            )
          ) {
            continue
          }

          const source =
            normalizeSource(
              rawBankQuestion
                ?.source
            )

          const prepared =
            buildPreparedQuestion({
              raw:
                rawBankQuestion,

              canonical,

              standard,

              source,

              idPrefix:
                source ===
                'aloc'
                  ? 'ALOC-BANK'
                  : 'AI-BANK',

              fingerprint,

              topic:
                normalizeText(
                  rawBankQuestion
                    ?.topic
                ) ||
                'General',

              subtopic:
                normalizeText(
                  rawBankQuestion
                    ?.subtopic
                ),

              difficulty:
                rawBankQuestion
                  ?.difficulty,
            })

          if (
            !prepared
          ) {
            continue
          }

          questions.push(
            prepared
          )

          bankLoaded +=
            1

          if (
            source ===
            'aloc'
          ) {
            bankAlocLoaded +=
              1
          } else {
            bankAiLoaded +=
              1
          }
        }

        if (
          process.env
            .NODE_ENV !==
          'production'
        ) {
          console.log(
            '[QUESTION BANK SECOND] Result:',
            {
              subject:
                canonical,

              standard,

              requested:
                bankNeeded,

              loaded:
                bankLoaded,

              alocOrigin:
                bankAlocLoaded,

              aiOrigin:
                bankAiLoaded,

              remaining:
                Math.max(
                  0,
                  COUNT -
                    questions.length
                ),
            }
          )
        }
      } catch (
        bankError
      ) {
        /*
         * Bank problems must not prevent the exam.
         *
         * AI is the final fallback.
         */

        console.error(
          'Question bank failed. Falling back to AI:',
          bankError
        )
      }
    }

    // ========================================================
    // 9. AI FINAL FALLBACK
    // ========================================================

    /*
     * AI is reached only after:
     *
     * 1. ALOC was attempted first for JAMB / WAEC / NECO.
     * 2. The shared question bank was checked for the shortage.
     *
     * getAIQuestions() is called with skipBank=true here,
     * so this final stage generates fresh AI questions only
     * for whatever number of questions is still missing.
     *
     * Examples:
     *
     * ALOC 30
     * → Bank skipped
     * → AI skipped
     *
     * ALOC 20 + Bank 10
     * → AI skipped
     *
     * ALOC 20 + Bank 6
     * → AI generates 4
     *
     * ALOC 0 + Bank 18
     * → AI generates 12
     *
     * ALOC 0 + Bank 0
     * → AI generates 30
     */

    if (
      questions.length <
      COUNT
    ) {
      const aiNeeded =
        COUNT -
        questions.length

      try {
        const suppliedQuestions =
          await getAIQuestions({
            subject:
              canonical,

            standard:
              standard as
                ExamStandard,

            studentClass:
              normalizedClass,

            count:
              aiNeeded,

            excludeFingerprints:
              [
                ...recentFingerprints,

                ...questions.map(
                  (
                    question
                  ) =>
                    question
                      .fingerprint
                ),
              ],

            /*
             * The shared bank was already checked in stage 8.
             *
             * Skip it here so this final stage performs only fresh
             * AI generation for the remaining shortage.
             */
            skipBank:
              true,
          })

        for (
          const suppliedQuestion of
            Array.isArray(
              suppliedQuestions
            )
              ? suppliedQuestions
              : []
        ) {
          if (
            questions.length >=
            COUNT
          ) {
            break
          }

          const text =
            normalizeText(
              suppliedQuestion
                ?.text
            )

          if (!text) {
            continue
          }

          const fingerprint =
            normalizeText(
              suppliedQuestion
                ?.fingerprint
            ) ||
            questionFingerprint(
              canonical,
              text
            )

          if (
            recentFingerprints
              .includes(
                fingerprint
              )
          ) {
            continue
          }

          if (
            questionAlreadyIncluded(
              questions,
              fingerprint
            )
          ) {
            continue
          }

          /*
           * skipBank=true means this stage should return fresh
           * AI-generated questions only.
           */

          const source =
            normalizeSource(
              suppliedQuestion
                ?.source
            )

          const prepared =
            buildPreparedQuestion({
              raw:
                suppliedQuestion,

              canonical,

              standard,

              source,

              idPrefix:
                source ===
                'aloc'
                  ? 'ALOC-BANK'
                  : 'AI',

              fingerprint,

              topic:
                normalizeText(
                  suppliedQuestion
                    ?.topic
                ) ||
                'General',

              subtopic:
                normalizeText(
                  suppliedQuestion
                    ?.subtopic
                ),

              difficulty:
                suppliedQuestion
                  ?.difficulty,
            })

          if (
            !prepared
          ) {
            continue
          }

          questions.push(
            prepared
          )

          /*
           * With skipBank=true this should normally be "ai".
           * We still normalize the source defensively.
           */

          if (
            source ===
            'ai'
          ) {
            aiFallbackLoaded +=
              1
          } else {
            bankAlocLoaded +=
              1
          }
        }

        if (
          process.env
            .NODE_ENV !==
          'production'
        ) {
          console.log(
            '[AI FINAL FALLBACK] Result:',
            {
              subject:
                canonical,

              requested:
                aiNeeded,

              received:
                Array.isArray(
                  suppliedQuestions
                )
                  ? suppliedQuestions
                      .length
                  : 0,

              aiAdded:
                aiFallbackLoaded,

              total:
                questions.length,

              remaining:
                Math.max(
                  0,
                  COUNT -
                    questions.length
                ),
            }
          )
        }
      } catch (
        aiError
      ) {
        console.error(
          'AI exam question fallback failed:',
          aiError
        )
      }
    }

    // ========================================================
    // 10. REQUIRE A COMPLETE QUESTION SET
    // ========================================================

    /*
     * Never create a 30-question exam with fewer than 30
     * questions.
     *
     * Groq can occasionally return fewer questions than requested
     * because of rate limits, timeouts or invalid generated items.
     * In that case the student should receive a temporary error and
     * retry rather than unknowingly starting an incomplete exam.
     */

    if (
      questions.length <
      COUNT
    ) {
      const preparedCount =
        questions.length

      const shortage =
        COUNT -
        preparedCount

      console.warn(
        '[EXAM PREP] Incomplete question set:',
        {
          subject:
            canonical,

          standard,

          required:
            COUNT,

          prepared:
            preparedCount,

          shortage,
        }
      )

      return NextResponse.json(
        {
          error:
            'We could not prepare the full exam at this time. Please wait a moment and try again.',

          requiredQuestionCount:
            COUNT,

          preparedQuestionCount:
            preparedCount,
        },
        {
          status:
            503,
        }
      )
    }

    // ========================================================
    // 11. FINAL QUESTION SET
    // ========================================================

    const finalQuestions =
      questions.slice(
        0,
        COUNT
      )

    // ========================================================
    // 12. DURATION
    // ========================================================

    const requestedDuration =
      Number(
        durationMinutes
      )

    const safeDuration =
      ALLOWED_DURATIONS
        .includes(
          requestedDuration
        )
        ? requestedDuration
        : 30

    // ========================================================
    // 13. SESSION TOKEN
    // ========================================================

    const sessionToken =
      crypto
        .randomBytes(
          24
        )
        .toString(
          'hex'
        )

    // ========================================================
    // 14. CREATE EXAM SESSION
    // ========================================================

    /*
     * Correct answers stay on the server.
     *
     * They are NOT returned to the browser before submission.
     *
     * topic/subtopic/difficulty/source are stored so the submit
     * route can later create accurate performance analytics.
     */

    await ExamPrepSession.create({
      sessionToken,

      examPrepStudentId:
        access
          .student
          ._id,

      examType:
        standard,

      subject:
        canonical,

      studentClass:
        normalizedClass,

      questions:
        finalQuestions,

      durationMinutes:
        safeDuration,

      used:
        false,

      expiresAt:
        new Date(
          Date.now() +
            (
              safeDuration +
              15
            ) *
              60 *
              1000
        ),
    })

    // ========================================================
    // 15. ORIGINAL SOURCE BREAKDOWN
    // ========================================================

    /*
     * "source" means where the question originally came from.
     *
     * Therefore:
     *
     * ALOC question fetched live:
     * source = aloc
     *
     * ALOC question reused from bank:
     * source = aloc
     *
     * AI question reused from bank:
     * source = ai
     *
     * Fresh AI question:
     * source = ai
     */

    const alocCount =
      finalQuestions
        .filter(
          (
            question
          ) =>
            question
              .source ===
            'aloc'
        )
        .length

    const aiCount =
      finalQuestions
        .filter(
          (
            question
          ) =>
            question
              .source ===
            'ai'
        )
        .length

    let questionSource:
      | 'aloc'
      | 'ai'
      | 'hybrid'

    if (
      alocCount >
        0 &&
      aiCount >
        0
    ) {
      questionSource =
        'hybrid'
    } else if (
      alocCount >
      0
    ) {
      questionSource =
        'aloc'
    } else {
      questionSource =
        'ai'
    }

    // ========================================================
    // 16. DEVELOPMENT LOGGING
    // ========================================================

    if (
      process.env
        .NODE_ENV !==
      'production'
    ) {
      const generalTopics =
        finalQuestions
          .filter(
            (
              question
            ) =>
              !question
                .topic ||
              normalizeText(
                question
                  .topic
              )
                .toLowerCase() ===
                'general'
          )
          .length

      console.log(
        '[EXAM PREP] Session prepared:',
        {
          studentId:
            String(
              access
                .student
                ._id
            ),

          standard,

          subject:
            canonical,

          requested:
            COUNT,

          total:
            finalQuestions
              .length,

          flow:
            usesAloc
              ? 'ALOC -> BANK -> AI'
              : 'BANK -> AI',

          sourceBreakdown: {
            aloc:
              alocCount,

            ai:
              aiCount,
          },

          preparationBreakdown: {
            freshAloc:
              freshAlocLoaded,

            bank:
              bankLoaded,

            bankAlocOrigin:
              bankAlocLoaded,

            bankAiOrigin:
              bankAiLoaded,

            aiFallback:
              aiFallbackLoaded,
          },

          questionSource,

          alocWorked,

          generalTopics,

          classifiedTopics:
            finalQuestions
              .length -
            generalTopics,
        }
      )

      console.log(
        '[EXAM PREP] Analytics metadata sample:',
        finalQuestions
          .slice(
            0,
            10
          )
          .map(
            (
              question
            ) => ({
              source:
                question
                  .source,

              topic:
                question
                  .topic,

              subtopic:
                question
                  .subtopic,

              difficulty:
                question
                  .difficulty,

              providerQuestionId:
                question
                  .providerQuestionId,
            })
          )
      )
    }

    // ========================================================
    // 17. RESPONSE
    // ========================================================

    /*
     * SECURITY:
     *
     * Never expose:
     *
     * correctAnswer
     * explanation
     *
     * before the student submits the exam.
     */

    return NextResponse.json({
      success:
        true,

      sessionToken,

      durationMinutes:
        safeDuration,

      questionSource,

      requestedQuestionCount:
        COUNT,

      questionCount:
        finalQuestions
          .length,

      /*
       * True only when the live ALOC request produced at least
       * one usable question during this request.
       */

      alocWorked,

      /*
       * Original question provenance.
       */

      sourceBreakdown: {
        aloc:
          alocCount,

        ai:
          aiCount,
      },

      /*
       * Shows which infrastructure actually supplied questions
       * during this request.
       */

      preparationBreakdown: {
        freshAloc:
          freshAlocLoaded,

        fromBank:
          bankLoaded,

        bankAlocOrigin:
          bankAlocLoaded,

        bankAiOrigin:
          bankAiLoaded,

        aiFallback:
          aiFallbackLoaded,
      },

      questions:
        finalQuestions
          .map(
            (
              question
            ) => ({
              id:
                question
                  .id,

              text:
                question
                  .text,

              options:
                question
                  .options,

              topic:
                question
                  .topic,

              section:
                question
                  .section ||
                '',

              imageUrl:
                question
                  .imageUrl ||
                '',
            })
          ),
    })
  } catch (
    error
  ) {
    console.error(
      'Exam start:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not start exam.',
      },
      {
        status:
          500,
      }
    )
  }
}