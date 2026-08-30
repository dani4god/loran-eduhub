// app/api/admin/lesson-notes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'
import Tutor from '@/models/Tutor'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })

    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(req.url)

    const status =
      searchParams.get('status') || 'pending_approval'

    const query: any = {}

    if (status !== 'all') {
      query.status = status
    }

    const notes = await LessonNote.find(query)
      .sort({ updatedAt: -1 })
      .lean()

    const tutorIds = [
      ...new Set(
        notes
          .map((n: any) => n.tutorId?.toString())
          .filter(Boolean)
      ),
    ]

    const tutors = await Tutor.find({
      _id: { $in: tutorIds },
    })
      .select('firstName lastName email')
      .lean()

    const tutorById = new Map(
      tutors.map((t: any) => [
        t._id.toString(),
        t,
      ])
    )

    return NextResponse.json({
      notes: notes.map((n: any) => {
        const tutor =
          tutorById.get(
            n.tutorId?.toString()
          )

        return {
          _id: n._id.toString(),

          title:
            n.title ?? '',

          description:
            n.description ?? '',

          coverImageUrl:
            n.coverImageUrl ?? null,

          previewVideoUrl:
            n.previewVideoUrl ?? null,

          price:
            n.price ?? 0,

          subject:
            n.subject ?? '',

          studentClass:
            n.studentClass ?? '',

          category:
            n.category ?? null,

          weeks:
            Array.isArray(n.weeks)
              ? n.weeks
              : [],

          status:
            n.status,

          rejectionReason:
            n.rejectionReason ?? null,

          tutorName:
            tutor
              ? `${tutor.firstName} ${tutor.lastName}`
              : 'Unknown',

          tutorEmail:
            tutor?.email ?? '',

          purchaseCount:
            n.purchaseCount ?? 0,

          createdAt:
            n.createdAt,

          updatedAt:
            n.updatedAt,
        }
      }),
    })
  } catch (error) {
    console.error(
      'Admin lesson notes GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load lesson notes',
      },
      {
        status: 500,
      }
    )
  }
}