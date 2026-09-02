// lib/examAI.ts

import crypto from 'crypto'

import connectDB from '@/lib/mongodb'
import AIQuestionBank from '@/models/AIQuestionBank'

// ============================================================
// GROQ CONFIGURATION
// ============================================================

const GROQ_URL =
  'https://api.groq.com/openai/v1/chat/completions'

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-20b'

const AI_QUESTION_BATCH_SIZE = 3
const CLASSIFICATION_BATCH_SIZE = 8
const MAX_GENERATION_ATTEMPTS = 12
const MAX_AI_REQUEST_RETRIES = 3

// ============================================================
// TYPES
// ============================================================

export type QuestionSource =
  | 'ai'
  | 'aloc'

export type QuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'

export type QuestionOptions = {
  a: string
  b: string
  c: string
  d: string
}

export type AIExamQuestion = {
  id: string

  fingerprint: string

  text: string

  options: QuestionOptions

  correctAnswer:
    | 'a'
    | 'b'
    | 'c'
    | 'd'

  subject: string

  topic: string

  subtopic?: string

  difficulty:
    QuestionDifficulty

  standard: string

  source:
    QuestionSource

  explanation?: string

  section?: string

  imageUrl?: string

  // ==========================================================
  // PROVIDER / ALOC METADATA
  // ==========================================================

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

export type GetAIQuestionsInput = {
  subject: string

  standard: string

  studentClass: string

  count: number

  topic?: string

  excludeFingerprints?: string[]
}

export type GetQuestionBankInput = {
  subject: string

  standard: string

  studentClass?: string

  count: number

  topic?: string

  source?:
    | QuestionSource
    | 'any'

  excludeFingerprints?: string[]

  incrementUsage?: boolean
}

export type QuestionTopicClassification = {
  index: number

  id?: string

  fingerprint?: string

  topic: string

  subtopic: string

  difficulty:
    QuestionDifficulty
}

// ============================================================
// GENERAL HELPERS
// ============================================================

function makeId() {
  return crypto
    .randomBytes(12)
    .toString('hex')
}

function sleep(
  ms: number
) {
  return new Promise<void>(
    (
      resolve
    ) => {
      setTimeout(
        resolve,
        ms
      )
    }
  )
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

function normalizeStandard(
  value: unknown
) {
  const standard =
    normalizeText(
      value
    )
      .toLowerCase()

  if (
    standard === 'jamb' ||
    standard === 'waec' ||
    standard === 'neco' ||
    standard === 'igcse' ||
    standard === 'mixed'
  ) {
    return standard
  }

  return 'mixed'
}

function normalizeStudentClass(
  value: unknown
) {
  const studentClass =
    normalizeText(
      value
    )
      .toLowerCase()

  if (
    studentClass === 'ss1' ||
    studentClass === 'ss2' ||
    studentClass === 'ss3'
  ) {
    return studentClass
  }

  return 'ss3'
}

function normalizeCorrectAnswer(
  value: unknown
):
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | null {
  const answer =
    normalizeText(
      value
    )
      .toLowerCase()

  if (
    answer === 'a' ||
    answer === 'b' ||
    answer === 'c' ||
    answer === 'd'
  ) {
    return answer
  }

  return null
}

function normalizeDifficulty(
  value: unknown
):
  QuestionDifficulty {
  const difficulty =
    normalizeText(
      value
    )
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

function normalizeOptionalYear(
  value: unknown
):
  number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  const year =
    Number(
      value
    )

  if (
    !Number.isInteger(
      year
    ) ||
    year < 1900 ||
    year > 2200
  ) {
    return undefined
  }

  return year
}

function hasUsefulTopic(
  value: unknown
) {
  const topic =
    normalizeText(
      value
    )

  if (!topic) {
    return false
  }

  const normalized =
    topic.toLowerCase()

  return (
    normalized !==
      'general' &&
    normalized !==
      'unknown' &&
    normalized !==
      'uncategorized'
  )
}

function uniqueStrings(
  values:
    | string[]
    | undefined
) {
  return Array.from(
    new Set(
      (
        Array.isArray(
          values
        )
          ? values
          : []
      )
        .map(
          (
            value
          ) =>
            normalizeText(
              value
            )
        )
        .filter(
          Boolean
        )
    )
  )
}

// ============================================================
// QUESTION FINGERPRINT
// ============================================================

/**
 * Public because exam/start and other Exam Prep routes use it.
 */
export function questionFingerprint(
  subject: string,
  text: string
) {
  const normalizedSubject =
    normalizeText(
      subject
    )
      .toLowerCase()

  const normalizedQuestion =
    normalizeText(
      text
    )
      .toLowerCase()

  return crypto
    .createHash(
      'sha256'
    )
    .update(
      `${normalizedSubject}::${normalizedQuestion}`
    )
    .digest(
      'hex'
    )
}

// ============================================================
// JSON CLEANING
// ============================================================

function sanitizeCommonLatexEscapes(
  value: string
) {
  return value
    .replace(
      /\\tfrac/g,
      '\\\\tfrac'
    )
    .replace(
      /\\frac/g,
      '\\\\frac'
    )
    .replace(
      /\\sqrt/g,
      '\\\\sqrt'
    )
    .replace(
      /\\times/g,
      '\\\\times'
    )
    .replace(
      /\\div/g,
      '\\\\div'
    )
    .replace(
      /\\cdot/g,
      '\\\\cdot'
    )
    .replace(
      /\\theta/g,
      '\\\\theta'
    )
    .replace(
      /\\alpha/g,
      '\\\\alpha'
    )
    .replace(
      /\\beta/g,
      '\\\\beta'
    )
    .replace(
      /\\gamma/g,
      '\\\\gamma'
    )
    .replace(
      /\\Delta/g,
      '\\\\Delta'
    )
    .replace(
      /\\pi/g,
      '\\\\pi'
    )
    .replace(
      /\\left/g,
      '\\\\left'
    )
    .replace(
      /\\right/g,
      '\\\\right'
    )
    .replace(
      /\\\(/g,
      '\\\\('
    )
    .replace(
      /\\\)/g,
      '\\\\)'
    )
    .replace(
      /\\\[/g,
      '\\\\['
    )
    .replace(
      /\\\]/g,
      '\\\\]'
    )
}

function extractJSON(
  raw: string
):
  any {
  let text =
    String(
      raw || ''
    )
      .trim()

  if (!text) {
    throw new Error(
      'AI returned empty content.'
    )
  }

  text =
    text
      .replace(
        /^```json\s*/i,
        ''
      )
      .replace(
        /^```\s*/i,
        ''
      )
      .replace(
        /\s*```$/i,
        ''
      )
      .trim()

  try {
    return JSON.parse(
      text
    )
  } catch {
    // Continue.
  }

  const sanitized =
    sanitizeCommonLatexEscapes(
      text
    )

  try {
    return JSON.parse(
      sanitized
    )
  } catch {
    // Continue.
  }

  const objectStart =
    sanitized.indexOf(
      '{'
    )

  const objectEnd =
    sanitized.lastIndexOf(
      '}'
    )

  if (
    objectStart !==
      -1 &&
    objectEnd >
      objectStart
  ) {
    const candidate =
      sanitized.slice(
        objectStart,
        objectEnd + 1
      )

    try {
      return JSON.parse(
        candidate
      )
    } catch {
      // Continue.
    }
  }

  const arrayStart =
    sanitized.indexOf(
      '['
    )

  const arrayEnd =
    sanitized.lastIndexOf(
      ']'
    )

  if (
    arrayStart !==
      -1 &&
    arrayEnd >
      arrayStart
  ) {
    const candidate =
      sanitized.slice(
        arrayStart,
        arrayEnd + 1
      )

    try {
      return JSON.parse(
        candidate
      )
    } catch {
      // Continue.
    }
  }

  throw new Error(
    `AI returned invalid or incomplete JSON: ${text.slice(
      0,
      500
    )}`
  )
}

// ============================================================
// RATE LIMIT HELPERS
// ============================================================

function getRetryDelayFromBody(
  body: string
) {
  const match =
    body.match(
      /try again in\s+([\d.]+)s/i
    )

  if (!match) {
    return null
  }

  const seconds =
    Number(
      match[1]
    )

  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds <= 0
  ) {
    return null
  }

  return (
    Math.ceil(
      seconds *
        1000
    ) +
    1000
  )
}

function getRetryDelayFromHeader(
  value:
    | string
    | null
) {
  if (!value) {
    return null
  }

  const seconds =
    Number(
      value
    )

  if (
    Number.isFinite(
      seconds
    ) &&
    seconds > 0
  ) {
    return (
      Math.ceil(
        seconds *
          1000
      ) +
      1000
    )
  }

  return null
}

// ============================================================
// GROQ JSON REQUEST
// ============================================================

async function aiJSON(
  systemPrompt: string,
  userPrompt: string,
  retryCount = 0
):
  Promise<any> {
  const apiKey =
    process.env
      .GROQ_API_KEY

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not configured.'
    )
  }

  let response:
    Response

  try {
    response =
      await fetch(
        GROQ_URL,
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              {
                model:
                  GROQ_MODEL,

                messages: [
                  {
                    role:
                      'system',

                    content: `
${systemPrompt}

STRICT OUTPUT RULES:

Return ONLY valid JSON.

Do not return Markdown.

Do not wrap JSON in triple backticks.

Do not add commentary before or after the JSON.

Use double quotes for every JSON key and string value.

Do not include comments.

Do not include trailing commas.

IMPORTANT FOR MATHEMATICS AND SCIENCE:

Do not use LaTeX delimiters.

Avoid LaTeX commands such as \\frac, \\tfrac and \\sqrt.

Write mathematical expressions using plain readable text.

Examples:

Instead of:
\\(x^2 + 2x = 3\\)

Write:
x² + 2x = 3

Instead of:
\\frac{1}{2}

Write:
1/2

The entire response must be directly parseable by JSON.parse().
                    `.trim(),
                  },

                  {
                    role:
                      'user',

                    content:
                      userPrompt,
                  },
                ],

                temperature:
                  0.2,
              }
            ),
        }
      )
  } catch (
    error
  ) {
    if (
      retryCount <
      MAX_AI_REQUEST_RETRIES
    ) {
      await sleep(
        1500 *
          (
            retryCount +
            1
          )
      )

      return aiJSON(
        systemPrompt,
        userPrompt,
        retryCount +
          1
      )
    }

    throw error
  }

  // ==========================================================
  // RATE LIMIT
  // ==========================================================

  if (
    response.status ===
    429
  ) {
    const body =
      await response.text()

    if (
      retryCount >=
      MAX_AI_REQUEST_RETRIES
    ) {
      throw new Error(
        `Groq rate limit remained active after ${MAX_AI_REQUEST_RETRIES} retries: ${body}`
      )
    }

    const headerDelay =
      getRetryDelayFromHeader(
        response.headers.get(
          'retry-after'
        )
      )

    const bodyDelay =
      getRetryDelayFromBody(
        body
      )

    const fallbackDelay =
      10000 +
      retryCount *
        5000

    const waitMs =
      headerDelay ||
      bodyDelay ||
      fallbackDelay

    console.warn(
      `Groq rate limit reached. Waiting ${Math.ceil(
        waitMs /
          1000
      )} seconds before retry ${
        retryCount +
        1
      }/${MAX_AI_REQUEST_RETRIES}...`
    )

    await sleep(
      waitMs
    )

    return aiJSON(
      systemPrompt,
      userPrompt,
      retryCount +
        1
    )
  }

  // ==========================================================
  // TEMPORARY SERVER ERRORS
  // ==========================================================

  if (
    response.status ===
      500 ||
    response.status ===
      502 ||
    response.status ===
      503 ||
    response.status ===
      504
  ) {
    const body =
      await response.text()

    if (
      retryCount <
      MAX_AI_REQUEST_RETRIES
    ) {
      const waitMs =
        2000 *
        (
          retryCount +
          1
        )

      console.warn(
        `Groq temporary error ${response.status}. Retrying in ${waitMs}ms.`
      )

      await sleep(
        waitMs
      )

      return aiJSON(
        systemPrompt,
        userPrompt,
        retryCount +
          1
      )
    }

    throw new Error(
      `Groq ${response.status}: ${body}`
    )
  }

  // ==========================================================
  // OTHER ERRORS
  // ==========================================================

  if (
    !response.ok
  ) {
    const body =
      await response.text()

    throw new Error(
      `Groq ${response.status}: ${body}`
    )
  }

  const data =
    await response.json()

  const choice =
    data?.choices?.[0]

  const raw =
    choice
      ?.message
      ?.content

  if (!raw) {
    throw new Error(
      'AI returned no content.'
    )
  }

  const finishReason =
    choice
      ?.finish_reason

  if (
    finishReason &&
    finishReason !==
      'stop'
  ) {
    console.warn(
      'Groq finish reason:',
      finishReason
    )
  }

  return extractJSON(
    raw
  )
}

// ============================================================
// NORMALIZE AI-GENERATED QUESTION
// ============================================================

function normalizeGeneratedQuestion(
  input: any,
  subject: string,
  standard: string
):
  AIExamQuestion |
  null {
  if (
    !input ||
    typeof input !==
      'object'
  ) {
    return null
  }

  const text =
    normalizeText(
      input.text ||
      input.question
    )

  if (!text) {
    return null
  }

  const options =
    input.options

  if (
    !options ||
    typeof options !==
      'object'
  ) {
    return null
  }

  const optionA =
    normalizeText(
      options.a
    )

  const optionB =
    normalizeText(
      options.b
    )

  const optionC =
    normalizeText(
      options.c
    )

  const optionD =
    normalizeText(
      options.d
    )

  if (
    !optionA ||
    !optionB ||
    !optionC ||
    !optionD
  ) {
    return null
  }

  const correctAnswer =
    normalizeCorrectAnswer(
      input.correctAnswer
    )

  if (
    !correctAnswer
  ) {
    return null
  }

  const cleanSubject =
    normalizeText(
      subject
    )

  const cleanStandard =
    normalizeStandard(
      standard
    )

  const fingerprint =
    questionFingerprint(
      cleanSubject,
      text
    )

  return {
    id:
      normalizeText(
        input.id
      ) ||
      makeId(),

    fingerprint,

    text,

    options: {
      a:
        optionA,

      b:
        optionB,

      c:
        optionC,

      d:
        optionD,
    },

    correctAnswer,

    subject:
      cleanSubject,

    topic:
      normalizeText(
        input.topic
      ) ||
      'General',

    subtopic:
      normalizeText(
        input.subtopic
      ) ||
      undefined,

    difficulty:
      normalizeDifficulty(
        input.difficulty
      ),

    standard:
      cleanStandard,

    source:
      'ai',

    explanation:
      normalizeText(
        input.explanation
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
  }
}

// ============================================================
// GENERATE QUESTION BATCH
// ============================================================

async function generateBatch({
  subject,
  standard,
  studentClass,
  count,
  topic,
}: {
  subject: string
  standard: string
  studentClass: string
  count: number
  topic?: string
}) {
  const cleanSubject =
    normalizeText(
      subject
    )

  const cleanStandard =
    normalizeStandard(
      standard
    )

  const cleanClass =
    normalizeStudentClass(
      studentClass
    )

  const safeCount =
    Math.min(
      AI_QUESTION_BATCH_SIZE,
      Math.max(
        1,
        Number(
          count
        ) ||
          1
      )
    )

  const systemPrompt = `
You are Loran EduHub's professional examination question writer.

Create original, high-quality senior secondary school multiple-choice questions.

The questions must be academically accurate.

Every question must have exactly four options:

a
b
c
d

Exactly one option must be correct.

Avoid ambiguous questions.

Avoid trick wording unless academically appropriate.

Avoid duplicated questions.

Use difficulty suitable for ${cleanClass.toUpperCase()} students.

If the examination standard is "mixed", create questions comparable in style and difficulty to a balanced mixture of:

WAEC
NECO
JAMB
IGCSE

Do not copy copyrighted past examination questions word-for-word.

Generate original questions that test the same curriculum skills.

Use plain-text mathematical notation instead of LaTeX.
  `.trim()

  const topicInstruction =
    topic
      ? `Focus specifically on the topic "${normalizeText(
          topic
        )}".`
      : `Use a reasonable spread of important ${cleanSubject} topics.`

  const userPrompt = `
Generate exactly ${safeCount} multiple-choice questions.

Subject:
${cleanSubject}

Class:
${cleanClass.toUpperCase()}

Exam standard:
${cleanStandard}

${topicInstruction}

Return exactly this JSON structure:

{
  "questions": [
    {
      "text": "Question text",
      "options": {
        "a": "Option A",
        "b": "Option B",
        "c": "Option C",
        "d": "Option D"
      },
      "correctAnswer": "a",
      "topic": "Topic name",
      "subtopic": "Subtopic name",
      "difficulty": "medium",
      "explanation": "Short explanation"
    }
  ]
}

Rules:

Return exactly ${safeCount} questions.

correctAnswer must be one of:

"a"
"b"
"c"
"d"

difficulty must be one of:

"easy"
"medium"
"hard"

Every question must contain all four options.

Do not put question numbers inside question text.

Keep explanations concise.

Do not use Markdown.

Do not use LaTeX.

Do not use backslash-based mathematics.

Return only JSON.
  `.trim()

  const result =
    await aiJSON(
      systemPrompt,
      userPrompt
    )

  const rawQuestions =
    Array.isArray(
      result
        ?.questions
    )
      ? result.questions
      : Array.isArray(
          result
        )
        ? result
        : []

  const normalized:
    AIExamQuestion[] =
    []

  for (
    const item of
      rawQuestions
  ) {
    const question =
      normalizeGeneratedQuestion(
        item,
        cleanSubject,
        cleanStandard
      )

    if (
      question
    ) {
      normalized.push(
        question
      )
    }
  }

  return normalized
}

// ============================================================
// TOPIC CLASSIFICATION
// ============================================================

/**
 * Supports:
 *
 * classifyQuestionTopics(subject, questions)
 *
 * and:
 *
 * classifyQuestionTopics(questions, subject)
 *
 * The classifier only sends questions that actually need
 * classification to Groq. Existing useful topic metadata is
 * preserved.
 */
export async function classifyQuestionTopics(
  first:
    | string
    | any[],
  second:
    | string
    | any[],
  ..._rest: any[]
):
  Promise<any[]> {
  const subject =
    typeof first ===
      'string'
      ? normalizeText(
          first
        )
      : normalizeText(
          second
        )

  const questions =
    Array.isArray(
      first
    )
      ? first
      : Array.isArray(
          second
        )
        ? second
        : []

  if (
    !questions.length
  ) {
    return []
  }

  // ==========================================================
  // BUILD INITIAL RESULT
  // ==========================================================

  const result =
    questions.map(
      (
        original:
          any,
        index:
          number
      ) => {
        const text =
          normalizeText(
            typeof original ===
              'string'
              ? original
              : original
                  ?.text ||
                original
                  ?.question
          )

        const fingerprint =
          typeof original ===
            'object' &&
          original
            ?.fingerprint
            ? normalizeText(
                original
                  .fingerprint
              )
            : questionFingerprint(
                subject,
                text
              )

        const originalTopic =
          typeof original ===
            'object'
            ? normalizeText(
                original
                  ?.topic
              )
            : ''

        const originalSubtopic =
          typeof original ===
            'object'
            ? normalizeText(
                original
                  ?.subtopic
              )
            : ''

        const originalDifficulty =
          typeof original ===
            'object'
            ? normalizeDifficulty(
                original
                  ?.difficulty
              )
            : 'medium'

        if (
          typeof original ===
          'string'
        ) {
          return {
            index,

            fingerprint,

            text,

            topic:
              'General',

            subtopic:
              '',

            difficulty:
              'medium',
          }
        }

        return {
          ...original,

          index,

          fingerprint,

          topic:
            originalTopic ||
            'General',

          subtopic:
            originalSubtopic,

          difficulty:
            originalDifficulty,
        }
      }
    )

  // ==========================================================
  // FIND QUESTIONS THAT ACTUALLY NEED AI CLASSIFICATION
  // ==========================================================

  const unresolved =
    result.filter(
      (
        question
      ) =>
        !hasUsefulTopic(
          question.topic
        )
    )

  if (
    unresolved.length ===
    0
  ) {
    return result
  }

  // ==========================================================
  // CLASSIFY IN SMALL BATCHES
  // ==========================================================

  for (
    let offset = 0;
    offset <
    unresolved.length;
    offset +=
      CLASSIFICATION_BATCH_SIZE
  ) {
    const batch =
      unresolved.slice(
        offset,
        offset +
          CLASSIFICATION_BATCH_SIZE
      )

    const compact =
      batch.map(
        (
          question
        ) => ({
          index:
            question.index,

          id:
            normalizeText(
              question.id
            ),

          fingerprint:
            question
              .fingerprint,

          text:
            normalizeText(
              question.text ||
              question.question
            )
              .slice(
                0,
                1500
              ),

          // Additional metadata may help classification.
          category:
            normalizeText(
              question.category
            ),

          section:
            normalizeText(
              question.section
            )
              .slice(
                0,
                800
              ),

          curriculumMapping:
            normalizeText(
              question
                .curriculumMapping
            ),
        })
      )

    try {
      const classificationResult =
        await aiJSON(
          `
You are Loran EduHub's educational assessment classifier.

Classify examination questions into accurate curriculum topics and subtopics.

Subject:
${subject}

The topic should identify the academic concept being tested.

Do NOT treat organizational labels such as:

passage-a
passage-b
section-a
section-b

as academic topics.

For English Language, use topics such as:

Comprehension
Grammar
Vocabulary
Lexis and Structure
Oral English
Sentence Structure
Concord
Figures of Speech
Registers

For Mathematics, examples include:

Algebra
Geometry
Trigonometry
Statistics
Probability
Mensuration
Calculus
Number and Numeration

For Physics, examples include:

Mechanics
Waves
Electricity
Magnetism
Optics
Heat
Measurements
Modern Physics

For Chemistry, examples include:

Atomic Structure
Chemical Bonding
Stoichiometry
Organic Chemistry
Acids and Bases
Electrochemistry
Periodic Chemistry

For Biology, examples include:

Cell Biology
Ecology
Genetics
Nutrition
Reproduction
Evolution
Human Physiology

Use academically appropriate curriculum categories for other subjects.

Do not solve or rewrite the questions.

Return JSON only.
          `.trim(),

          `
Classify these ${subject} examination questions:

${JSON.stringify(
  compact
)}

Return exactly this structure:

{
  "classifications": [
    {
      "index": 0,
      "fingerprint": "same fingerprint supplied",
      "topic": "Academic topic",
      "subtopic": "Specific subtopic",
      "difficulty": "medium"
    }
  ]
}

Rules:

Return one classification for every supplied question.

Use the original index.

Keep the supplied fingerprint unchanged.

Do not repeat the full question.

topic must be a real academic topic.

difficulty must be exactly:

"easy"
"medium"
"hard"

Return JSON only.
          `.trim()
        )

      const classifications =
        Array.isArray(
          classificationResult
            ?.classifications
        )
          ? classificationResult
              .classifications
          : Array.isArray(
              classificationResult
            )
            ? classificationResult
            : []

      for (
        const question of
          batch
      ) {
        const classification =
          classifications.find(
            (
              item:
                any
            ) =>
              Number(
                item
                  ?.index
              ) ===
                Number(
                  question
                    .index
                ) ||
              (
                item
                  ?.fingerprint &&
                normalizeText(
                  item
                    .fingerprint
                ) ===
                  normalizeText(
                    question
                      .fingerprint
                  )
              )
          )

        if (
          !classification
        ) {
          continue
        }

        const topic =
          normalizeText(
            classification
              ?.topic
          )

        if (
          hasUsefulTopic(
            topic
          )
        ) {
          question.topic =
            topic
        }

        question.subtopic =
          normalizeText(
            classification
              ?.subtopic
          ) ||
          question
            .subtopic ||
          ''

        question.difficulty =
          normalizeDifficulty(
            classification
              ?.difficulty ||
            question
              .difficulty
          )
      }
    } catch (
      error
    ) {
      /*
       * Classification is enrichment.
       *
       * It must never stop the exam itself.
       */

      console.error(
        'Question topic classification batch failed:',
        error
      )
    }

    if (
      offset +
        CLASSIFICATION_BATCH_SIZE <
      unresolved.length
    ) {
      await sleep(
        500
      )
    }
  }

  return result.map(
    (
      question
    ) => ({
      ...question,

      topic:
        normalizeText(
          question.topic
        ) ||
        'General',

      subtopic:
        normalizeText(
          question
            .subtopic
        ),

      difficulty:
        normalizeDifficulty(
          question
            .difficulty
        ),
    })
  )
}

// ============================================================
// QUESTION BANK NORMALIZATION
// ============================================================

function bankRecordToQuestion(
  record: any,
  fallbackSubject: string,
  fallbackStandard: string
):
  AIExamQuestion |
  null {
  const text =
    normalizeText(
      record
        ?.question ||
      record
        ?.text
    )

  if (!text) {
    return null
  }

  const options =
    record
      ?.options

  if (
    !options
  ) {
    return null
  }

  const optionA =
    normalizeText(
      options.a
    )

  const optionB =
    normalizeText(
      options.b
    )

  const optionC =
    normalizeText(
      options.c
    )

  const optionD =
    normalizeText(
      options.d
    )

  if (
    !optionA ||
    !optionB ||
    !optionC ||
    !optionD
  ) {
    return null
  }

  const correctAnswer =
    normalizeCorrectAnswer(
      record
        ?.correctAnswer
    )

  if (
    !correctAnswer
  ) {
    return null
  }

  const subject =
    normalizeText(
      record
        ?.subject
    ) ||
    normalizeText(
      fallbackSubject
    )

  const standard =
    normalizeStandard(
      record
        ?.standard ||
      fallbackStandard
    )

  const fingerprint =
    normalizeText(
      record
        ?.fingerprint
    ) ||
    questionFingerprint(
      subject,
      text
    )

  const source =
    normalizeSource(
      record
        ?.source
    )

  return {
    id:
      makeId(),

    fingerprint,

    text,

    options: {
      a:
        optionA,

      b:
        optionB,

      c:
        optionC,

      d:
        optionD,
    },

    correctAnswer,

    subject,

    topic:
      normalizeText(
        record
          ?.topic
      ) ||
      'General',

    subtopic:
      normalizeText(
        record
          ?.subtopic
      ) ||
      undefined,

    difficulty:
      normalizeDifficulty(
        record
          ?.difficulty
      ),

    standard,

    /*
     * IMPORTANT:
     *
     * Do not hard-code this to "ai".
     *
     * ALOC questions stored in the bank must remain ALOC
     * questions when reused.
     */
    source,

    explanation:
      normalizeText(
        record
          ?.explanation
      ) ||
      undefined,

    section:
      normalizeText(
        record
          ?.section
      ) ||
      undefined,

    imageUrl:
      normalizeText(
        record
          ?.imageUrl
      ) ||
      undefined,

    providerQuestionId:
      normalizeText(
        record
          ?.providerQuestionId
      ) ||
      undefined,

    year:
      normalizeOptionalYear(
        record
          ?.year
      ),

    category:
      normalizeText(
        record
          ?.category
      ) ||
      undefined,

    educationLevel:
      normalizeText(
        record
          ?.educationLevel
      ) ||
      undefined,

    classLevel:
      normalizeText(
        record
          ?.classLevel
      ) ||
      undefined,

    country:
      normalizeText(
        record
          ?.country
      ) ||
      undefined,

    publisher:
      normalizeText(
        record
          ?.publisher
      ) ||
      undefined,

    authorised:
      normalizeText(
        record
          ?.authorised
      ) ||
      undefined,

    curriculumMapping:
      normalizeText(
        record
          ?.curriculumMapping
      ) ||
      undefined,
  }
}

// ============================================================
// MARK BANK QUESTIONS AS USED
// ============================================================

async function incrementQuestionUsage(
  fingerprints: string[]
) {
  const clean =
    uniqueStrings(
      fingerprints
    )

  if (
    !clean.length
  ) {
    return
  }

  try {
    await connectDB()

    await AIQuestionBank
      .updateMany(
        {
          fingerprint: {
            $in:
              clean,
          },
        },
        {
          $inc: {
            usageCount:
              1,
          },

          $set: {
            lastUsedAt:
              new Date(),
          },
        }
      )
  } catch (
    error
  ) {
    /*
     * Usage tracking must never prevent an exam.
     */

    console.error(
      'Question bank usage update failed:',
      error
    )
  }
}

// ============================================================
// PUBLIC: GET QUESTIONS FROM SHARED QUESTION BANK
// ============================================================

/**
 * Shared bank lookup.
 *
 * This may return:
 *
 * source = "aloc"
 * source = "ai"
 *
 * depending on what is available.
 *
 * start/route.ts can use this BEFORE calling ALOC.
 */
export async function getQuestionBankQuestions({
  subject,
  standard,
  count,
  topic,
  source = 'any',
  excludeFingerprints = [],
  incrementUsage = true,
}: GetQuestionBankInput):
  Promise<AIExamQuestion[]> {
  await connectDB()

  const cleanSubject =
    normalizeText(
      subject
    )

  if (
    !cleanSubject
  ) {
    return []
  }

  const cleanStandard =
    normalizeStandard(
      standard
    )

  const requestedCount =
    Math.min(
      50,
      Math.max(
        1,
        Number(
          count
        ) ||
          1
      )
    )

  const excluded =
    uniqueStrings(
      excludeFingerprints
    )

  const query:
    Record<
      string,
      any
    > = {
    subject:
      cleanSubject,
  }

  /*
   * Mixed examinations can draw from every standard.
   */
  if (
    cleanStandard !==
    'mixed'
  ) {
    query.standard =
      cleanStandard
  }

  if (
    source === 'ai' ||
    source === 'aloc'
  ) {
    query.source =
      source
  }

  if (
    topic &&
    normalizeText(
      topic
    )
  ) {
    const escapedTopic =
      normalizeText(
        topic
      )
        .replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )

    query.topic = {
      $regex:
        `^${escapedTopic}$`,

      $options:
        'i',
    }
  }

  if (
    excluded.length >
    0
  ) {
    query.fingerprint = {
      $nin:
        excluded,
    }
  }

  /*
   * Prefer least-used questions so students do not constantly
   * receive the same bank questions.
   */
  const records =
    await AIQuestionBank
      .find(
        query
      )
      .sort({
        usageCount:
          1,

        lastUsedAt:
          1,

        createdAt:
          -1,
      })
      .limit(
        requestedCount
      )
      .lean()

  const questions:
    AIExamQuestion[] =
    []

  for (
    const record of
      records as any[]
  ) {
    const question =
      bankRecordToQuestion(
        record,
        cleanSubject,
        cleanStandard
      )

    if (
      !question
    ) {
      continue
    }

    questions.push(
      question
    )
  }

  if (
    incrementUsage &&
    questions.length >
      0
  ) {
    /*
     * Do not block exam creation for usage tracking.
     */
    void incrementQuestionUsage(
      questions.map(
        (
          question
        ) =>
          question
            .fingerprint
      )
    )
  }

  return questions
}

// ============================================================
// PUBLIC: SAVE AI OR ALOC QUESTIONS TO BANK
// ============================================================

/**
 * Stores both AI and ALOC questions.
 *
 * Questions are deduplicated by fingerprint.
 *
 * Existing questions are enriched/updated when we encounter
 * better metadata later.
 *
 * IMPORTANT:
 *
 * A MongoDB update field must not appear in both $set and
 * $setOnInsert in the same operation. Therefore:
 *
 * $setOnInsert:
 *   fingerprint
 *   usageCount
 *
 * $set:
 *   all question/content/metadata fields
 */
export async function saveQuestionsToBank(
  questions:
    AIExamQuestion[] |
    any[]
) {
  // ==========================================================
  // 1. BASIC VALIDATION
  // ==========================================================

  if (
    !Array.isArray(
      questions
    ) ||
    questions.length === 0
  ) {
    return
  }

  await connectDB()

  const operations:
    any[] = []

  // ==========================================================
  // 2. NORMALIZE QUESTIONS
  // ==========================================================

  for (
    const raw of
      questions
  ) {
    const subject =
      normalizeText(
        raw?.subject
      )

    const standard =
      normalizeStandard(
        raw?.standard
      )

    const text =
      normalizeText(
        raw?.text ||
        raw?.question
      )

    const options =
      raw?.options

    const correctAnswer =
      normalizeCorrectAnswer(
        raw?.correctAnswer
      )

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (
      !subject ||
      !text ||
      !options ||
      !correctAnswer
    ) {
      continue
    }

    const optionA =
      normalizeText(
        options?.a
      )

    const optionB =
      normalizeText(
        options?.b
      )

    const optionC =
      normalizeText(
        options?.c
      )

    const optionD =
      normalizeText(
        options?.d
      )

    if (
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD
    ) {
      continue
    }

    // ========================================================
    // 3. QUESTION IDENTITY
    // ========================================================

    const fingerprint =
      normalizeText(
        raw?.fingerprint
      ) ||
      questionFingerprint(
        subject,
        text
      )

    if (
      !fingerprint
    ) {
      continue
    }

    const source =
      normalizeSource(
        raw?.source
      )

    // ========================================================
    // 4. CLASSIFICATION
    // ========================================================

    const topic =
      normalizeText(
        raw?.topic
      ) ||
      'General'

    const subtopic =
      normalizeText(
        raw?.subtopic
      )

    const difficulty =
      normalizeDifficulty(
        raw?.difficulty
      )

    // ========================================================
    // 5. OPTIONAL METADATA
    // ========================================================

    const providerQuestionId =
      normalizeText(
        raw?.providerQuestionId
      )

    const explanation =
      normalizeText(
        raw?.explanation
      )

    const section =
      normalizeText(
        raw?.section
      )

    const imageUrl =
      normalizeText(
        raw?.imageUrl
      )

    const category =
      normalizeText(
        raw?.category
      )

    const educationLevel =
      normalizeText(
        raw?.educationLevel
      )

    const classLevel =
      normalizeText(
        raw?.classLevel
      )

    const country =
      normalizeText(
        raw?.country
      )

    const publisher =
      normalizeText(
        raw?.publisher
      )

    const authorised =
      normalizeText(
        raw?.authorised
      )

    const curriculumMapping =
      normalizeText(
        raw?.curriculumMapping
      )

    const year =
      normalizeOptionalYear(
        raw?.year
      )

    // ========================================================
    // 6. $SET DATA
    // ========================================================

    /*
     * These fields are written using $set.
     *
     * $set also runs when MongoDB performs an upsert, so there
     * is no reason to repeat these same fields under
     * $setOnInsert.
     *
     * Existing bank records can also gain improved metadata.
     */

    const setData:
      Record<
        string,
        any
      > = {
      subject,

      standard,

      source,

      topic,

      subtopic,

      difficulty,

      question:
        text,

      options: {
        a:
          optionA,

        b:
          optionB,

        c:
          optionC,

        d:
          optionD,
      },

      correctAnswer,

      explanation,

      providerQuestionId,

      section,

      imageUrl,

      category,

      educationLevel,

      classLevel,

      country,

      publisher,

      authorised,

      curriculumMapping,
    }

    /*
     * Don't write undefined into MongoDB.
     *
     * AI-generated questions normally have no exam year.
     */
    if (
      year !== undefined
    ) {
      setData.year =
        year
    }

    // ========================================================
    // 7. UPSERT
    // ========================================================

    operations.push({
      updateOne: {
        filter: {
          fingerprint,
        },

        update: {
          /*
           * ONLY insert-only properties belong here.
           *
           * Do not repeat topic, subject, standard, etc.
           */
          $setOnInsert: {
            fingerprint,

            usageCount:
              0,
          },

          /*
           * These fields work for both:
           *
           * - new documents
           * - existing documents
           */
          $set:
            setData,
        },

        upsert:
          true,
      },
    })
  }

  // ==========================================================
  // 8. NOTHING VALID TO SAVE
  // ==========================================================

  if (
    operations.length === 0
  ) {
    return
  }

  // ==========================================================
  // 9. BULK SAVE
  // ==========================================================

  try {
    const result =
      await AIQuestionBank
        .bulkWrite(
          operations,
          {
            ordered:
              false,
          }
        )

    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      console.log(
        '[QUESTION BANK] Save complete:',
        {
          requested:
            questions.length,

          operations:
            operations.length,

          inserted:
            result
              .upsertedCount,

          matched:
            result
              .matchedCount,

          modified:
            result
              .modifiedCount,
        }
      )
    }
  } catch (
    error:
      any
  ) {
    /*
     * Duplicate-key races are harmless.
     *
     * Example:
     *
     * Student A and Student B both receive the same newly
     * generated question at almost the same time.
     *
     * Both attempt to upsert the fingerprint.
     */

    if (
      error?.code ===
      11000
    ) {
      if (
        process.env.NODE_ENV !==
        'production'
      ) {
        console.warn(
          '[QUESTION BANK] Duplicate fingerprint race ignored.'
        )
      }

      return
    }

    console.error(
      'Question bank save failed:',
      error
    )
  }
}
// ============================================================
// PUBLIC GET AI QUESTIONS
// ============================================================

/**
 * This function now means:
 *
 * 1. Reuse compatible shared-bank questions first.
 * 2. Generate with Groq only for the shortage.
 * 3. Save newly generated AI questions back into the bank.
 *
 * Shared-bank questions may originally be ALOC questions.
 */
export async function getAIQuestions({
  subject,
  standard,
  studentClass,
  count,
  topic,
  excludeFingerprints = [],
}: GetAIQuestionsInput):
  Promise<
    AIExamQuestion[]
  > {
  const cleanSubject =
    normalizeText(
      subject
    )

  if (
    !cleanSubject
  ) {
    throw new Error(
      'AI question generation requires a subject.'
    )
  }

  const cleanStandard =
    normalizeStandard(
      standard
    )

  const cleanClass =
    normalizeStudentClass(
      studentClass
    )

  const requestedCount =
    Math.min(
      50,
      Math.max(
        1,
        Number(
          count
        ) ||
          1
      )
    )

  const excluded =
    new Set<string>(
      uniqueStrings(
        excludeFingerprints
      )
    )

  const result:
    AIExamQuestion[] =
    []

  // ==========================================================
  // 1. REUSE SHARED QUESTION BANK FIRST
  // ==========================================================

  try {
    const bankQuestions =
      await getQuestionBankQuestions(
        {
          subject:
            cleanSubject,

          standard:
            cleanStandard,

          studentClass:
            cleanClass,

          count:
            requestedCount,

          topic:
            topic
              ? normalizeText(
                  topic
                )
              : undefined,

          source:
            'any',

          excludeFingerprints:
            Array.from(
              excluded
            ),

          incrementUsage:
            true,
        }
      )

    for (
      const question of
        bankQuestions
    ) {
      if (
        result.length >=
        requestedCount
      ) {
        break
      }

      if (
        excluded.has(
          question
            .fingerprint
        )
      ) {
        continue
      }

      excluded.add(
        question
          .fingerprint
      )

      result.push(
        question
      )
    }
  } catch (
    error
  ) {
    console.error(
      'Question bank fetch failed:',
      error
    )
  }

  // ==========================================================
  // 2. GENERATE ONLY WHAT IS STILL MISSING
  // ==========================================================

  let attempts =
    0

  while (
    result.length <
      requestedCount &&
    attempts <
      MAX_GENERATION_ATTEMPTS
  ) {
    attempts +=
      1

    const remaining =
      requestedCount -
      result.length

    const batchSize =
      Math.min(
        AI_QUESTION_BATCH_SIZE,
        remaining
      )

    let generated:
      AIExamQuestion[] =
      []

    try {
      generated =
        await generateBatch(
          {
            subject:
              cleanSubject,

            standard:
              cleanStandard,

            studentClass:
              cleanClass,

            count:
              batchSize,

            topic:
              topic
                ? normalizeText(
                    topic
                  )
                : undefined,
          }
        )
    } catch (
      error
    ) {
      console.error(
        `AI batch ${attempts} failed:`,
        error
      )

      await sleep(
        1000
      )

      continue
    }

    if (
      generated.length ===
      0
    ) {
      await sleep(
        750
      )

      continue
    }

    const accepted:
      AIExamQuestion[] =
      []

    for (
      const question of
        generated
    ) {
      if (
        result.length >=
        requestedCount
      ) {
        break
      }

      if (
        excluded.has(
          question
            .fingerprint
        )
      ) {
        continue
      }

      excluded.add(
        question
          .fingerprint
      )

      result.push(
        question
      )

      accepted.push(
        question
      )
    }

    if (
      accepted.length >
      0
    ) {
      try {
        await saveQuestionsToBank(
          accepted
        )
      } catch (
        error
      ) {
        /*
         * Cache failure should not invalidate good questions.
         */

        console.error(
          'Could not cache generated questions:',
          error
        )
      }
    }

    if (
      result.length <
      requestedCount
    ) {
      await sleep(
        750
      )
    }
  }

  // ==========================================================
  // 3. FINAL RESULT
  // ==========================================================

  if (
    result.length ===
    0
  ) {
    throw new Error(
      `AI could not generate valid ${cleanSubject} questions.`
    )
  }

  if (
    result.length <
    requestedCount
  ) {
    console.warn(
      `Requested ${requestedCount} ${cleanSubject} questions but prepared ${result.length}.`
    )
  }

  return result.slice(
    0,
    requestedCount
  )
}

// ============================================================
// PERFORMANCE COACH
// ============================================================

export type PerformanceCoachResult = {
  summary: string

  readiness: {
    level:
      | 'low'
      | 'developing'
      | 'moderate'
      | 'strong'
      | 'excellent'

    message: string
  }

  strengths:
    string[]

  weaknesses:
    Array<{
      area: string

      reason: string

      priority:
        | 'high'
        | 'medium'
        | 'low'
    }>

  recommendations:
    string[]

  studyPlan:
    Array<{
      focus: string

      action: string
    }>

  examStrategy:
    string[]

  encouragement:
    string
}

// ============================================================
// PERFORMANCE COACH FALLBACK
// ============================================================

function buildPerformanceCoachFallback(
  stats: any
):
  PerformanceCoachResult {
  const readinessNumber =
    Number(
      stats?.readiness ||
      0
    )

  let readinessLevel:
    PerformanceCoachResult[
      'readiness'
    ][
      'level'
    ] =
    'low'

  if (
    readinessNumber >=
    85
  ) {
    readinessLevel =
      'excellent'
  } else if (
    readinessNumber >=
    70
  ) {
    readinessLevel =
      'strong'
  } else if (
    readinessNumber >=
    55
  ) {
    readinessLevel =
      'moderate'
  } else if (
    readinessNumber >=
    35
  ) {
    readinessLevel =
      'developing'
  }

  const weakestTopics =
    Array.isArray(
      stats
        ?.weakestTopics
    )
      ? stats.weakestTopics
      : []

  const strongestTopics =
    Array.isArray(
      stats
        ?.strongestTopics
    )
      ? stats.strongestTopics
      : []

  return {
    summary:
      `You have completed ${Number(
        stats
          ?.totalAttempts ||
        0
      )} exam attempt(s) with an overall average of ${Number(
        stats
          ?.overallAverage ||
        0
      )}%.`,

    readiness: {
      level:
        readinessLevel,

      message:
        `Your current readiness score is ${readinessNumber}%. Continue practising and focus on the weakest areas identified by your exam history.`,
    },

    strengths:
      strongestTopics
        .slice(
          0,
          5
        )
        .map(
          (
            item:
              any
          ) =>
            `${normalizeText(
              item
                ?.subject
            )}: ${normalizeText(
              item
                ?.topic
            )}`
        )
        .filter(
          (
            item:
              string
          ) =>
            !item.endsWith(
              ': '
            )
        ),

    weaknesses:
      weakestTopics
        .slice(
          0,
          6
        )
        .map(
          (
            item:
              any
          ) => ({
            area:
              [
                normalizeText(
                  item
                    ?.subject
                ),
                normalizeText(
                  item
                    ?.topic
                ),
              ]
                .filter(
                  Boolean
                )
                .join(
                  ' - '
                ) ||
              'General performance',

            reason:
              `Your recorded accuracy in this area is ${Number(
                item
                  ?.percentage ||
                0
              )}% from ${Number(
                item
                  ?.attempted ||
                0
              )} question(s).`,

            priority:
              Number(
                item
                  ?.percentage ||
                0
              ) <
              40
                ? 'high' as const
                : Number(
                    item
                      ?.percentage ||
                    0
                  ) <
                  60
                  ? 'medium' as const
                  : 'low' as const,
          })
        ),

    recommendations: [
      'Review every incorrect answer after each practice exam.',
      'Spend more revision time on your weakest topics.',
      'Use targeted weakness practice before taking another full exam.',
      'Practise under timed conditions regularly.',
    ],

    studyPlan:
      weakestTopics
        .slice(
          0,
          5
        )
        .map(
          (
            item:
              any
          ) => ({
            focus:
              [
                normalizeText(
                  item
                    ?.subject
                ),
                normalizeText(
                  item
                    ?.topic
                ),
              ]
                .filter(
                  Boolean
                )
                .join(
                  ' - '
                ),

            action:
              'Review the topic, study worked examples, then complete a targeted set of practice questions.',
          })
        )
        .filter(
          (
            item:
              any
          ) =>
            item
              .focus
        ),

    examStrategy: [
      'Answer easier questions first and return to difficult ones later.',
      'Avoid spending too much time on one question.',
      'Review unanswered questions before submitting.',
      'Read each question carefully before selecting an option.',
    ],

    encouragement:
      'Use each practice attempt as feedback. Consistent targeted practice should steadily improve your readiness.',
  }
}

// ============================================================
// GENERATE PERFORMANCE COACH
// ============================================================

export async function generatePerformanceCoach(
  stats: any
):
  Promise<
    PerformanceCoachResult
  > {
  if (
    !stats ||
    !Number(
      stats
        .totalAttempts
    )
  ) {
    return {
      summary:
        'Complete more practice exams so Loran AI can provide a detailed performance analysis.',

      readiness: {
        level:
          'low',

        message:
          'There is not enough exam history yet to estimate your readiness reliably.',
      },

      strengths:
        [],

      weaknesses:
        [],

      recommendations: [
        'Complete at least three practice exams across your main subjects.',
      ],

      studyPlan: [
        {
          focus:
            'Build baseline performance',

          action:
            'Take a full practice exam and review every incorrect answer.',
        },
      ],

      examStrategy: [
        'Answer easier questions first and return to difficult questions later.',
      ],

      encouragement:
        'Consistent practice will give the system enough data to build a stronger study plan for you.',
    }
  }

  // ==========================================================
  // COMPACT ANALYTICS
  // ==========================================================

  const compactStats = {
    totalAttempts:
      stats
        .totalAttempts,

    overallAverage:
      stats
        .overallAverage,

    accuracy:
      stats
        .accuracy,

    readiness:
      stats
        .readiness,

    trend:
      stats
        .trend,

    averageDurationSeconds:
      stats
        .averageDurationSeconds,

    unansweredRate:
      stats
        .unansweredRate,

    weakestSubjects:
      Array.isArray(
        stats
          .weakestSubjects
      )
        ? stats
            .weakestSubjects
            .slice(
              0,
              5
            )
        : [],

    strongestSubjects:
      Array.isArray(
        stats
          .strongestSubjects
      )
        ? stats
            .strongestSubjects
            .slice(
              0,
              5
            )
        : [],

    weakestTopics:
      Array.isArray(
        stats
          .weakestTopics
      )
        ? stats
            .weakestTopics
            .slice(
              0,
              8
            )
        : [],

    strongestTopics:
      Array.isArray(
        stats
          .strongestTopics
      )
        ? stats
            .strongestTopics
            .slice(
              0,
              8
            )
        : [],

    subjectAverages:
      stats
        .subjectAverages,

    subjectPerformance:
      stats
        .subjectPerformance,

    topicPerformance:
      stats
        .topicPerformance,

    difficultyPerformance:
      stats
        .difficultyPerformance,
  }

  let result:
    any

  try {
    result =
      await aiJSON(
        `
You are Loran EduHub's AI examination performance coach.

Interpret already-calculated student examination analytics.

Do not recalculate exam scores.

Do not invent attempts, subjects, topics, percentages, strengths or weaknesses that are not supported by the supplied analytics.

The student may be preparing for:

WAEC
NECO
JAMB
IGCSE

Analyse:

academic weaknesses
academic strengths
time management
answer accuracy
difficulty performance
study priorities
exam readiness
improvement trends

Recommendations must be specific and actionable.

Be encouraging but realistic.

Return JSON only.
        `.trim(),

        `
Analyse this student's Exam Prep performance:

${JSON.stringify(
  compactStats
)}

Return exactly this JSON structure:

{
  "summary": "Short overall analysis",
  "readiness": {
    "level": "moderate",
    "message": "Explanation of current exam readiness"
  },
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "weaknesses": [
    {
      "area": "Weak area",
      "reason": "Reason based on supplied analytics",
      "priority": "high"
    }
  ],
  "recommendations": [
    "Recommendation 1"
  ],
  "studyPlan": [
    {
      "focus": "Topic or skill",
      "action": "Specific study action"
    }
  ],
  "examStrategy": [
    "Strategy"
  ],
  "encouragement": "Short personalised encouragement"
}

Rules:

readiness.level must be exactly one of:

"low"
"developing"
"moderate"
"strong"
"excellent"

weakness priority must be exactly one of:

"high"
"medium"
"low"

Return no more than 5 strengths.

Return no more than 6 weaknesses.

Return no more than 8 recommendations.

Return no more than 7 study-plan items.

Return no more than 6 exam strategies.

Do not use Markdown.

Return only JSON.
        `.trim()
      )
  } catch (
    error
  ) {
    /*
     * Analytics should still work even when Groq is unavailable.
     */

    console.error(
      'AI performance coach failed:',
      error
    )

    return buildPerformanceCoachFallback(
      stats
    )
  }

  // ==========================================================
  // NORMALIZE RESPONSE
  // ==========================================================

  const allowedReadiness =
    new Set([
      'low',
      'developing',
      'moderate',
      'strong',
      'excellent',
    ])

  const rawReadiness =
    normalizeText(
      result
        ?.readiness
        ?.level
    )
      .toLowerCase()

  const readinessLevel =
    allowedReadiness.has(
      rawReadiness
    )
      ? rawReadiness
      : 'moderate'

  const strengths =
    Array.isArray(
      result
        ?.strengths
    )
      ? result
          .strengths
          .map(
            (
              item:
                unknown
            ) =>
              normalizeText(
                item
              )
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            5
          )
      : []

  const weaknesses =
    Array.isArray(
      result
        ?.weaknesses
    )
      ? result
          .weaknesses
          .map(
            (
              item:
                any
            ) => {
              const area =
                normalizeText(
                  item
                    ?.area
                )

              if (
                !area
              ) {
                return null
              }

              const rawPriority =
                normalizeText(
                  item
                    ?.priority
                )
                  .toLowerCase()

              const priority:
                | 'high'
                | 'medium'
                | 'low' =
                rawPriority ===
                  'high' ||
                rawPriority ===
                  'low'
                  ? rawPriority
                  : 'medium'

              return {
                area,

                reason:
                  normalizeText(
                    item
                      ?.reason
                  ) ||
                  'This area needs additional practice.',

                priority,
              }
            }
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            6
          )
      : []

  const recommendations =
    Array.isArray(
      result
        ?.recommendations
    )
      ? result
          .recommendations
          .map(
            (
              item:
                unknown
            ) =>
              normalizeText(
                item
              )
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            8
          )
      : []

  const studyPlan =
    Array.isArray(
      result
        ?.studyPlan
    )
      ? result
          .studyPlan
          .map(
            (
              item:
                any
            ) => {
              const focus =
                normalizeText(
                  item
                    ?.focus
                )

              const action =
                normalizeText(
                  item
                    ?.action
                )

              if (
                !focus ||
                !action
              ) {
                return null
              }

              return {
                focus,

                action,
              }
            }
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            7
          )
      : []

  const examStrategy =
    Array.isArray(
      result
        ?.examStrategy
    )
      ? result
          .examStrategy
          .map(
            (
              item:
                unknown
            ) =>
              normalizeText(
                item
              )
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            6
          )
      : []

  return {
    summary:
      normalizeText(
        result
          ?.summary
      ) ||
      'Your performance data has been analysed.',

    readiness: {
      level:
        readinessLevel as
          PerformanceCoachResult[
            'readiness'
          ][
            'level'
          ],

      message:
        normalizeText(
          result
            ?.readiness
            ?.message
        ) ||
        'Continue practising to improve your exam readiness.',
    },

    strengths,

    weaknesses:
      weaknesses as
        PerformanceCoachResult[
          'weaknesses'
        ],

    recommendations,

    studyPlan:
      studyPlan as
        PerformanceCoachResult[
          'studyPlan'
        ],

    examStrategy,

    encouragement:
      normalizeText(
        result
          ?.encouragement
      ) ||
      'Keep practising consistently and focus on your weakest areas.',
  }
}

// ============================================================
// AI TOPIC TUTOR
// ============================================================

export type TopicTutorLessonResult = {
  title: string

  introduction: string

  explanation: string

  keyPoints: string[]

  examples: Array<{
    title: string
    explanation: string
  }>

  commonMistakes: string[]

  examTips: string[]

  practiceQuestions: Array<{
    question: string

    options?: {
      a?: string
      b?: string
      c?: string
      d?: string
    }

    correctAnswer?: string

    explanation: string
  }>

  summary: string

  nextSteps: string[]
}

export type GenerateTopicTutorLessonInput = {
  subject: string

  topic: string

  subtopic?: string

  studentClass?: string

  standard?:
    | 'jamb'
    | 'waec'
    | 'neco'
    | 'igcse'
    | 'mixed'

  question?: string

  performance?: any
}

export async function generateTopicTutorLesson({
  subject,
  topic,
  subtopic,
  studentClass,
  standard = 'mixed',
  question,
  performance,
}: GenerateTopicTutorLessonInput): Promise<TopicTutorLessonResult> {
  const cleanSubject =
    normalizeText(
      subject
    )

  const cleanTopic =
    normalizeText(
      topic
    )

  const cleanSubtopic =
    normalizeText(
      subtopic
    )

  const cleanClass =
    normalizeText(
      studentClass
    ) ||
    'Senior Secondary'

  const cleanStandard =
    normalizeStandard(
      standard
    )

  const cleanQuestion =
    normalizeText(
      question
    )

  if (
    !cleanSubject
  ) {
    throw new Error(
      'Subject is required for AI tutoring.'
    )
  }

  if (
    !cleanTopic &&
    !cleanQuestion
  ) {
    throw new Error(
      'A topic or question is required for AI tutoring.'
    )
  }

  // ==========================================================
  // COMPACT PERFORMANCE DATA
  // ==========================================================

  let compactPerformance:
    any = null

  if (
    performance &&
    typeof performance ===
      'object'
  ) {
    compactPerformance = {
      accuracy:
        performance
          ?.accuracy,

      percentage:
        performance
          ?.percentage,

      attempts:
        performance
          ?.attempts,

      correct:
        performance
          ?.correct,

      incorrect:
        performance
          ?.incorrect,

      unanswered:
        performance
          ?.unanswered,

      averageScore:
        performance
          ?.averageScore,

      weakness:
        performance
          ?.weakness,

      strength:
        performance
          ?.strength,

      weakestTopics:
        Array.isArray(
          performance
            ?.weakestTopics
        )
          ? performance
              .weakestTopics
              .slice(
                0,
                5
              )
          : undefined,

      strongestTopics:
        Array.isArray(
          performance
            ?.strongestTopics
        )
          ? performance
              .strongestTopics
              .slice(
                0,
                5
              )
          : undefined,
    }
  }

  // ==========================================================
  // BUILD PERFORMANCE CONTEXT
  // ==========================================================

  const performanceContext =
    compactPerformance
      ? `
STUDENT PERFORMANCE CONTEXT:

${JSON.stringify(
  compactPerformance,
  null,
  2
)}

Use this information only to personalize the lesson.

Do not invent performance information that is not present.

If the student appears weak in this topic:
- explain more slowly
- emphasize fundamentals
- include easier examples first
- highlight common mistakes
- recommend targeted practice

If the student appears strong:
- keep the explanation concise
- include more challenging examples
- focus on examination strategy and mastery
        `.trim()
      : `
No reliable performance information was supplied.

Teach the topic normally and do not invent any performance history.
        `.trim()

  // ==========================================================
  // CALL AI
  // ==========================================================

  const result =
    await aiJSON(
      `
You are Loran EduHub's AI Tutor for senior secondary school students.

You teach students preparing for Nigerian and international secondary-school examinations.

Relevant examination standards include:

WAEC
NECO
JAMB
IGCSE

Your responsibility is to TEACH the student, not merely provide an answer.

Use clear explanations appropriate for the student's level.

Teaching rules:

- explain concepts step by step
- define important academic terms
- use simple language before introducing more advanced wording
- show worked examples where appropriate
- identify common examination mistakes
- provide useful examination tips
- connect explanations to the requested topic and subtopic
- personalize the lesson using supplied performance data
- never invent student performance
- avoid unnecessarily advanced university-level explanations
- do not invent formulas, facts or examination rules
- do not claim generated questions are official past questions

For Mathematics, Physics, Chemistry, Accounting and other calculation-based subjects:

- state formulas clearly where appropriate
- show important calculation steps
- explain why each step is taken
- use plain-text mathematical notation

For English, Literature, Government, History, Biology and other descriptive subjects:

- explain definitions clearly
- compare related concepts where useful
- include examples
- emphasize key examination points

If a student supplied a specific question:

- answer that question clearly
- explain why the answer is correct
- teach the wider topic around it

If a subtopic is supplied:

- focus strongly on that subtopic
- still explain the broader topic where necessary for understanding

Generate exactly 3 short practice questions.

Practice questions should help check whether the student understood the lesson.

They may be objective questions with options a, b, c and d.

Do not claim that generated questions came directly from WAEC, NECO, JAMB or IGCSE.

You may say that generated questions are at a comparable examination standard.

Return JSON only.

Use exactly this structure:

{
  "title": "string",
  "introduction": "string",
  "explanation": "string",
  "keyPoints": [
    "string"
  ],
  "examples": [
    {
      "title": "string",
      "explanation": "string"
    }
  ],
  "commonMistakes": [
    "string"
  ],
  "examTips": [
    "string"
  ],
  "practiceQuestions": [
    {
      "question": "string",
      "options": {
        "a": "string",
        "b": "string",
        "c": "string",
        "d": "string"
      },
      "correctAnswer": "a",
      "explanation": "string"
    }
  ],
  "summary": "string",
  "nextSteps": [
    "string"
  ]
}
      `.trim(),

      `
SUBJECT:
${cleanSubject}

TOPIC:
${cleanTopic || 'Determine the topic from the student question'}

SUBTOPIC:
${cleanSubtopic || 'Not specified'}

STUDENT CLASS:
${cleanClass}

EXAM STANDARD:
${cleanStandard}

STUDENT QUESTION:
${cleanQuestion || 'No specific question was supplied.'}

${performanceContext}

Create a useful, accurate and personalized lesson.

If the exam standard is "mixed", use a balanced senior-secondary level suitable for WAEC, NECO, JAMB and IGCSE preparation.

Do not present generated practice questions as copyrighted official past questions.
      `.trim()
    )

  // ==========================================================
  // NORMALIZATION HELPERS
  // ==========================================================

  function normalizeStringArray(
    value: unknown
  ): string[] {
    if (
      !Array.isArray(
        value
      )
    ) {
      return []
    }

    return value
      .map(
        (
          item
        ) =>
          normalizeText(
            item
          )
      )
      .filter(
        Boolean
      )
  }

  // ==========================================================
  // EXAMPLES
  // ==========================================================

  const rawExamples =
    Array.isArray(
      result
        ?.examples
    )
      ? result.examples
      : []

  const examples =
    rawExamples
      .map(
        (
          example:
            any
        ) => ({
          title:
            normalizeText(
              example
                ?.title
            ) ||
            'Example',

          explanation:
            normalizeText(
              example
                ?.explanation
            ),
        })
      )
      .filter(
        (
          example:
            {
              title: string
              explanation: string
            }
        ) =>
          Boolean(
            example
              .explanation
          )
      )

  // ==========================================================
  // PRACTICE QUESTIONS
  // ==========================================================

  const rawPracticeQuestions =
    Array.isArray(
      result
        ?.practiceQuestions
    )
      ? result
          .practiceQuestions
      : []

  const practiceQuestions =
    rawPracticeQuestions
      .map(
        (
          item:
            any
        ) => {
          const questionText =
            normalizeText(
              item
                ?.question ||
              item
                ?.text
            )

          const rawOptions =
            item
              ?.options &&
            typeof item.options ===
              'object'
              ? item.options
              : null

          const optionA =
            rawOptions
              ? normalizeText(
                  rawOptions.a
                )
              : ''

          const optionB =
            rawOptions
              ? normalizeText(
                  rawOptions.b
                )
              : ''

          const optionC =
            rawOptions
              ? normalizeText(
                  rawOptions.c
                )
              : ''

          const optionD =
            rawOptions
              ? normalizeText(
                  rawOptions.d
                )
              : ''

          const hasOptions =
            Boolean(
              optionA ||
              optionB ||
              optionC ||
              optionD
            )

          const correctAnswer =
            normalizeCorrectAnswer(
              item
                ?.correctAnswer
            )

          return {
            question:
              questionText,

            options:
              hasOptions
                ? {
                    a:
                      optionA ||
                      undefined,

                    b:
                      optionB ||
                      undefined,

                    c:
                      optionC ||
                      undefined,

                    d:
                      optionD ||
                      undefined,
                  }
                : undefined,

            correctAnswer:
              correctAnswer ||
              undefined,

            explanation:
              normalizeText(
                item
                  ?.explanation
              ),
          }
        }
      )
      .filter(
        (
          item: {
            question: string
            options?: {
              a?: string
              b?: string
              c?: string
              d?: string
            }
            correctAnswer?: string
            explanation: string
          }
        ) =>
          Boolean(
            item.question
          )
      )

  // ==========================================================
  // FINAL LESSON
  // ==========================================================

  const lesson:
    TopicTutorLessonResult =
    {
      title:
        normalizeText(
          result
            ?.title
        ) ||
        `${cleanSubject}: ${
          cleanSubtopic ||
          cleanTopic ||
          'AI Tutor'
        }`,

      introduction:
        normalizeText(
          result
            ?.introduction
        ),

      explanation:
        normalizeText(
          result
            ?.explanation
        ),

      keyPoints:
        normalizeStringArray(
          result
            ?.keyPoints
        ),

      examples,

      commonMistakes:
        normalizeStringArray(
          result
            ?.commonMistakes
        ),

      examTips:
        normalizeStringArray(
          result
            ?.examTips
        ),

      practiceQuestions,

      summary:
        normalizeText(
          result
            ?.summary
        ),

      nextSteps:
        normalizeStringArray(
          result
            ?.nextSteps
        ),
    }

  return lesson
}
