// app/api/student/library/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialProgress from '@/models/MaterialProgress'
import {
  flattenMaterial,
  getUnlockedIndex,
  isUnitComplete,
  computeProgressPercent,
  sanitizeUnit,
} from '@/lib/courseLibrary'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    return NextResponse.json(
      { error: 'You are not enrolled in this course with this tutor' },
      { status: 403 }
    )
  }

  const units = flattenMaterial(material)

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

  const payload = units.map((unit, i) => {
    const locked = i > unlockedIndex
    const completed = isUnitComplete(unit, progress)
    return sanitizeUnit(unit, locked, completed)
  })

  return NextResponse.json({
    materialId: material._id,
    title: material.title,
    description: material.description,
    units: payload,
    unlockedIndex,
    percent: computeProgressPercent(units, progress),
    lastVisitedKey: progress.lastVisitedKey,
  })
}