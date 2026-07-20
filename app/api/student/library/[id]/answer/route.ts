// app/api/student/library/[id]/answer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialProgress from '@/models/MaterialProgress'
import { flattenMaterial } from '@/lib/courseLibrary'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { unitKey, questionId, selectedAnswer } = await req.json()
  if (!unitKey || !questionId || selectedAnswer === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const material = await CourseMaterial.findById(id)
  if (!material || material.status !== 'published') {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }

  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    courseId: material.courseId,
    tutorId: material.tutorId,
    status: 'active',
    plan: { $in: ['trial', 'monthly', '3months', '6months', '1year'] },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })
  }

  const units = flattenMaterial(material)
  const unit = units.find(u => u.key === unitKey)
  if (!unit) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
  }

  const question = unit.questions.find(q => q._id!.toString() === questionId)
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  let isCorrect = false
  if (question.type === 'fill') {
    isCorrect =
      selectedAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
  } else {
    isCorrect = selectedAnswer === question.correctAnswer
  }

  let progress = await MaterialProgress.findOne({
    studentId: student._id,
    materialId: material._id,
  })
  if (!progress) {
    progress = await MaterialProgress.create({
      studentId: student._id,
      materialId: material._id,
      viewedKeys: [],
      quizAttempts: [],
      lastVisitedKey: null,
    })
  }

  // Keep only the latest attempt per question (allows retrying for revision).
  progress.quizAttempts = progress.quizAttempts.filter(
    a => !(a.unitKey === unitKey && a.questionId === questionId)
  )
  progress.quizAttempts.push({
    unitKey,
    questionId,
    selectedAnswer,
    isCorrect,
    attemptedAt: new Date(),
  })
  await progress.save()

  return NextResponse.json({
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation || null,
  })
}