// app/api/lesson-notes/route.ts
// Public browse route with filters

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)

    const studentClass =
      searchParams.get('class')?.trim() || ''

    const category =
      searchParams.get('category')?.trim() || ''

    const subject =
      searchParams.get('subject')?.trim() || ''

    // --------------------------------------------------------
    // Only published lesson notes are publicly visible
    // --------------------------------------------------------

    const query: Record<string, any> = {
      status: 'published',
    }

    if (studentClass) {
      query.studentClass = studentClass
    }

    if (category) {
      query.category = category
    }

    if (subject) {
      query.subject = subject
    }

    // --------------------------------------------------------
    // Fetch only fields required by the public browse page
    // --------------------------------------------------------

    const notes = await LessonNote.find(query)
      .select(
        'title description coverImageUrl price studentClass category subject tutorId weeks purchaseCount createdAt'
      )
      .sort({ createdAt: -1 })
      .lean()

    // --------------------------------------------------------
    // Collect valid tutor IDs
    // --------------------------------------------------------

    const tutorIds = [
      ...new Set(
        notes
          .map((note: any) => note.tutorId?.toString())
          .filter(Boolean)
      ),
    ]

    // --------------------------------------------------------
    // Fetch tutor names
    // --------------------------------------------------------

    const tutors =
      tutorIds.length > 0
        ? await Tutor.find({
            _id: {
              $in: tutorIds,
            },
          })
            .select(
              'firstName lastName'
            )
            .lean()
        : []

    const tutorById = new Map(
      tutors.map((tutor: any) => [
        tutor._id.toString(),
        tutor,
      ])
    )

    // --------------------------------------------------------
    // Serialize result
    // --------------------------------------------------------

    const publicNotes = notes.map(
      (note: any) => {
        const tutorId =
          note.tutorId?.toString()

        const tutor =
          tutorId
            ? tutorById.get(tutorId)
            : null

        const price = Number(
          note.price ?? 0
        )

        return {
          _id:
            note._id.toString(),

          title:
            note.title ?? '',

          description:
            note.description ?? '',

          coverImageUrl:
            note.coverImageUrl ?? null,

          price,

          isFree:
            price === 0,

          studentClass:
            note.studentClass ?? '',

          category:
            note.category ?? null,

          subject:
            note.subject ?? '',

          weekCount:
            Array.isArray(note.weeks)
              ? note.weeks.length
              : 0,

          purchaseCount:
            Number(
              note.purchaseCount ?? 0
            ),

          tutorName:
            tutor
              ? `${tutor.firstName ?? ''} ${
                  tutor.lastName ?? ''
                }`.trim()
              : 'Unknown',
        }
      }
    )

    return NextResponse.json({
      notes:
        publicNotes,
    })
  } catch (error) {
    console.error(
      'Public lesson notes GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load lesson notes',
        notes: [],
      },
      {
        status: 500,
      }
    )
  }
}