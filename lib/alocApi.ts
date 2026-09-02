// lib/alocApi.ts

const ALOC_BASE_URL =
  'https://dev.aloc.com.ng/api/v1'

const ALOC_PAGE_LIMIT = 15

type FetchExamQuestionsInput = {
  examType:
    | 'jamb'
    | 'waec'
    | 'neco'

  subject: string

  count?: number

  year?: number
}

export type AlocQuestion = {
  id: string

  text: string

  options: {
    a: string
    b: string
    c: string
    d: string
  }

  correctAnswer: string

  examType?: string
  subject?: string
  year?: number

  educationLevel?: string
  classLevel?: string

  section?: string
  imageUrl?: string

  questionNumber?: number
  hasPassage?: boolean

  category?: string

  country?: string
  publisher?: string
  authorised?: string
  source?: string

  provenance?: {
    contentSource?: string
    licenseType?: string
    isLicensed?: boolean
    validationScore?: number
    generatorVersion?: string
    reviewStatus?: string
    curriculumMapping?: string
  }

  institution?: string
  state?: string

  contentSource?: string
  licenseType?: string
  isLicensed?: boolean
  validationScore?: number
  generatorVersion?: string
  reviewStatus?: string
  curriculumMapping?: string

  topic?: string
  subtopic?: string
  difficulty?: string
  explanation?: string
}

type AlocQuestionsResponse = {
  data?: any[]

  pagination?: {
    nextCursor?: string | null
    prevCursor?: string | null
    hasMore?: boolean
  }

  meta?: {
    creditsUsed?: number
    creditsRemaining?: number
    tier?: string
    requestId?: string
  }

  message?: string
  error?: string
}

// ============================================================
// HELPERS
// ============================================================

function normalizeText(
  value: unknown
) {
  return String(
    value ?? ''
  ).trim()
}

function normalizeNumber(
  value: unknown
) {
  const number =
    Number(value)

  return Number.isFinite(number)
    ? number
    : undefined
}

function normalizeBoolean(
  value: unknown
) {
  if (
    typeof value === 'boolean'
  ) {
    return value
  }

  if (
    value === 'true' ||
    value === 1 ||
    value === '1'
  ) {
    return true
  }

  if (
    value === 'false' ||
    value === 0 ||
    value === '0'
  ) {
    return false
  }

  return undefined
}

// ============================================================
// SUBJECT MAPPING
// ============================================================

function mapSubjectToAloc(
  subject: string
) {
  const normalized =
    normalizeText(subject)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\s+/g, ' ')
      .trim()

  const subjects:
    Record<string, string> = {
      // ======================================================
      // MATHEMATICS
      // ======================================================

      mathematics:
        'mathematics',

      maths:
        'mathematics',

      math:
        'mathematics',

      'general mathematics':
        'mathematics',

      'general mathematics / mathematics':
        'mathematics',

      'general mathematics/mathematics':
        'mathematics',

      // ======================================================
      // ENGLISH
      // ======================================================

      english:
        'english',

      'english language':
        'english',

      // ======================================================
      // SCIENCES
      // ======================================================

      biology:
        'biology',

      chemistry:
        'chemistry',

      physics:
        'physics',

      agriculture:
        'agriculture',

      'agricultural science':
        'agriculture',

      // ======================================================
      // COMMERCIAL
      // ======================================================

      economics:
        'economics',

      commerce:
        'commerce',

      accounting:
        'accounting',

      'financial accounting':
        'accounting',

      'book keeping':
        'accounting',

      bookkeeping:
        'accounting',

      // ======================================================
      // ARTS / HUMANITIES
      // ======================================================

      government:
        'government',

      geography:
        'geography',

      history:
        'history',

      literature:
        'literature',

      'literature-in-english':
        'literature',

      'literature in english':
        'literature',

      'english literature':
        'literature',

      // ======================================================
      // RELIGIOUS STUDIES
      // ======================================================

      crk:
        'crk',

      crs:
        'crk',

      'christian religious studies':
        'crk',

      'christian religious knowledge':
        'crk',

      irk:
        'irk',

      irs:
        'irk',

      'islamic studies':
        'irk',

      'islamic religious studies':
        'irk',
    }

  return (
    subjects[normalized] ||
    normalized
  )
}

// ============================================================
// CORRECT ANSWER
// ============================================================

function normalizeCorrectAnswer(
  value: unknown
) {
  const answer =
    normalizeText(value)
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

// ============================================================
// OPTIONS
// ============================================================

function normalizeOptions(
  value: any
): AlocQuestion['options'] | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const a =
    normalizeText(
      value.a ??
      value.A
    )

  const b =
    normalizeText(
      value.b ??
      value.B
    )

  const c =
    normalizeText(
      value.c ??
      value.C
    )

  const d =
    normalizeText(
      value.d ??
      value.D
    )

  if (
    !a ||
    !b ||
    !c ||
    !d
  ) {
    return null
  }

  return {
    a,
    b,
    c,
    d,
  }
}

// ============================================================
// NORMALIZE PROVENANCE
// ============================================================

function normalizeProvenance(
  input: any
): AlocQuestion['provenance'] | undefined {
  if (
    !input ||
    typeof input !== 'object'
  ) {
    return undefined
  }

  return {
    contentSource:
      normalizeText(
        input.contentSource
      ) ||
      undefined,

    licenseType:
      normalizeText(
        input.licenseType
      ) ||
      undefined,

    isLicensed:
      normalizeBoolean(
        input.isLicensed
      ),

    validationScore:
      normalizeNumber(
        input.validationScore
      ),

    generatorVersion:
      normalizeText(
        input.generatorVersion
      ) ||
      undefined,

    reviewStatus:
      normalizeText(
        input.reviewStatus
      ) ||
      undefined,

    curriculumMapping:
      normalizeText(
        input.curriculumMapping
      ) ||
      undefined,
  }
}

// ============================================================
// NORMALIZE QUESTION
// ============================================================

function normalizeAlocQuestion(
  input: any
): AlocQuestion | null {
  if (
    !input ||
    typeof input !== 'object'
  ) {
    return null
  }

  const text =
    normalizeText(
      input.text ??
      input.question ??
      input.questionText ??
      input.questionHtml
    )

  if (!text) {
    return null
  }

  const options =
    normalizeOptions(
      input.options
    )

  if (!options) {
    return null
  }

  const correctAnswer =
    normalizeCorrectAnswer(
      input.correctAnswer ??
      input.answer ??
      input.correct_option ??
      input.correctOption
    )

  if (!correctAnswer) {
    return null
  }

  const rawId =
    normalizeText(
      input.id ??
      input._id ??
      input.questionId
    )

  /*
   * ALOC should normally provide an ID.
   * If not, use a deterministic-ish fallback rather than
   * discarding an otherwise valid question.
   */
  const id =
    rawId ||
    `aloc-${Buffer.from(text)
      .toString('base64url')
      .slice(0, 32)}`

  return {
    id,

    text,

    options,

    correctAnswer,

    examType:
      normalizeText(
        input.examType
      ) ||
      undefined,

    subject:
      normalizeText(
        input.subject
      ) ||
      undefined,

    year:
      normalizeNumber(
        input.year
      ),

    educationLevel:
      normalizeText(
        input.educationLevel
      ) ||
      undefined,

    classLevel:
      normalizeText(
        input.classLevel
      ) ||
      undefined,

    section:
      normalizeText(
        input.section
      ) ||
      undefined,

    imageUrl:
      normalizeText(
        input.imageUrl
      ) ||
      undefined,

    questionNumber:
      normalizeNumber(
        input.questionNumber
      ),

    hasPassage:
      normalizeBoolean(
        input.hasPassage
      ),

    category:
      normalizeText(
        input.category
      ) ||
      undefined,

    country:
      normalizeText(
        input.country
      ) ||
      undefined,

    publisher:
      normalizeText(
        input.publisher
      ) ||
      undefined,

    authorised:
      normalizeText(
        input.authorised
      ) ||
      undefined,

    source:
      normalizeText(
        input.source
      ) ||
      undefined,

    provenance:
      normalizeProvenance(
        input.provenance
      ),

    institution:
      normalizeText(
        input.institution
      ) ||
      undefined,

    state:
      normalizeText(
        input.state
      ) ||
      undefined,

    contentSource:
      normalizeText(
        input.contentSource
      ) ||
      undefined,

    licenseType:
      normalizeText(
        input.licenseType
      ) ||
      undefined,

    isLicensed:
      normalizeBoolean(
        input.isLicensed
      ),

    validationScore:
      normalizeNumber(
        input.validationScore
      ),

    generatorVersion:
      normalizeText(
        input.generatorVersion
      ) ||
      undefined,

    reviewStatus:
      normalizeText(
        input.reviewStatus
      ) ||
      undefined,

    curriculumMapping:
      normalizeText(
        input.curriculumMapping
      ) ||
      undefined,

    /*
     * ALOC may not provide these.
     * Your AI classification layer can fill them later.
     */
    topic:
      normalizeText(
        input.topic ??
        input.metadata?.topic
      ) ||
      undefined,

    subtopic:
      normalizeText(
        input.subtopic ??
        input.metadata?.subtopic
      ) ||
      undefined,

    difficulty:
      normalizeText(
        input.difficulty ??
        input.difficultyLevel ??
        input.metadata?.difficulty
      ) ||
      undefined,

    explanation:
      normalizeText(
        input.explanation
      ) ||
      undefined,
  }
}

// ============================================================
// BUILD ERROR DETAIL
// ============================================================

function getErrorDetail(
  data: any,
  rawBody: string,
  statusText: string
) {
  if (
    typeof data === 'string' &&
    data.trim()
  ) {
    return data.trim()
  }

  if (
    data &&
    typeof data === 'object'
  ) {
    const error =
      normalizeText(
        data.error
      )

    const message =
      normalizeText(
        data.message
      )

    if (
      error &&
      message
    ) {
      return `${error}: ${message}`
    }

    if (error) {
      return error
    }

    if (message) {
      return message
    }

    try {
      const json =
        JSON.stringify(data)

      if (
        json &&
        json !== '{}'
      ) {
        return json
      }
    } catch {
      // Ignore stringify failure.
    }
  }

  if (
    rawBody.trim()
  ) {
    return rawBody.trim()
  }

  return (
    statusText ||
    'Request failed'
  )
}

// ============================================================
// FETCH ONE PAGE
// ============================================================

async function fetchAlocPage({
  apiKey,
  examType,
  subject,
  year,
  limit,
  cursor,
}: {
  apiKey: string

  examType: string

  subject: string

  year?: number

  limit: number

  cursor?: string | null
}): Promise<AlocQuestionsResponse> {
  const url =
    new URL(
      `${ALOC_BASE_URL}/questions`
    )

  url.searchParams.set(
    'subject',
    subject
  )

  url.searchParams.set(
    'examType',
    examType
  )

  url.searchParams.set(
    'limit',
    String(limit)
  )

  if (
    year !== undefined
  ) {
    url.searchParams.set(
      'year',
      String(year)
    )
  }

  if (cursor) {
    url.searchParams.set(
      'cursor',
      cursor
    )
  }

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    console.log(
      '[ALOC] Request:',
      {
        subject,
        examType,
        year:
          year ??
          null,

        limit,

        hasCursor:
          Boolean(cursor),

        url:
          url.toString(),
      }
    )
  }

  const response =
    await fetch(
      url.toString(),
      {
        method:
          'GET',

        headers: {
          'X-API-Key':
            apiKey,

          Accept:
            'application/json',
        },

        cache:
          'no-store',
      }
    )

  const rawBody =
    await response.text()

  let data: any =
    null

  if (
    rawBody.trim()
  ) {
    try {
      data =
        JSON.parse(
          rawBody
        )
    } catch {
      data =
        rawBody
    }
  }

  if (
    !response.ok
  ) {
    const detail =
      getErrorDetail(
        data,
        rawBody,
        response.statusText
      )

    console.error(
      '[ALOC] Request failed:',
      {
        status:
          response.status,

        statusText:
          response.statusText,

        subject,

        examType,

        year:
          year ??
          null,

        limit,

        hasCursor:
          Boolean(cursor),

        url:
          url.toString(),

        response:
          data,
      }
    )

    throw new Error(
      `ALOC ${response.status}: ${detail}`
    )
  }

  if (
    !data ||
    typeof data !== 'object'
  ) {
    throw new Error(
      'ALOC returned an invalid response.'
    )
  }

  return data as AlocQuestionsResponse
}

// ============================================================
// FETCH QUESTIONS
// ============================================================

export async function fetchExamQuestions({
  examType,
  subject,
  count = 30,
  year,
}: FetchExamQuestionsInput): Promise<
  AlocQuestion[]
> {
  const apiKey =
    normalizeText(
      process.env.ALOC_API_KEY ||
      process.env.ALOC_ACCESS_TOKEN
    )

  if (!apiKey) {
    throw new Error(
      'ALOC_API_KEY is not configured.'
    )
  }

  // ==========================================================
  // VALIDATE EXAM TYPE
  // ==========================================================

  const cleanExamType =
    normalizeText(
      examType
    )
      .toLowerCase()

  if (
    cleanExamType !== 'jamb' &&
    cleanExamType !== 'waec' &&
    cleanExamType !== 'neco'
  ) {
    throw new Error(
      `Unsupported ALOC exam type: ${cleanExamType}`
    )
  }

  // ==========================================================
  // NORMALIZE SUBJECT
  // ==========================================================

  const alocSubject =
    mapSubjectToAloc(
      subject
    )

  if (!alocSubject) {
    throw new Error(
      'ALOC subject is required.'
    )
  }

  // ==========================================================
  // REQUESTED COUNT
  // ==========================================================

  const requestedCount =
    Math.min(
      50,
      Math.max(
        1,
        Number(count) || 30
      )
    )

  // ==========================================================
  // YEAR
  // ==========================================================

  let cleanYear:
    number | undefined =
    undefined

  if (
    year !== undefined &&
    year !== null
  ) {
    const numericYear =
      Number(year)

    if (
      Number.isInteger(
        numericYear
      ) &&
      numericYear >= 1980 &&
      numericYear <=
        new Date().getFullYear()
    ) {
      cleanYear =
        numericYear
    }
  }

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const collected:
    AlocQuestion[] = []

  /*
   * Prevent duplicates across pages.
   */
  const seenIds =
    new Set<string>()

  const seenTexts =
    new Set<string>()

  let cursor:
    string | null =
    null

  let hasMore =
    true

  let page =
    0

  /*
   * Safety valve.
   *
   * 50 questions with a page size of 15 requires at most
   * four pages. Six allows some margin without accidentally
   * entering an endless pagination loop.
   */
  const MAX_PAGES = 6

  while (
    collected.length <
      requestedCount &&
    hasMore &&
    page < MAX_PAGES
  ) {
    page += 1

    const remaining =
      requestedCount -
      collected.length

    const pageLimit =
      Math.min(
        ALOC_PAGE_LIMIT,
        remaining
      )

    const response =
      await fetchAlocPage({
        apiKey,

        examType:
          cleanExamType,

        subject:
          alocSubject,

        year:
          cleanYear,

        limit:
          pageLimit,

        cursor,
      })

    const items =
      Array.isArray(
        response.data
      )
        ? response.data
        : []

    let acceptedOnPage =
      0

    for (
      const item of items
    ) {
      const question =
        normalizeAlocQuestion(
          item
        )

      if (!question) {
        continue
      }

      const idKey =
        normalizeText(
          question.id
        )

      const textKey =
        normalizeText(
          question.text
        )
          .toLowerCase()
          .replace(
            /\s+/g,
            ' '
          )

      /*
       * Prefer ID deduplication, but also check text because
       * some providers can expose the same question using
       * different IDs.
       */
      if (
        (
          idKey &&
          seenIds.has(
            idKey
          )
        ) ||
        seenTexts.has(
          textKey
        )
      ) {
        continue
      }

      if (idKey) {
        seenIds.add(
          idKey
        )
      }

      seenTexts.add(
        textKey
      )

      collected.push(
        question
      )

      acceptedOnPage +=
        1

      if (
        collected.length >=
        requestedCount
      ) {
        break
      }
    }

    const nextCursor =
      normalizeText(
        response.pagination
          ?.nextCursor
      ) ||
      null

    const apiHasMore =
      response.pagination
        ?.hasMore === true

    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      console.log(
        '[ALOC] Page result:',
        {
          page,

          requested:
            pageLimit,

          returned:
            items.length,

          accepted:
            acceptedOnPage,

          totalCollected:
            collected.length,

          hasMore:
            apiHasMore,

          hasNextCursor:
            Boolean(
              nextCursor
            ),

          creditsUsed:
            response.meta
              ?.creditsUsed,

          creditsRemaining:
            response.meta
              ?.creditsRemaining,

          tier:
            response.meta
              ?.tier,

          requestId:
            response.meta
              ?.requestId,
        }
      )
    }

    /*
     * We are already done.
     */
    if (
      collected.length >=
      requestedCount
    ) {
      break
    }

    /*
     * No records returned means there is no point repeatedly
     * requesting another page.
     */
    if (
      items.length === 0
    ) {
      break
    }

    /*
     * The API must say there are more results AND provide a
     * cursor before we continue.
     */
    if (
      !apiHasMore ||
      !nextCursor
    ) {
      hasMore =
        false

      break
    }

    /*
     * Protect against an API accidentally returning the same
     * cursor repeatedly.
     */
    if (
      cursor &&
      cursor === nextCursor
    ) {
      console.warn(
        '[ALOC] Pagination stopped because the API returned the same cursor twice.'
      )

      break
    }

    cursor =
      nextCursor
  }

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    console.log(
      '[ALOC] Complete:',
      {
        subject:
          alocSubject,

        examType:
          cleanExamType,

        year:
          cleanYear ??
          null,

        requested:
          requestedCount,

        returned:
          collected.length,

        pages:
          page,
      }
    )
  }

  return collected.slice(
    0,
    requestedCount
  )
}