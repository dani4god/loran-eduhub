//app/api/exam-prep/subjects/route.ts
import { NextResponse } from 'next/server'
import { EXAM_PREP_CLASSES, getExamPrepSubjectCatalog } from '@/lib/examPrepCatalog'

export async function GET() {
  return NextResponse.json({ classes: EXAM_PREP_CLASSES, categories: getExamPrepSubjectCatalog() })
}
