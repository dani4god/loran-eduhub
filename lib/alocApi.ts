// lib/alocApi.ts
const ALOC_BASE = 'https://dev.aloc.com.ng/api/v1'

export interface AlocQuestion {
  id: string
  text: string
  options: { a: string; b: string; c: string; d: string }
  correctAnswer: string
  examType: string
  subject: string
  year?: number
  section?: string
  imageUrl?: string
}

async function fetchPage(params: {
  examType: string
  subject: string
  year?: number
  cursor?: string | null
}): Promise<{ questions: AlocQuestion[]; nextCursor: string | null }> {
  const apiKey = process.env.ALOC_API_KEY
  if (!apiKey) throw new Error('ALOC_API_KEY is not configured')

  const url = new URL(`${ALOC_BASE}/questions`)
  url.searchParams.set('subject', params.subject.toLowerCase())
  url.searchParams.set('examType', params.examType)
  if (params.year) url.searchParams.set('year', String(params.year))
  url.searchParams.set('limit', '15') // ALOC's per-request cap
  if (params.cursor) url.searchParams.set('cursor', params.cursor)

  const res = await fetch(url.toString(), { headers: { 'X-API-Key': apiKey } })
  if (!res.ok) throw new Error(`ALOC API error: ${res.status}`)
  const body = await res.json()

  const items = body.data || []
  const questions: AlocQuestion[] = items.map((item: any) => {
    const q = item.question || item
    return {
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: (q.correctAnswer || '').toLowerCase(),
      examType: q.examType,
      subject: q.subject,
      year: q.year,
      section: q.section,
      imageUrl: q.imageUrl,
    }
  })

  return { questions, nextCursor: body.pagination?.hasMore ? body.pagination.nextCursor : null }
}

// ALOC caps each request at 15 questions — two requests (15 + 15) reach the
// full 30-question practice exam you asked for, deduped by question id.
export async function fetchExamQuestions(params: {
  examType: 'jamb' | 'waec' | 'neco'
  subject: string
  year?: number
  count?: number
}): Promise<AlocQuestion[]> {
  const target = params.count || 30
  const collected: AlocQuestion[] = []
  const seenIds = new Set<string>()
  let cursor: string | null = null
  let pages = 0

  while (collected.length < target && pages < 6) {
    pages++
    const { questions, nextCursor } = await fetchPage({
      examType: params.examType, subject: params.subject, year: params.year, cursor,
    })
    for (const q of questions) {
      if (seenIds.has(q.id)) continue
      seenIds.add(q.id)
      collected.push(q)
      if (collected.length >= target) break
    }
    cursor = nextCursor
    if (!cursor) break
  }

  return collected
}

// Adjust this range once you confirm which years ALOC actually has data for.
export const ALOC_AVAILABLE_YEARS = Array.from({ length: 2024 - 2010 + 1 }, (_, i) => 2024 - i)