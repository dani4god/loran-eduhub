// lib/examBulkUpload.ts
import * as XLSX from 'xlsx'

export interface ParsedQuestion {
  type: 'mcq' | 'fill' | 'trueFalse'
  question: string
  options?: string[]
  correctAnswer: string
  marks: number
}

// Expected columns (case-insensitive header match):
// Type | Question | Option1 | Option2 | Option3 | Option4 | CorrectAnswer | Marks
export function parseQuestionsWorkbook(buffer: Buffer): { questions: ParsedQuestion[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const questions: ParsedQuestion[] = []
  const errors: string[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // +1 for header, +1 for 1-indexing
    const norm: Record<string, any> = {}
    for (const key of Object.keys(row)) {
      norm[key.trim().toLowerCase()] = row[key]
    }

    const type = (norm['type'] || '').toString().trim().toLowerCase()
    const question = (norm['question'] || '').toString().trim()
    const correctAnswer = (norm['correctanswer'] || norm['correct answer'] || '').toString().trim()
    const marks = Number(norm['marks']) || 1

    if (!question) { errors.push(`Row ${rowNum}: missing question text`); return }
    if (!correctAnswer) { errors.push(`Row ${rowNum}: missing correct answer`); return }

    let mappedType: 'mcq' | 'fill' | 'trueFalse'
    if (type === 'mcq' || type === 'multiple choice' || type === 'multiple_choice') mappedType = 'mcq'
    else if (type === 'truefalse' || type === 'true/false' || type === 'true false') mappedType = 'trueFalse'
    else if (type === 'fill' || type === 'fill in the gap' || type === 'fillinthegap') mappedType = 'fill'
    else { errors.push(`Row ${rowNum}: unrecognized type "${norm['type']}" (use MCQ, TrueFalse, or Fill)`); return }

    let options: string[] | undefined
    if (mappedType === 'mcq') {
      options = [1, 2, 3, 4]
        .map((n) => (norm[`option${n}`] || '').toString().trim())
        .filter((o) => o.length > 0)
      if (options.length < 2) { errors.push(`Row ${rowNum}: MCQ needs at least 2 options`); return }
      if (!options.includes(correctAnswer)) {
        errors.push(`Row ${rowNum}: correct answer "${correctAnswer}" doesn't match any option exactly`); return
      }
    }

    if (mappedType === 'trueFalse' && !['true', 'false'].includes(correctAnswer.toLowerCase())) {
      errors.push(`Row ${rowNum}: TrueFalse correct answer must be exactly "true" or "false"`); return
    }

    questions.push({ type: mappedType, question, options, correctAnswer, marks })
  })

  return { questions, errors }
}

export function buildSampleTemplateBuffer(): Buffer {
  const data = [
    { Type: 'MCQ', Question: 'What does HTML stand for?', Option1: 'Hyper Text Markup Language', Option2: 'High Text Machine Language', Option3: 'Hyper Transfer Markup Language', Option4: 'None of the above', CorrectAnswer: 'Hyper Text Markup Language', Marks: 1 },
    { Type: 'TrueFalse', Question: 'CSS stands for Cascading Style Sheets.', Option1: '', Option2: '', Option3: '', Option4: '', CorrectAnswer: 'true', Marks: 1 },
    { Type: 'Fill', Question: 'The ___ tag is used to define a hyperlink in HTML.', Option1: '', Option2: '', Option3: '', Option4: '', CorrectAnswer: 'a', Marks: 1 },
  ]
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions')
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}