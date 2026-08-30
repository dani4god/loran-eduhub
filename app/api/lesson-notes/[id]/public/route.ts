// app/api/lesson-notes/[id]/public/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'

import LessonNote from '@/models/LessonNote'

import Tutor from '@/models/Tutor'

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    const {
      id,
    } = await params

    // --------------------------------------------------------
    // Validate MongoDB ID
    // --------------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid lesson note ID',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    // --------------------------------------------------------
    // Find published lesson note
    // --------------------------------------------------------

    const note =
      await LessonNote.findOne({
        _id: id,
        status: 'published',
      }).lean()

    if (!note) {
      return NextResponse.json(
        {
          error:
            'Lesson note not found',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // Find tutor
    // --------------------------------------------------------

    const tutor =
      await Tutor.findById(
        note.tutorId
      )
        .select(
          'firstName lastName profileImage bio'
        )
        .lean()

    // --------------------------------------------------------
    // Normalize weeks
    // --------------------------------------------------------

    const weeks =
      Array.isArray(
        note.weeks
      )
        ? [...note.weeks].sort(
            (
              a: any,
              b: any
            ) =>
              Number(
                a.weekNumber
              ) -
              Number(
                b.weekNumber
              )
          )
        : []

    const isFree =
      Number(
        note.price || 0
      ) === 0

    // --------------------------------------------------------
    // Free notes:
    // show EVERYTHING.
    //
    // Paid notes:
    // show weeks 1 and 2 only.
    // --------------------------------------------------------

    const previewWeeks =
      isFree
        ? weeks
        : weeks.filter(
            (
              week: any
            ) =>
              Number(
                week.weekNumber
              ) <= 2
          )

    const lockedWeekTitles =
      isFree
        ? []
        : weeks
            .filter(
              (
                week: any
              ) =>
                Number(
                  week.weekNumber
                ) > 2
            )
            .map(
              (
                week: any
              ) => ({
                _id:
                  week._id?.toString?.() ||
                  null,

                weekNumber:
                  week.weekNumber,

                title:
                  week.title ||
                  '',
              })
            )

    // --------------------------------------------------------
    // Serialize preview weeks cleanly
    // --------------------------------------------------------

    const serializedPreviewWeeks =
      previewWeeks.map(
        (
          week: any
        ) => ({
          _id:
            week._id?.toString?.() ||
            null,

          weekNumber:
            week.weekNumber,

          title:
            week.title ||
            '',

          pages:
            Array.isArray(
              week.pages
            )
              ? week.pages.map(
                  (
                    page: any
                  ) => ({
                    _id:
                      page._id?.toString?.() ||
                      null,

                    title:
                      page.title ||
                      '',

                    content:
                      page.content ||
                      '',

                    links:
                      Array.isArray(
                        page.links
                      )
                        ? page.links.map(
                            (
                              link: any
                            ) => ({
                              label:
                                link.label ||
                                '',

                              url:
                                link.url ||
                                '',
                            })
                          )
                        : [],
                  })
                )
              : [],
        })
      )

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return NextResponse.json({
      _id:
        note._id.toString(),

      title:
        note.title ||
        '',

      description:
        note.description ||
        '',

      coverImageUrl:
        note.coverImageUrl ||
        null,

      previewVideoUrl:
        note.previewVideoUrl ||
        null,

      price:
        Number(
          note.price || 0
        ),

      isFree,

      studentClass:
        note.studentClass ||
        '',

      category:
        note.category ||
        null,

      subject:
        note.subject ||
        '',

      purchaseCount:
        Number(
          note.purchaseCount ||
            0
        ),

      tutor:
        tutor
          ? {
              firstName:
                tutor.firstName ||
                '',

              lastName:
                tutor.lastName ||
                '',

              profileImage:
                tutor.profileImage ||
                null,

              bio:
                tutor.bio ||
                '',
            }
          : null,

      previewWeeks:
        serializedPreviewWeeks,

      lockedWeekTitles,

      totalWeeks:
        weeks.length,
    })
  } catch (
    error
  ) {
    console.error(
      'Public lesson note error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load lesson note',
      },
      {
        status: 500,
      }
    )
  }
}