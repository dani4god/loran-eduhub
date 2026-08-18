// app/api/self-paced/courses/[id]/weeks/[weekNumber]/submit-exam/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import { getUnlockedWeekNumber, WEEK_PASS_MARK, MAX_EXAM_ATTEMPTS } from '@/lib/selfPaced'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; weekNumber: string }> }
) {
  const { id, weekNumber } = await params
  const weekNum = parseInt(weekNumber)

  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { answers } = await req.json()

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const enrollment = await SelfPacedEnrollment.findOne({ selfPacedStudentId: student._id, courseId: id })
  if (!enrollment) return NextResponse.json({ error: 'You do not own this course' }, { status: 403 })

  if (enrollment.locked) {
    return NextResponse.json(
      { error: 'This course is locked after 3 failed attempts. Book a session with your tutor to have it unlocked.', locked: true },
      { status: 403 }
    )
  }

  const unlockedWeek = getUnlockedWeekNumber(enrollment)
  if (weekNum > unlockedWeek) {
    return NextResponse.json({ error: 'This week is locked' }, { status: 403 })
  }

  const existingAttempt = enrollment.weekProgress.find((w: any) => w.weekNumber === weekNum)
  const attemptsSoFar = existingAttempt?.attemptsUsed || 0

  if (existingAttempt?.passed) {
    return NextResponse.json({ error: 'You have already passed this week' }, { status: 400 })
  }
  if (attemptsSoFar >= MAX_EXAM_ATTEMPTS) {
    return NextResponse.json({ error: 'No attempts remaining for this week' }, { status: 403 })
  }

  const course = await SelfPacedCourse.findById(id)
  const week = course?.weeks.find((w: any) => w.weekNumber === weekNum)
  if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

  let score = 0
  let total = 0
  for (const q of week.exam.questions) {
    const questionId = q?._id?.toString()
    if (!questionId) continue

    const marks = q.marks || 1
    total += marks
    const studentAnswer = (answers?.[questionId] || '').toString().trim().toLowerCase()
    const correct = q.correctAnswer.trim().toLowerCase()
    if (studentAnswer && studentAnswer === correct) score += marks
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const passed = percentage >= WEEK_PASS_MARK
  const newAttemptsUsed = attemptsSoFar + 1

  enrollment.weekProgress = enrollment.weekProgress.filter((w: any) => w.weekNumber !== weekNum)
  enrollment.weekProgress.push({
    weekNumber: weekNum,
    examScore: score,
    examTotal: total,
    examPercentage: percentage,
    passed,
    attemptsUsed: newAttemptsUsed,
    attemptedAt: new Date(),
  })

  let justLocked = false
  if (!passed && newAttemptsUsed >= MAX_EXAM_ATTEMPTS) {
    enrollment.locked = true
    enrollment.lockedAtWeek = weekNum
    justLocked = true
  }

  await enrollment.save()

  return NextResponse.json({
    success: true,
    score,
    total,
    percentage,
    passed,
    passMark: WEEK_PASS_MARK,
    attemptsUsed: newAttemptsUsed,
    attemptsRemaining: Math.max(0, MAX_EXAM_ATTEMPTS - newAttemptsUsed),
    locked: justLocked,
    newUnlockedWeek: getUnlockedWeekNumber(enrollment),
  })
}