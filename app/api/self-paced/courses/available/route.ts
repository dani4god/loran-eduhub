// app/api/self-paced/courses/available/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Tutor from '@/models/Tutor'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'selfpaced_student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const student = await SelfPacedStudent.findOne({ userId: session.user.id })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const owned = await SelfPacedEnrollment.find({ selfPacedStudentId: student._id }).select('courseId')
  const ownedIds = owned.map((e: any) => e.courseId.toString())

  const courses = await SelfPacedCourse.find({
    status: 'published',
    _id: { $nin: ownedIds },
  }).select('title description coverImageUrl price category tutorId weeks')

  const tutorIds = [...new Set(courses.map((c: any) => c.tutorId.toString()))]
  const tutors = await Tutor.find({ _id: { $in: tutorIds } }).select('firstName lastName')
  const tutorById = new Map(tutors.map((t: any) => [t._id.toString(), t]))

  return NextResponse.json({
    courses: courses.map((c: any) => ({
      _id: c._id.toString(),
      title: c.title,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      price: c.price,
      isFree: c.price === 0,
      weekCount: c.weeks.length,
      tutorName: tutorById.get(c.tutorId.toString())
        ? `${tutorById.get(c.tutorId.toString())!.firstName} ${tutorById.get(c.tutorId.toString())!.lastName}`
        : 'Unknown Tutor',
    })),
  })
}