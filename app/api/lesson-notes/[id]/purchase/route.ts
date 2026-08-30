import {
  NextRequest,
  NextResponse,
} from 'next/server'

import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'
import LessonNote from '@/models/LessonNote'

export async function POST(
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
    const { id } =
      await params

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

    let body: any

    try {
      body =
        await req.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body',
        },
        {
          status: 400,
        }
      )
    }

    const name =
      typeof body?.name ===
      'string'
        ? body.name.trim()
        : ''

    const email =
      typeof body?.email ===
      'string'
        ? body.email
            .trim()
            .toLowerCase()
        : ''

    if (
      !name ||
      !email
    ) {
      return NextResponse.json(
        {
          error:
            'Name and email are required',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    const note =
      await LessonNote.findOne({
        _id: id,
        status:
          'published',
      })

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

    const price =
      Number(
        note.price || 0
      )

    // --------------------------------------------------------
    // FREE LESSON NOTE
    // --------------------------------------------------------

    if (price === 0) {
      return NextResponse.json({
        success:
          true,

        isFree:
          true,

        lessonNoteId:
          note._id.toString(),
      })
    }

    // --------------------------------------------------------
    // PAYSTACK CONFIG
    // --------------------------------------------------------

    const secretKey =
      process.env
        .PAYSTACK_SECRET_KEY

    if (!secretKey) {
      console.error(
        'PAYSTACK_SECRET_KEY is missing'
      )

      return NextResponse.json(
        {
          error:
            'Payment configuration error',
        },
        {
          status: 500,
        }
      )
    }

    const baseUrl =
      process.env.APP_URL ||
      process.env
        .NEXTAUTH_URL

    if (!baseUrl) {
      return NextResponse.json(
        {
          error:
            'Application URL is not configured',
        },
        {
          status: 500,
        }
      )
    }

    // --------------------------------------------------------
    // Generate unique reference
    // --------------------------------------------------------

    const reference =
      `LN-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)
        .toUpperCase()}`

    const callbackUrl =
      `${baseUrl}/lesson-notes/${id}/purchase`

    // --------------------------------------------------------
    // Initialize transaction with Paystack
    // --------------------------------------------------------

    const paystackResponse =
      await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${secretKey}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              email,

              amount:
                Math.round(
                  price * 100
                ),

              currency:
                'NGN',

              reference,

              callback_url:
                callbackUrl,

              metadata: {
                type:
                  'lesson_note',

                lessonNoteId:
                  note._id.toString(),

                tutorId:
                  note.tutorId.toString(),

                buyerName:
                  name,

                buyerEmail:
                  email,
              },
            }),
        }
      )

    const paystackData =
      await paystackResponse.json()

    if (
      !paystackResponse.ok ||
      !paystackData?.status ||
      !paystackData?.data
    ) {
      console.error(
        'Paystack initialize error:',
        paystackData
      )

      return NextResponse.json(
        {
          error:
            paystackData?.message ||
            'Could not initialize payment',
        },
        {
          status: 502,
        }
      )
    }

    return NextResponse.json({
      success:
        true,

      isFree:
        false,

      reference,

      authorizationUrl:
        paystackData.data
          .authorization_url,

      accessCode:
        paystackData.data
          .access_code,

      amount:
        price,

      email,
    })
  } catch (error) {
    console.error(
      'Lesson note purchase error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to initialize purchase',
      },
      {
        status: 500,
      }
    )
  }
}