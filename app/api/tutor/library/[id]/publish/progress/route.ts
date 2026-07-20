// app/api/tutor/library/[id]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialProgress from '@/models/MaterialProgress'
import { flattenMaterial, computeProgressPercent } from '@/lib/courseLibrary'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const tutor = await Tutor.findOne({ userId: session.user.id })
  if (!tutor) {
    return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })
  }

  const material = await CourseMaterial.findById(id)
  if (!material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }
  if (material.tutorId.toString() !== tutor._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const units = flattenMaterial(material)

  const enrollments = await Enrollment.find({
    tutorId: tutor._id,
    courseId: material.courseId,
  })

  const results = []

  for (const enrollment of enrollments) {
    const student = await Student.findById(enrollment.studentId)
    if (!student) continue

    const progress = await MaterialProgress.findOne({
      studentId: student._id,
      materialId: material._id,
    })

    results.push({
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      percent: computeProgressPercent(units, progress),
      lastVisitedKey: progress?.lastVisitedKey || null,
      lastActivityAt: progress?.updatedAt || null,
      started: !!progress,
    })
  }

  return NextResponse.json({ students: results, totalUnits: units.length })
}