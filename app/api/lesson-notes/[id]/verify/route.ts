import {
  NextRequest,
  NextResponse,
} from 'next/server'

import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'

import LessonNote from '@/models/LessonNote'

import LessonNotePurchase from '@/models/LessonNotePurchase'

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
    const { id } =
      await params

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Invalid lesson note ID',
        },
        {
          status: 400,
        }
      )
    }

    const {
      searchParams,
    } =
      new URL(
        req.url
      )

    const reference =
      searchParams
        .get(
          'reference'
        )
        ?.trim()

    if (!reference) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment reference is required',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    // --------------------------------------------------------
    // Return immediately if purchase already verified
    // --------------------------------------------------------

    const existingPurchase =
      await LessonNotePurchase.findOne({
        lessonNoteId:
          id,

        paystackReference:
          reference,
      })

    if (
      existingPurchase
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyVerified:
          true,

        reference,
      })
    }

    const note =
      await LessonNote.findOne({
        _id: id,
        status:
          'published',
      })

    if (!note) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Lesson note not found',
        },
        {
          status: 404,
        }
      )
    }

    const secretKey =
      process.env
        .PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment configuration error',
        },
        {
          status: 500,
        }
      )
    }

    // --------------------------------------------------------
    // Verify payment with Paystack
    // --------------------------------------------------------

    const verifyResponse =
      await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${secretKey}`,
          },

          cache:
            'no-store',
        }
      )

    const verification =
      await verifyResponse.json()

    if (
      !verifyResponse.ok ||
      !verification?.status
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            verification?.message ||
            'Could not verify payment',
        },
        {
          status: 400,
        }
      )
    }

    const transaction =
      verification.data

    if (
      transaction?.status !==
      'success'
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment has not been completed',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Verify amount
    // --------------------------------------------------------

    const expectedAmount =
      Math.round(
        Number(
          note.price
        ) * 100
      )

    const paidAmount =
      Number(
        transaction.amount ||
          0
      )

    if (
      paidAmount !==
      expectedAmount
    ) {
      console.error(
        'Lesson note payment amount mismatch',
        {
          reference,
          expectedAmount,
          paidAmount,
        }
      )

      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment amount does not match lesson note price',
        },
        {
          status: 400,
        }
      )
    }

    if (
      transaction.currency !==
      'NGN'
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Invalid payment currency',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Verify metadata belongs to this note
    // --------------------------------------------------------

    const metadata =
      transaction.metadata ||
      {}

    if (
      metadata.type !==
      'lesson_note' ||
      metadata.lessonNoteId !==
        note._id.toString()
    ) {
      console.error(
        'Lesson note metadata mismatch:',
        metadata
      )

      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment does not belong to this lesson note',
        },
        {
          status: 400,
        }
      )
    }

    const buyerName =
      typeof metadata.buyerName ===
      'string'
        ? metadata.buyerName.trim()
        : ''

    const buyerEmail =
      typeof metadata.buyerEmail ===
      'string'
        ? metadata.buyerEmail
            .trim()
            .toLowerCase()
        : transaction
            ?.customer
            ?.email ||
          ''

    if (
      !buyerName ||
      !buyerEmail
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Buyer information is missing from the payment',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // Create purchase record
    // --------------------------------------------------------

    try {
      await LessonNotePurchase.create({
        lessonNoteId:
          note._id,

        tutorId:
          note.tutorId,

        buyerEmail,

        buyerName,

        amountPaid:
          Number(
            note.price
          ),

        paystackReference:
          reference,

        payoutLogged:
          false,
      })

      await LessonNote.updateOne(
        {
          _id:
            note._id,
        },
        {
          $inc: {
            purchaseCount:
              1,
          },
        }
      )
    } catch (
      error: any
    ) {
      /**
       * Because paystackReference is unique,
       * simultaneous verification attempts may cause
       * Mongo duplicate-key error.
       *
       * If the purchase now exists, verification still succeeded.
       */

      if (
        error?.code ===
        11000
      ) {
        const duplicatePurchase =
          await LessonNotePurchase.findOne({
            paystackReference:
              reference,
          })

        if (
          duplicatePurchase
        ) {
          return NextResponse.json({
            success:
              true,

            reference,

            alreadyVerified:
              true,
          })
        }
      }

      throw error
    }

    return NextResponse.json({
      success:
        true,

      reference,
    })
  } catch (error) {
    console.error(
      'Lesson note verification error:',
      error
    )

    return NextResponse.json(
      {
        success:
          false,

        error:
          'Failed to verify payment',
      },
      {
        status: 500,
      }
    )
  }
}