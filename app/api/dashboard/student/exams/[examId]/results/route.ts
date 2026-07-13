import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Grade from '@/models/Grade'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const student = await Student.findOne({ userId: session.user.id })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const grade = await Grade.findOne({
      studentId: student._id,
      examId,
    }).lean()

    if (!grade) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 })
    }

    return NextResponse.json({ grade })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}