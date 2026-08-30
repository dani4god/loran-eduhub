// app/api/lesson-notes/[id]/verify/route.ts

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

    // ========================================================
    // VALIDATE LESSON NOTE ID
    // ========================================================

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

    // ========================================================
    // IDEMPOTENCY
    // ========================================================

    /**
     * Only the SAME Paystack reference is considered
     * an already verified purchase.
     *
     * Buying the same lesson note again with a DIFFERENT
     * Paystack reference will create another purchase.
     */
    const existingPurchase =
      await LessonNotePurchase.findOne({
        lessonNoteId:
          id,

        paystackReference:
          reference,
      }).lean()

    if (
      existingPurchase
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyVerified:
          true,

        purchaseId:
          existingPurchase._id.toString(),

        reference,
      })
    }

    // ========================================================
    // LOAD LESSON NOTE
    // ========================================================

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
      console.error(
        '[LESSON NOTE VERIFY] PAYSTACK_SECRET_KEY is missing'
      )

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

    // ========================================================
    // VERIFY WITH PAYSTACK
    // ========================================================

    const verifyResponse =
      await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          method:
            'GET',

          headers: {
            Authorization:
              `Bearer ${secretKey}`,

            'Content-Type':
              'application/json',
          },

          cache:
            'no-store',
        }
      )

    const verification =
      await verifyResponse.json()

    if (
      !verifyResponse.ok ||
      verification?.status !==
        true ||
      !verification?.data
    ) {
      console.error(
        '[LESSON NOTE VERIFY] Paystack verification failed',
        {
          reference,
          response:
            verification,
        }
      )

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

    // ========================================================
    // VERIFY REFERENCE
    // ========================================================

    if (
      String(
        transaction.reference ||
          ''
      ) !==
      reference
    ) {
      console.error(
        '[LESSON NOTE VERIFY] Reference mismatch',
        {
          expected:
            reference,

          received:
            transaction.reference,
        }
      )

      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment reference mismatch',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // VERIFY TRANSACTION STATUS
    // ========================================================

    if (
      transaction.status !==
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

    // ========================================================
    // VERIFY CURRENCY
    // ========================================================

    if (
      String(
        transaction.currency ||
          ''
      ).toUpperCase() !==
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

    // ========================================================
    // VERIFY AMOUNT
    // ========================================================

    const notePrice =
      Number(
        note.price
      )

    if (
      !Number.isFinite(
        notePrice
      ) ||
      notePrice <= 0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Invalid lesson note price',
        },
        {
          status: 400,
        }
      )
    }

    const expectedAmount =
      Math.round(
        notePrice *
          100
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
        '[LESSON NOTE VERIFY] Amount mismatch',
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

    // ========================================================
    // VERIFY METADATA
    // ========================================================

    const metadata =
      transaction.metadata &&
      typeof transaction.metadata ===
        'object'
        ? transaction.metadata
        : {}

    if (
      metadata.type !==
        'lesson_note' ||
      String(
        metadata.lessonNoteId ||
          ''
      ) !==
        note._id.toString()
    ) {
      console.error(
        '[LESSON NOTE VERIFY] Metadata mismatch',
        {
          reference,
          metadata,

          expectedLessonNoteId:
            note._id.toString(),
        }
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

    // ========================================================
    // BUYER DETAILS
    // ========================================================

    const buyerName =
      typeof metadata.buyerName ===
      'string'
        ? metadata.buyerName.trim()
        : ''

    const metadataEmail =
      typeof metadata.buyerEmail ===
      'string'
        ? metadata.buyerEmail
            .trim()
            .toLowerCase()
        : ''

    const paystackEmail =
      typeof transaction
        ?.customer?.email ===
      'string'
        ? transaction.customer.email
            .trim()
            .toLowerCase()
        : ''

    const buyerEmail =
      metadataEmail ||
      paystackEmail

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

    /**
     * If Paystack supplied a customer email AND metadata supplied
     * an email, make sure they agree.
     */
    if (
      metadataEmail &&
      paystackEmail &&
      metadataEmail !==
        paystackEmail
    ) {
      console.error(
        '[LESSON NOTE VERIFY] Customer email mismatch',
        {
          reference,

          metadataEmail,

          paystackEmail,
        }
      )

      return NextResponse.json(
        {
          success:
            false,

          error:
            'Payment buyer email does not match',
        },
        {
          status: 400,
        }
      )
    }

    // ========================================================
    // CREATE PURCHASE
    // ========================================================

    try {
      const purchase =
        await LessonNotePurchase.create({
          lessonNoteId:
            note._id,

          tutorId:
            note.tutorId,

          buyerEmail,

          buyerName,

          amountPaid:
            notePrice,

          paystackReference:
            reference,

          payoutLogged:
            false,
        })

      // ======================================================
      // INCREMENT PURCHASE COUNT
      // ======================================================

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

      return NextResponse.json({
        success:
          true,

        alreadyVerified:
          false,

        purchaseId:
          purchase._id.toString(),

        reference,
      })
    } catch (
      error: any
    ) {
      // ======================================================
      // DUPLICATE VERIFICATION RACE
      // ======================================================

      if (
        error?.code ===
        11000
      ) {
        const duplicatePurchase =
          await LessonNotePurchase.findOne({
            paystackReference:
              reference,
          }).lean()

        if (
          duplicatePurchase
        ) {
          return NextResponse.json({
            success:
              true,

            alreadyVerified:
              true,

            purchaseId:
              duplicatePurchase._id.toString(),

            reference,
          })
        }
      }

      throw error
    }
  } catch (error) {
    console.error(
      '[LESSON NOTE VERIFY ERROR]',
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