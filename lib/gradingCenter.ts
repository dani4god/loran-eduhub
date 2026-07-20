// lib/gradingCenter.ts
import dbConnect from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Enrollment from '@/models/Enrollment'
import AssignmentSubmission from '@/models/AssignmentSubmission'
import '@/models/Student'
import '@/models/Course'
import '@/models/Assignment' // registers Assignment for populate('assignmentId', 'title totalScore')
import { computeEnrollmentAverage } from '@/lib/certificateEligibility'
import { classifyScore } from '@/lib/certificate'

function serializeId(id: any) {
  return id?.toString()
}

export async function getTutorGradingCenter(email: string) {
  await dbConnect()

  const tutor = await Tutor.findOne({ email }).lean()
  if (!tutor) throw new Error('Tutor not found')

  const enrollments = await Enrollment.find({
    tutorId: tutor._id,
    status: { $in: ['active', 'paused', 'expired'] },
  })
    .populate('studentId', 'firstName lastName')
    .populate('courseId', 'name')
    .lean()

  const studentAverages = await Promise.all(
    enrollments.map(async (e: any) => {
      const { averageScore, itemCount, hasAnyGrades } = await computeEnrollmentAverage(
        e._id.toString()
      )

      return {
        enrollmentId: serializeId(e._id),
        studentId: serializeId(e.studentId?._id),
        studentName: e.studentId
          ? `${e.studentId.firstName} ${e.studentId.lastName}`
          : 'Unknown Student',
        courseId: serializeId(e.courseId?._id),
        courseName: e.courseId?.name ?? 'Unknown Course',
        averageScore,
        itemCount,
        hasAnyGrades,
        classification: hasAnyGrades ? classifyScore(averageScore) : null,
        status: e.status,
      }
    })
  )

  const pendingSubmissions = await AssignmentSubmission.find({
    tutorId: tutor._id,
    status: 'submitted',
  })
    .populate('studentId', 'firstName lastName')
    .populate('assignmentId', 'title totalScore')
    .populate('courseId', 'name')
    .sort({ submittedAt: -1 })
    .lean()

  const pendingAssignments = pendingSubmissions.map((s: any) => ({
    submissionId: serializeId(s._id),
    assignmentId: serializeId(s.assignmentId?._id),
    assignmentTitle: s.assignmentId?.title ?? 'Assignment',
    totalScore: s.assignmentId?.totalScore ?? 0,
    studentId: serializeId(s.studentId?._id),
    studentName: s.studentId
      ? `${s.studentId.firstName} ${s.studentId.lastName}`
      : 'Unknown Student',
    courseName: s.courseId?.name ?? '',
    submittedAt: s.submittedAt,
  }))

  return { studentAverages, pendingAssignments }
}