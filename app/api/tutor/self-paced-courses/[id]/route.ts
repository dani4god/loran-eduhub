// app/api/tutor/self-paced-courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import SelfPacedEnrollment from '@/models/SelfPacedEnrollment'

async function getOwnedCourse(id: string, userId: string) {
  const tutor = await Tutor.findOne({ userId })
  if (!tutor) return { error: 'Tutor not found', status: 404 as const }
  const course = await SelfPacedCourse.findById(id)
  if (!course) return { error: 'Course not found', status: 404 as const }
  if (course.tutorId.toString() !== tutor._id.toString()) return { error: 'Forbidden', status: 403 as const }
  return { course, tutor }
}

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
  const result = await getOwnedCourse(id, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json({ course: result.course })
}

// Used for autosave — accepts a partial update, saves whatever fields
// are present (title, description, coverImageUrl, price, weeks,
// coaching/discord/workshop settings, certificate assets).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const result = await getOwnedCourse(id, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const course = result.course

  // A published (live, student-facing) course cannot be edited directly —
  // it must be unpublished first. This prevents content/exam questions
  // from shifting under students mid-course.
  if (course.status === 'published') {
    return NextResponse.json(
      { error: 'This course is published and cannot be edited. Unpublish it first, make your changes, then submit for review again.' },
      { status: 400 }
    )
  }

  const body = await req.json()
  
  // Validate weeks structure if provided
  if (body.weeks !== undefined) {
    if (!Array.isArray(body.weeks)) {
      return NextResponse.json(
        { error: 'Weeks must be an array' },
        { status: 400 }
      )
    }
    
    // Validate each week has required fields
    for (let i = 0; i < body.weeks.length; i++) {
      const week = body.weeks[i]
      if (!week.weekNumber || !week.title) {
        return NextResponse.json(
          { error: `Week ${i + 1} is missing weekNumber or title` },
          { status: 400 }
        )
      }
      
      // Validate pages if present (for multi-page weeks)
      if (week.pages !== undefined) {
        if (!Array.isArray(week.pages)) {
          return NextResponse.json(
            { error: `Week ${i + 1} pages must be an array` },
            { status: 400 }
          )
        }
        
        for (let j = 0; j < week.pages.length; j++) {
          const page = week.pages[j]
          if (!page.title) {
            return NextResponse.json(
              { error: `Week ${i + 1}, Page ${j + 1} is missing a title` },
              { status: 400 }
            )
          }
          // content can be empty, but should exist
          if (page.content === undefined) {
            return NextResponse.json(
              { error: `Week ${i + 1}, Page ${j + 1} is missing content` },
              { status: 400 }
            )
          }
        }
      }
      
      // Validate exam structure if present
      if (week.exam) {
        if (week.exam.durationMinutes !== undefined && typeof week.exam.durationMinutes !== 'number') {
          return NextResponse.json(
            { error: `Week ${i + 1} exam duration must be a number` },
            { status: 400 }
          )
        }
        if (week.exam.questions !== undefined && !Array.isArray(week.exam.questions)) {
          return NextResponse.json(
            { error: `Week ${i + 1} exam questions must be an array` },
            { status: 400 }
          )
        }
      }
    }
  }

  const allowedFields = [
    'title', 'description', 'coverImageUrl', 'price', 'category', 'weeks',
    'coachingEnabled', 'coachingHourlyRate', 'discordEnabled', 'discordDescription',
    'weeklyWorkshop', 'certificateSignatureUrl', 'certificateLogoUrl',
  ]

  const update: any = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) update[field] = body[field]
  }

  // Ensure weeks are properly structured for multi-page format
  if (update.weeks) {
    update.weeks = update.weeks.map((week: any) => ({
      weekNumber: week.weekNumber,
      title: week.title,
      pages: week.pages || [],
      exam: {
        durationMinutes: week.exam?.durationMinutes || 20,
        questions: week.exam?.questions || [],
      },
    }))
  }

  const updated = await SelfPacedCourse.findByIdAndUpdate(id, update, { new: true })
  return NextResponse.json({ success: true, savedAt: new Date().toISOString(), course: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'tutor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const result = await getOwnedCourse(id, session.user.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const activeCount = await SelfPacedEnrollment.countDocuments({ courseId: id })
  if (activeCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${activeCount} student(s) have purchased this course. Unpublish it instead.` },
      { status: 400 }
    )
  }

  await SelfPacedCourse.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}