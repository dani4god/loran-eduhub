// app/api/student/library/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialProgress from '@/models/MaterialProgress'
import { flattenMaterial, getUnlockedIndex } from '@/lib/courseLibrary'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { unitKey } = await req.json()
  if (!unitKey) {
    return NextResponse.json({ error: 'unitKey is required' }, { status: 400 })
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
  const targetIndex = units.findIndex(u => u.key === unitKey)
  if (targetIndex === -1) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
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

  const unlockedIndex = getUnlockedIndex(units, progress)
  if (targetIndex > unlockedIndex) {
    return NextResponse.json({ error: 'This page is locked' }, { status: 403 })
  }

  if (!progress.viewedKeys.includes(unitKey)) {
    progress.viewedKeys.push(unitKey)
  }
  progress.lastVisitedKey = unitKey
  await progress.save()

  const newUnlockedIndex = getUnlockedIndex(units, progress)

  return NextResponse.json({ success: true, unlockedIndex: newUnlockedIndex })
}