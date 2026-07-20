// app/api/tutor/grades/overview/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTutorGradingCenter } from '@/lib/gradingCenter'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor' || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await getTutorGradingCenter(session.user.email)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}