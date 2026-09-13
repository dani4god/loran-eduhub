// app/api/self-paced/courses/[id]/public/route.ts

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'
import SelfPacedCourse from '@/models/SelfPacedCourse'
import Tutor from '@/models/Tutor'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // ============================================================
    // VALIDATE ID
    // ============================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: 'Invalid course ID.',
        },
        {
          status: 400,
        }
      )
    }

    // ============================================================
    // DATABASE
    // ============================================================

    await connectDB()

    const course = await SelfPacedCourse.findById(id).lean()

    if (!course || course.status !== 'published') {
      return NextResponse.json(
        {
          error: 'Course not found.',
        },
        {
          status: 404,
        }
      )
    }

    // ============================================================
    // TUTOR
    // ============================================================

    const tutor = course.tutorId
      ? await Tutor.findById(course.tutorId)
          .select(
            'firstName lastName bio profileImage'
          )
          .lean()
      : null

    // ============================================================
    // COURSE WEEKS
    // ============================================================

    const weeks = Array.isArray(course.weeks)
      ? course.weeks
      : []

    // ============================================================
    // COURSE STATISTICS
    // ============================================================

    const totalWeeks = weeks.length

    const totalLessonPages = weeks.reduce(
      (total: number, week: any) => {
        const pages = Array.isArray(week?.pages)
          ? week.pages
          : []

        return total + pages.length
      },
      0
    )

    const totalQuestions = weeks.reduce(
      (total: number, week: any) => {
        const questions = Array.isArray(
          week?.exam?.questions
        )
          ? week.exam.questions
          : []

        return total + questions.length
      },
      0
    )

    const totalAssessments = weeks.reduce(
      (total: number, week: any) => {
        const questions = Array.isArray(
          week?.exam?.questions
        )
          ? week.exam.questions
          : []

        return questions.length > 0
          ? total + 1
          : total
      },
      0
    )

    // ============================================================
    // SAFE PUBLIC CURRICULUM
    //
    // Important:
    // We expose only titles and exam metadata.
    //
    // We do NOT expose:
    // - lesson content
    // - question text
    // - options
    // - correct answers
    // ============================================================

    const safeWeeks = weeks.map(
      (week: any) => {
        const pages = Array.isArray(week?.pages)
          ? week.pages
          : []

        const questions = Array.isArray(
          week?.exam?.questions
        )
          ? week.exam.questions
          : []

        return {
          weekNumber:
            week.weekNumber,

          title:
            week.title || `Week ${week.weekNumber}`,

          pages: pages.map(
            (page: any, index: number) => ({
              title:
                page?.title ||
                `Lesson ${index + 1}`,
            })
          ),

          exam: week.exam
            ? {
                durationMinutes:
                  Number(
                    week.exam.durationMinutes
                  ) || 0,

                questionCount:
                  questions.length,
              }
            : null,
        }
      }
    )

    // ============================================================
    // MODULE FORMAT
    //
    // Kept because your previous API already returned "modules".
    // This avoids breaking any other page that may be using it.
    // ============================================================

    const modules = safeWeeks.map(
      (week: any) => ({
        weekNumber:
          week.weekNumber,

        title:
          week.title,

        pageTitles:
          week.pages.map(
            (page: any) =>
              page.title
          ),

        questionCount:
          week.exam?.questionCount || 0,

        durationMinutes:
          week.exam?.durationMinutes || 0,
      })
    )

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      _id:
        course._id.toString(),

      title:
        course.title,

      description:
        course.description,

      coverImageUrl:
        course.coverImageUrl || null,

      previewVideoUrl:
        course.previewVideoUrl || null,

      price:
        course.price,

      isFree:
        Number(course.price) === 0,

      category:
        course.category,

      coachingEnabled:
        course.coachingEnabled,

      discordEnabled:
        course.discordEnabled,

      weeklyWorkshop:
        course.weeklyWorkshop,

      tutor: tutor
        ? {
            firstName:
              tutor.firstName,

            lastName:
              tutor.lastName,

            bio:
              tutor.bio,

            profileImage:
              tutor.profileImage,
          }
        : null,

      // --------------------------------
      // SAFE COURSE STRUCTURE
      // --------------------------------

      weeks:
        safeWeeks,

      modules,

      // --------------------------------
      // CALCULATED PUBLIC STATISTICS
      // --------------------------------

      stats: {
        weeks:
          totalWeeks,

        lessonPages:
          totalLessonPages,

        questions:
          totalQuestions,

        assessments:
          totalAssessments,
      },
    })
  } catch (error) {
    console.error(
      'Public self-paced course fetch error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Could not load course.',
      },
      {
        status: 500,
      }
    )
  }
}