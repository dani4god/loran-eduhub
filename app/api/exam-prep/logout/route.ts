//app/api/exam-prep/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clearExamPrepSessionCookie, revokeCurrentExamPrepSession } from '@/lib/examPrepAuth'

export async function POST(req: NextRequest) {
  try { await revokeCurrentExamPrepSession(req) } catch {}
  const response = NextResponse.json({ success: true })
  clearExamPrepSessionCookie(response)
  return response
}
