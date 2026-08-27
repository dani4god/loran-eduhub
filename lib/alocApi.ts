// lib/alocApi.ts
const ALOC_BASE = process.env.ALOC_API_URL || 'https://dev.aloc.com.ng/api/v1'

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

export async function fetchExamQuestions(params: {
  examType: 'jamb' | 'waec' | 'neco'
  subject: string
  count?: number
  year?: number
}): Promise<AlocQuestion[]> {
  const apiKey = process.env.ALOC_API_KEY
  if (!apiKey) {
    throw new Error('ALOC_API_KEY is not configured')
  }

  // API max is 15 - request exactly 15
  const count = 15

  try {
    const url = new URL(`${ALOC_BASE}/questions`)
    url.searchParams.set('subject', params.subject.toLowerCase())
    url.searchParams.set('examType', params.examType)
    url.searchParams.set('limit', '15')
    if (params.year) url.searchParams.set('year', String(params.year))

    console.log(`[ALOC API] Fetching 15 questions for ${params.examType} - ${params.subject}...`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(url.toString(), {
      headers: { 
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`ALOC API error (${res.status}): ${errorText}`)
    }

    const body = await res.json()
    
    // Log the response structure for debugging
    console.log(`[ALOC API] Response keys:`, Object.keys(body))
    console.log(`[ALOC API] Has data:`, !!body.data, `data length:`, body.data?.length || 0)
    console.log(`[ALOC API] Credits remaining:`, body.meta?.creditsRemaining || 'unknown')

    // The API returns data in body.data
    const items = body.data || body.questions || body.results || []
    
    if (!Array.isArray(items) || items.length === 0) {
      console.error('[ALOC API] No items found in response:', JSON.stringify(body).substring(0, 500))
      throw new Error(`No questions available for ${params.subject} (${params.examType})`)
    }

    const collected: AlocQuestion[] = []
    const seenIds = new Set<string>()

    for (const item of items) {
      // The question might be nested or directly in the item
      const q = item.question || item
      
      if (!q.id || seenIds.has(q.id)) continue
      seenIds.add(q.id)

      // Handle options - they come as { A: "text", B: "text", ... } or { a: "text", b: "text" }
      let options = q.options
      if (options) {
        // Convert to lowercase keys
        const normalizedOptions: Record<string, string> = {}
        const keys = ['a', 'b', 'c', 'd']
        for (const key of keys) {
          normalizedOptions[key] = options[key.toLowerCase()] || options[key.toUpperCase()] || `Option ${key.toUpperCase()}`
        }
        options = normalizedOptions
      } else {
        // Fallback options
        options = { a: 'Option A', b: 'Option B', c: 'Option C', d: 'Option D' }
      }

      // Ensure all options exist
      if (!options.a) options.a = 'Option A'
      if (!options.b) options.b = 'Option B'
      if (!options.c) options.c = 'Option C'
      if (!options.d) options.d = 'Option D'

      // Get correct answer - could be "A", "a", "A)" etc.
      let correctAnswer = (q.correctAnswer || '').toString().toLowerCase().trim()
      // Extract first letter if it's something like "A)" or "A."
      const match = correctAnswer.match(/^([a-d])/)
      const validAnswer = match ? match[1] : 'a'

      collected.push({
        id: q.id,
        text: q.text || q.question || 'Question text missing',
        options,
        correctAnswer: validAnswer,
        examType: q.examType || params.examType,
        subject: q.subject || params.subject,
        year: q.year || params.year,
        section: q.section || q.topic,
        imageUrl: q.imageUrl || q.image,
      })
    }

    if (collected.length === 0) {
      throw new Error(`No valid questions found for ${params.subject} (${params.examType})`)
    }

    console.log(`[ALOC API] Successfully collected ${collected.length} questions`)
    return collected

  } catch (error: any) {
    console.error('[ALOC API] Error:', {
      message: error.message,
      name: error.name
    })
    throw new Error(`Failed to fetch questions: ${error.message}`)
  }
}