// app/api/student/library/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Student from '@/models/Student'
import Enrollment from '@/models/Enrollment'
import Course from '@/models/Course'
import Tutor from '@/models/Tutor'
import CourseMaterial from '@/models/CourseMaterial'
import MaterialProgress from '@/models/MaterialProgress'
import { flattenMaterial, computeProgressPercent } from '@/lib/courseLibrary'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const enrollments = await Enrollment.find({
    studentId: student._id,
    status: 'active',
    plan: { $in: ['trial', 'monthly', '3months', '6months', '1year'] },
  })

  const items = []

  for (const enrollment of enrollments) {
    const materials = await CourseMaterial.find({
      courseId: enrollment.courseId,
      tutorId: enrollment.tutorId,
      status: 'published',
    })

    if (materials.length === 0) continue

    const course = await Course.findById(enrollment.courseId).select('name category')
    const tutor = await Tutor.findById(enrollment.tutorId).select('firstName lastName')

    for (const material of materials) {
      const units = flattenMaterial(material)
      const progress = await MaterialProgress.findOne({
        studentId: student._id,
        materialId: material._id,
      })

      items.push({
        materialId: material._id,
        title: material.title,
        description: material.description,
        courseName: course?.name || 'Unknown course',
        courseCategory: course?.category,
        tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown tutor',
        chapterCount: material.chapters.length,
        percent: computeProgressPercent(units, progress),
        started: !!progress,
      })
    }
  }

  return NextResponse.json({ materials: items })
}