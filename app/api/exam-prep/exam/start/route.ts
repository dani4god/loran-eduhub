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
// HELPERS
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
    // 5. RECENT QUESTION FINGERPRINTS
    // ========================================================

    /*
     * Prevent the student from receiving questions that appeared
     * in their most recent exams for this subject.
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
    // 6. PREPARED QUESTIONS
    // ========================================================

    const questions:
      PreparedQuestion[] =
      []

    let bankLoaded =
      0

    let bankAlocLoaded =
      0

    let bankAiLoaded =
      0

    let freshAlocLoaded =
      0

    let freshAiLoaded =
      0

    let alocWorked =
      false

    // ========================================================
    // 7. QUESTION BANK FIRST
    // ========================================================

    /*
     * This is the important optimisation.
     *
     * Before spending an ALOC credit or making a Groq request,
     * try to satisfy the exam from our own database.
     *
     * The bank can contain both:
     *
     * source = "aloc"
     * source = "ai"
     */

    try {
      const bankQuestions =
        await getQuestionBankQuestions(
          {
            subject:
              canonical,

            standard:
              standard as
                ExamStandard,

            studentClass:
              normalizedClass,

            count:
              COUNT,

            source:
              'any',

            excludeFingerprints:
              recentFingerprints,

            incrementUsage:
              true,
          }
        )

      for (
        const bankQuestion of
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
            bankQuestion
              ?.text
          )

        if (
          !text
        ) {
          continue
        }

        const fingerprint =
          normalizeText(
            bankQuestion
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

        const correctAnswer =
          normalizeAnswer(
            bankQuestion
              ?.correctAnswer
          )

        if (
          !correctAnswer
        ) {
          continue
        }

        if (
          !hasValidOptions(
            bankQuestion
              ?.options
          )
        ) {
          continue
        }

        const source =
          normalizeSource(
            bankQuestion
              ?.source
          )

        const prepared:
          PreparedQuestion =
          {
            id:
              normalizeText(
                bankQuestion
                  ?.id
              ) ||
              `${
                source ===
                'aloc'
                  ? 'ALOC-BANK'
                  : 'AI-BANK'
              }-${crypto
                .randomBytes(
                  8
                )
                .toString(
                  'hex'
                )}`,

            fingerprint,

            text,

            options: {
              a:
                normalizeText(
                  bankQuestion
                    .options
                    .a
                ),

              b:
                normalizeText(
                  bankQuestion
                    .options
                    .b
                ),

              c:
                normalizeText(
                  bankQuestion
                    .options
                    .c
                ),

              d:
                normalizeText(
                  bankQuestion
                    .options
                    .d
                ),
            },

            correctAnswer,

            subject:
              canonical,

            topic:
              normalizeText(
                bankQuestion
                  ?.topic
              ) ||
              'General',

            subtopic:
              normalizeText(
                bankQuestion
                  ?.subtopic
              ) ||
              undefined,

            difficulty:
              normalizeDifficulty(
                bankQuestion
                  ?.difficulty
              ),

            standard:
              normalizeText(
                bankQuestion
                  ?.standard
              ) ||
              standard,

            source,

            explanation:
              normalizeText(
                bankQuestion
                  ?.explanation
              ) ||
              undefined,

            section:
              normalizeText(
                bankQuestion
                  ?.section
              ) ||
              undefined,

            imageUrl:
              normalizeText(
                bankQuestion
                  ?.imageUrl
              ) ||
              undefined,

            providerQuestionId:
              normalizeText(
                bankQuestion
                  ?.providerQuestionId
              ) ||
              undefined,

            year:
              Number.isFinite(
                Number(
                  bankQuestion
                    ?.year
                )
              )
                ? Number(
                    bankQuestion
                      ?.year
                  )
                : undefined,

            category:
              normalizeText(
                bankQuestion
                  ?.category
              ) ||
              undefined,

            educationLevel:
              normalizeText(
                bankQuestion
                  ?.educationLevel
              ) ||
              undefined,

            classLevel:
              normalizeText(
                bankQuestion
                  ?.classLevel
              ) ||
              undefined,

            country:
              normalizeText(
                bankQuestion
                  ?.country
              ) ||
              undefined,

            publisher:
              normalizeText(
                bankQuestion
                  ?.publisher
              ) ||
              undefined,

            authorised:
              normalizeText(
                bankQuestion
                  ?.authorised
              ) ||
              undefined,

            curriculumMapping:
              normalizeText(
                bankQuestion
                  ?.curriculumMapping
              ) ||
              undefined,
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
          '[QUESTION BANK] Loaded:',
          {
            subject:
              canonical,

            standard,

            requested:
              COUNT,

            loaded:
              bankLoaded,

            aloc:
              bankAlocLoaded,

            ai:
              bankAiLoaded,

            remaining:
              COUNT -
              questions.length,
          }
        )
      }
    } catch (
      bankError
    ) {
      /*
       * Bank failure must not prevent the exam.
       *
       * ALOC / AI can still supply questions.
       */

      console.error(
        'Question bank lookup failed:',
        bankError
      )
    }

    // ========================================================
    // 8. ALOC FOR SHORTAGE ONLY
    // ========================================================

    /*
     * ALOC only applies directly to:
     *
     * JAMB
     * WAEC
     * NECO
     *
     * If the bank already gave us 24 questions, for example,
     * we only request the remaining 6.
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
      usesAloc &&
      questions.length <
        COUNT
    ) {
      const alocNeeded =
        COUNT -
        questions.length

      try {
        const raw =
          await fetchExamQuestions(
            {
              examType:
                standard as
                  | 'jamb'
                  | 'waec'
                  | 'neco',

              /*
               * lib/alocApi.ts performs the ALOC subject mapping.
               */
              subject:
                canonical,

              year:
                cleanYear,

              count:
                alocNeeded,
            }
          )

        // ====================================================
        // 8A. VALIDATE + REMOVE DUPLICATES
        // ====================================================

        const excludedNow =
          new Set<string>([
            ...recentFingerprints,

            ...questions.map(
              (
                question
              ) =>
                question
                  .fingerprint
            ),
          ])

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

                if (
                  !text
                ) {
                  return false
                }

                const correctAnswer =
                  normalizeAnswer(
                    question
                      ?.correctAnswer
                  )

                if (
                  !correctAnswer
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

                return !excludedNow.has(
                  fingerprint
                )
              }
            )
            .slice(
              0,
              alocNeeded
            )

        // ====================================================
        // 8B. CLASSIFY NEW ALOC QUESTIONS
        // ====================================================

        /*
         * Only fresh ALOC questions need this.
         *
         * ALOC questions retrieved from our bank were classified
         * when they originally entered the bank.
         */

        let classified:
          any[] =
          []

        if (
          usable.length >
          0
        ) {
          try {
            classified =
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

                    /*
                     * Do not convert category such as passage-a
                     * into an academic topic.
                     */
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

                    /*
                     * Context only.
                     */
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

            if (
              !Array.isArray(
                classified
              )
            ) {
              classified =
                []
            }

            if (
              process.env
                .NODE_ENV !==
              'production'
            ) {
              console.log(
                '[ALOC AI Classification]',
                {
                  subject:
                    canonical,

                  received:
                    usable.length,

                  classified:
                    classified.length,

                  sample:
                    classified
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          item:
                            any
                        ) => ({
                          id:
                            item
                              ?.id,

                          topic:
                            item
                              ?.topic,

                          subtopic:
                            item
                              ?.subtopic,

                          difficulty:
                            item
                              ?.difficulty,
                        })
                      ),
                }
              )
            }
          } catch (
            classificationError
          ) {
            /*
             * Topic classification is enrichment.
             *
             * A temporary Groq problem must not throw away valid
             * ALOC examination questions.
             */

            console.error(
              'ALOC topic classification failed:',
              classificationError
            )

            classified =
              []
          }
        }

        // ====================================================
        // 8C. NORMALIZE FRESH ALOC QUESTIONS
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

          const q =
            usable[
              index
            ]

          const text =
            normalizeText(
              q
                ?.text
            )

          if (
            !text
          ) {
            continue
          }

          const correctAnswer =
            normalizeAnswer(
              q
                ?.correctAnswer
            )

          if (
            !correctAnswer
          ) {
            continue
          }

          const options =
            q
              ?.options

          if (
            !hasValidOptions(
              options
            )
          ) {
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

          // ================================================
          // CLASSIFICATION METADATA
          // ================================================

          const questionId =
            normalizeText(
              q
                ?.id
            )

          const classifiedMeta =
            classified.find(
              (
                item:
                  any
              ) => {
                const classifiedId =
                  normalizeText(
                    item
                      ?.id
                  )

                const classifiedFingerprint =
                  normalizeText(
                    item
                      ?.fingerprint
                  )

                return (
                  (
                    questionId &&
                    classifiedId ===
                      questionId
                  ) ||
                  (
                    classifiedFingerprint &&
                    classifiedFingerprint ===
                      fingerprint
                  )
                )
              }
            ) ||
            classified[
              index
            ] ||
            {}

          /*
           * AI topic classification has first priority.
           *
           * ALOC's own topic is the fallback.
           *
           * ALOC category is never treated as the topic.
           */

          const topic =
            normalizeText(
              classifiedMeta
                ?.topic ||
              q
                ?.topic
            ) ||
            'General'

          const subtopic =
            normalizeText(
              classifiedMeta
                ?.subtopic ||
              q
                ?.subtopic
            )

          const difficulty =
            normalizeDifficulty(
              classifiedMeta
                ?.difficulty ||
              q
                ?.difficulty ||
              'medium'
            )

          const prepared:
            PreparedQuestion =
            {
              id:
                `ALOC-${String(
                  q
                    ?.id ||
                  crypto
                    .randomBytes(
                      8
                    )
                    .toString(
                      'hex'
                    )
                )}`,

              /*
               * Keep the actual ALOC ID separately because the
               * session question ID has the ALOC- prefix.
               */
              providerQuestionId:
                normalizeText(
                  q
                    ?.id
                ) ||
                undefined,

              fingerprint,

              text,

              options: {
                a:
                  normalizeText(
                    options
                      .a
                  ),

                b:
                  normalizeText(
                    options
                      .b
                  ),

                c:
                  normalizeText(
                    options
                      .c
                  ),

                d:
                  normalizeText(
                    options
                      .d
                  ),
              },

              correctAnswer,

              subject:
                canonical,

              topic,

              subtopic:
                subtopic ||
                undefined,

              difficulty,

              standard,

              source:
                'aloc',

              explanation:
                normalizeText(
                  q
                    ?.explanation
                ) ||
                undefined,

              section:
                normalizeText(
                  q
                    ?.section
                ) ||
                undefined,

              imageUrl:
                normalizeText(
                  q
                    ?.imageUrl
                ) ||
                undefined,

              category:
                normalizeText(
                  q
                    ?.category
                ) ||
                undefined,

              year:
                Number.isFinite(
                  Number(
                    q
                      ?.year
                  )
                )
                  ? Number(
                      q
                        ?.year
                    )
                  : undefined,

              educationLevel:
                normalizeText(
                  q
                    ?.educationLevel
                ) ||
                undefined,

              classLevel:
                normalizeText(
                  q
                    ?.classLevel
                ) ||
                undefined,

              country:
                normalizeText(
                  q
                    ?.country
                ) ||
                undefined,

              publisher:
                normalizeText(
                  q
                    ?.publisher
                ) ||
                undefined,

              authorised:
                normalizeText(
                  q
                    ?.authorised
                ) ||
                undefined,

              curriculumMapping:
                normalizeText(
                  q
                    ?.curriculumMapping ||
                  q
                    ?.provenance
                    ?.curriculumMapping
                ) ||
                undefined,
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
        // 8D. SAVE NEW ALOC QUESTIONS TO SHARED BANK
        // ====================================================

        /*
         * This is what makes the next student's exam cheaper.
         *
         * These questions now become reusable without another
         * ALOC request or another classification request.
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

            if (
              process.env
                .NODE_ENV !==
              'production'
            ) {
              console.log(
                '[ALOC BANK] Saved:',
                {
                  subject:
                    canonical,

                  standard,

                  saved:
                    freshAlocQuestions
                      .length,
                }
              )
            }
          } catch (
            bankSaveError
          ) {
            /*
             * Saving is optimisation only.
             *
             * Valid questions must still be usable even when Mongo
             * caching fails.
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
            '[ALOC] Fresh questions:',
            {
              subject:
                canonical,

              requested:
                alocNeeded,

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
                COUNT -
                questions.length,

              topics:
                freshAlocQuestions
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      question
                    ) => ({
                      topic:
                        question
                          .topic,

                      subtopic:
                        question
                          .subtopic,

                      difficulty:
                        question
                          .difficulty,
                    })
                  ),
            }
          )
        }
      } catch (
        error
      ) {
        /*
         * ALOC failure should never destroy exam creation.
         *
         * AI will attempt the remaining shortage.
         */

        console.error(
          'ALOC fallback:',
          error
        )
      }
    }

    // ========================================================
    // 9. AI / SHARED BANK FINAL TOP-UP
    // ========================================================

    /*
     * At this point:
     *
     * - existing bank was checked first
     * - ALOC was used for any JAMB/WAEC/NECO shortage
     *
     * getAIQuestions() will make one final bank check using the
     * exclusions below, then Groq generates only what still does
     * not exist.
     *
     * Because every question already added here is excluded, it
     * cannot return duplicates from the first bank lookup.
     */

    if (
      questions.length <
      COUNT
    ) {
      const missingCount =
        COUNT -
        questions.length

      try {
        const ai =
          await getAIQuestions(
            {
              subject:
                canonical,

              standard:
                standard as
                  ExamStandard,

              studentClass:
                normalizedClass,

              count:
                missingCount,

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
            }
          )

        for (
          const suppliedQuestion of
            Array.isArray(
              ai
            )
              ? ai
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

          if (
            !text
          ) {
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

          const correctAnswer =
            normalizeAnswer(
              suppliedQuestion
                ?.correctAnswer
            )

          if (
            !correctAnswer
          ) {
            continue
          }

          if (
            !hasValidOptions(
              suppliedQuestion
                ?.options
            )
          ) {
            continue
          }

          /*
           * Do not hard-code this to "ai".
           *
           * getAIQuestions() now uses the shared bank and may return
           * a cached ALOC question if a matching unused one exists.
           */
          const source =
            normalizeSource(
              suppliedQuestion
                ?.source
            )

          const prepared:
            PreparedQuestion =
            {
              id:
                normalizeText(
                  suppliedQuestion
                    ?.id
                ) ||
                `${
                  source ===
                  'aloc'
                    ? 'ALOC-BANK'
                    : 'AI'
                }-${crypto
                  .randomBytes(
                    8
                  )
                  .toString(
                    'hex'
                  )}`,

              fingerprint,

              text,

              options: {
                a:
                  normalizeText(
                    suppliedQuestion
                      .options
                      .a
                  ),

                b:
                  normalizeText(
                    suppliedQuestion
                      .options
                      .b
                  ),

                c:
                  normalizeText(
                    suppliedQuestion
                      .options
                      .c
                  ),

                d:
                  normalizeText(
                    suppliedQuestion
                      .options
                      .d
                  ),
              },

              correctAnswer,

              subject:
                canonical,

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
                ) ||
                undefined,

              difficulty:
                normalizeDifficulty(
                  suppliedQuestion
                    ?.difficulty
                ),

              standard:
                normalizeText(
                  suppliedQuestion
                    ?.standard
                ) ||
                standard,

              source,

              explanation:
                normalizeText(
                  suppliedQuestion
                    ?.explanation
                ) ||
                undefined,

              section:
                normalizeText(
                  suppliedQuestion
                    ?.section
                ) ||
                undefined,

              imageUrl:
                normalizeText(
                  suppliedQuestion
                    ?.imageUrl
                ) ||
                undefined,

              providerQuestionId:
                normalizeText(
                  suppliedQuestion
                    ?.providerQuestionId
                ) ||
                undefined,

              year:
                Number.isFinite(
                  Number(
                    suppliedQuestion
                      ?.year
                  )
                )
                  ? Number(
                      suppliedQuestion
                        ?.year
                    )
                  : undefined,

              category:
                normalizeText(
                  suppliedQuestion
                    ?.category
                ) ||
                undefined,

              educationLevel:
                normalizeText(
                  suppliedQuestion
                    ?.educationLevel
                ) ||
                undefined,

              classLevel:
                normalizeText(
                  suppliedQuestion
                    ?.classLevel
                ) ||
                undefined,

              country:
                normalizeText(
                  suppliedQuestion
                    ?.country
                ) ||
                undefined,

              publisher:
                normalizeText(
                  suppliedQuestion
                    ?.publisher
                ) ||
                undefined,

              authorised:
                normalizeText(
                  suppliedQuestion
                    ?.authorised
                ) ||
                undefined,

              curriculumMapping:
                normalizeText(
                  suppliedQuestion
                    ?.curriculumMapping
                ) ||
                undefined,
            }

          questions.push(
            prepared
          )

          if (
            source ===
            'ai'
          ) {
            freshAiLoaded +=
              1
          } else {
            /*
             * This can happen if getAIQuestions() found another
             * eligible ALOC bank entry.
             */
            bankAlocLoaded +=
              1
          }
        }
      } catch (
        aiError
      ) {
        /*
         * If bank or ALOC already supplied some questions, allow
         * a partial exam rather than discarding valid questions.
         */

        console.error(
          'AI exam question fallback failed:',
          aiError
        )
      }
    }

    // ========================================================
    // 10. ENSURE QUESTIONS EXIST
    // ========================================================

    if (
      questions.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            'No exam questions could be prepared at this time. Please try again shortly.',
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
     * Correct answers stay in the server-side session.
     *
     * topic/subtopic/difficulty/source are persisted so that the
     * submit route can copy them into ExamPrepAttempt.breakdown.
     *
     * Therefore analytics works identically for ALOC and AI.
     */

    await ExamPrepSession.create(
      {
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
      }
    )

    // ========================================================
    // 15. SOURCE BREAKDOWN
    // ========================================================

    /*
     * "source" identifies where the question originally came
     * from, not whether it was retrieved from our database.
     *
     * An ALOC question reused from our MongoDB bank therefore
     * remains source = "aloc".
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

          /*
           * Original provider breakdown.
           */
          sourceBreakdown: {
            aloc:
              alocCount,

            ai:
              aiCount,
          },

          /*
           * Infrastructure breakdown.
           */
          preparationBreakdown: {
            bankInitial:
              bankLoaded,

            bankInitialAloc:
              bankAlocLoaded,

            bankInitialAi:
              bankAiLoaded,

            freshAloc:
              freshAlocLoaded,

            freshAi:
              freshAiLoaded,
          },

          questionSource,

          alocApiCalledSuccessfully:
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
     * NEVER return:
     *
     * correctAnswer
     * explanation containing the answer
     *
     * before the student submits.
     */

    return NextResponse.json(
      {
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
         * Means a fresh ALOC request supplied at least one new
         * question during this request.
         *
         * If the entire exam came from cached ALOC questions,
         * this can correctly be false.
         */
        alocWorked,

        sourceBreakdown: {
          aloc:
            alocCount,

          ai:
            aiCount,
        },

        /*
         * Useful for development/UI diagnostics.
         *
         * This reveals no answers.
         */
        preparationBreakdown: {
          fromInitialBank:
            bankLoaded,

          freshAloc:
            freshAlocLoaded,

          freshAi:
            freshAiLoaded,
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
      }
    )
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