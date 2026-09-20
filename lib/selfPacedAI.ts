// lib/selfPacedAI.ts

export type SelfPacedAIAction =
  | 'chat'
  | 'explain'
  | 'example'
  | 'summarize'
  | 'quiz'

export interface SelfPacedAIHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GenerateStudyAssistantResponseArgs {
  studentName: string

  courseTitle: string

  weekNumber: number
  weekTitle: string

  pageTitle: string
  pageContent: string

  userMessage: string

  action?: SelfPacedAIAction

  history?: SelfPacedAIHistoryMessage[]
}

const GROQ_ENDPOINT =
  'https://api.groq.com/openai/v1/chat/completions'

const DEFAULT_MODEL =
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-20b'

const REQUEST_TIMEOUT_MS =
  25_000

const MAX_HISTORY_MESSAGES =
  10

const MAX_LESSON_CHARS =
  18_000

const MAX_USER_MESSAGE_CHARS =
  2_500

// ============================================================
// HTML → CLEAN TEXT
// ============================================================

export function htmlToStudyText(
  html: string
) {
  if (!html) {
    return ''
  }

  return html
    // Remove scripts completely.
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      ' '
    )

    // Remove style blocks.
    .replace(
      /<style\b[^>]*>[\s\S]*?<\/style>/gi,
      ' '
    )

    // Preserve rough paragraph boundaries.
    .replace(
      /<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li|pre|blockquote)>/gi,
      '\n'
    )

    .replace(
      /<br\s*\/?>/gi,
      '\n'
    )

    // Strip remaining tags.
    .replace(
      /<[^>]+>/g,
      ' '
    )

    // Common entities.
    .replace(
      /&nbsp;/gi,
      ' '
    )

    .replace(
      /&amp;/gi,
      '&'
    )

    .replace(
      /&lt;/gi,
      '<'
    )

    .replace(
      /&gt;/gi,
      '>'
    )

    .replace(
      /&quot;/gi,
      '"'
    )

    .replace(
      /&#39;/gi,
      "'"
    )

    // Normalize whitespace.
    .replace(
      /\r/g,
      ''
    )

    .replace(
      /[ \t]+/g,
      ' '
    )

    .replace(
      /\n{3,}/g,
      '\n\n'
    )

    .trim()
}

// ============================================================
// ACTION INSTRUCTION
// ============================================================

function getActionInstruction(
  action: SelfPacedAIAction
) {
  switch (action) {
    case 'explain':
      return `
The student selected "Explain simply".

Explain the current lesson concept in simpler language.

Start with the core idea.

Break difficult ideas into small steps.

Use an analogy where useful.

Then provide a short practical example.

Finish with one brief check-for-understanding question.
`

    case 'example':
      return `
The student selected "Give me an example".

Create a new example that teaches the current lesson concept.

Do not merely repeat the example from the lesson.

Explain the example step-by-step.

If this is a programming lesson, include a small relevant code example
only when useful and explain what the important lines do.
`

    case 'summarize':
      return `
The student selected "Summarize this page".

Produce useful revision notes for this lesson page.

Include:
- the main idea
- important concepts
- important terms
- important steps or rules
- a short "Remember this" section

Do not add unrelated material.
`

    case 'quiz':
      return `
The student selected "Quiz me".

Create a short learning quiz from the current lesson only.

Ask 3 questions.

Do NOT reveal the answers immediately.

Tell the student to send their answers and you will mark and explain them.

The questions should test understanding rather than simple memorization.
`

    default:
      return `
Answer the student's question using the lesson context.

If the student's question is ambiguous, interpret it in relation to the
current lesson before asking for clarification.

Teach rather than merely state an answer.
`
  }
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt({
  studentName,
  courseTitle,
  weekNumber,
  weekTitle,
  pageTitle,
  pageContent,
  action,
}: Omit<
  GenerateStudyAssistantResponseArgs,
  'userMessage' | 'history'
>) {
  const lesson =
    pageContent.slice(
      0,
      MAX_LESSON_CHARS
    )

  return `
You are Loran AI, the study assistant inside Loran EduHub.

You are currently helping ${studentName || 'a student'} study a self-paced course.

CURRENT STUDY CONTEXT

Course:
${courseTitle}

Week:
Week ${weekNumber}: ${weekTitle}

Current lesson:
${pageTitle}

CURRENT LESSON MATERIAL
-----------------------
${lesson}
-----------------------

YOUR ROLE

You are a patient, clear, encouraging academic study assistant.

Your primary source for this conversation is the lesson material above.

You should help the student UNDERSTAND the material rather than merely
giving short answers.

IMPORTANT BEHAVIOUR

1. Explain difficult ideas using clear, beginner-friendly language.

2. Break complex ideas into manageable steps.

3. Use examples and analogies when they genuinely help.

4. For programming material:
   - use properly formatted code blocks
   - explain important code
   - distinguish code from explanation
   - do not invent APIs or functions that are not needed

5. For mathematics:
   - show the reasoning and steps
   - format equations clearly using plain readable notation

6. If the lesson material directly supports the answer, stay grounded in it.

7. If the student asks for something related to the concept but the exact
   information is not in the lesson, you may provide helpful general
   educational knowledge, but clearly introduce it as an additional
   explanation rather than pretending it came from the course.

8. If you are uncertain, say so.

9. Do not invent statements and attribute them to the tutor or course.

10. Never claim that you performed an action you cannot perform.

11. Do not overwhelm the student unnecessarily. Start with a clear answer
    and expand where useful.

12. Use headings and bullet points when they improve readability.

13. You may use a small number of appropriate educational emoji, but do not
    overuse them.

ASSESSMENT SAFETY

You are a study assistant, not an exam-answer service.

If the student appears to paste a live assessment question and asks you to
simply provide the answer, guide them through the relevant concept and
reasoning instead of simply giving them the final answer.

You may freely explain examples, lesson exercises and concepts.

CURRENT REQUEST MODE

${getActionInstruction(action || 'chat')}
`
}

// ============================================================
// GENERATE
// ============================================================

export async function generateSelfPacedAIResponse(
  args: GenerateStudyAssistantResponseArgs
) {
  const apiKey =
    process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not configured'
    )
  }

  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      REQUEST_TIMEOUT_MS
    )

  try {
    const history =
      (args.history || [])
        .slice(
          -MAX_HISTORY_MESSAGES
        )
        .filter(
          (
            message
          ) =>
            message.content
              ?.trim()
        )
        .map(
          (
            message
          ) => ({
            role:
              message.role,

            content:
              message.content
                .trim()
                .slice(
                  0,
                  4000
                ),
          })
        )

    const userMessage =
      args.userMessage
        .trim()
        .slice(
          0,
          MAX_USER_MESSAGE_CHARS
        )

    const response =
      await fetch(
        GROQ_ENDPOINT,
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
            JSON.stringify({
              model:
                DEFAULT_MODEL,

              temperature:
                0.45,

              max_completion_tokens:
                1400,

              messages: [
                {
                  role:
                    'system',

                  content:
                    buildSystemPrompt({
                      studentName:
                        args.studentName,

                      courseTitle:
                        args.courseTitle,

                      weekNumber:
                        args.weekNumber,

                      weekTitle:
                        args.weekTitle,

                      pageTitle:
                        args.pageTitle,

                      pageContent:
                        args.pageContent,

                      action:
                        args.action ||
                        'chat',
                    }),
                },

                ...history,

                {
                  role:
                    'user',

                  content:
                    userMessage,
                },
              ],
            }),

          signal:
            controller.signal,
        }
      )

    const data =
      await response
        .json()
        .catch(
          () => null
        )

    if (
      !response.ok
    ) {
      console.error(
        '[SELF PACED AI] Groq error:',
        response.status,
        data
      )

      if (
        response.status ===
        429
      ) {
        throw new Error(
          'The study assistant is busy right now. Please wait a moment and try again.'
        )
      }

      throw new Error(
        data?.error
          ?.message ||
          'The study assistant could not respond.'
      )
    }

    const answer =
      data?.choices?.[0]
        ?.message
        ?.content

    if (
      !answer ||
      typeof answer !==
        'string'
    ) {
      throw new Error(
        'The study assistant returned an empty response.'
      )
    }

    return answer.trim()
  } catch (
    error:
      any
  ) {
    if (
      error?.name ===
      'AbortError'
    ) {
      throw new Error(
        'The study assistant took too long to respond. Please try again.'
      )
    }

    throw error
  } finally {
    clearTimeout(
      timeout
    )
  }
}