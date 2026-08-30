// app/api/admin/payouts/[id]/pay/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getToken,
} from 'next-auth/jwt'

import mongoose from 'mongoose'

import connectDB from '@/lib/mongodb'

import PayoutLog from '@/models/PayoutLog'

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

    const token =
      await getToken({
        req,
      })

    if (
      !token ||
      token.role !==
        'admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid payout ID',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    /**
     * Atomically change only an unpaid payout to paid.
     *
     * This prevents two admin clicks from racing.
     */
    const payout =
      await PayoutLog.findOneAndUpdate(
        {
          _id: id,

          status: {
            $ne:
              'paid',
          },
        },
        {
          $set: {
            status:
              'paid',

            paidAt:
              new Date(),
          },

          $unset: {
            failureReason:
              1,

            paystackTransferCode:
              1,

            paystackTransferReference:
              1,
          },
        },
        {
          new: true,
        }
      )

    if (!payout) {
      const exists =
        await PayoutLog.exists({
          _id: id,
        })

      if (!exists) {
        return NextResponse.json(
          {
            error:
              'Payout not found',
          },
          {
            status: 404,
          }
        )
      }

      return NextResponse.json(
        {
          error:
            'This payout has already been marked as paid',
        },
        {
          status: 409,
        }
      )
    }

    return NextResponse.json({
      success:
        true,

      payout,
    })
  } catch (error) {
    console.error(
      '[ADMIN PAYOUT MARK PAID ERROR]',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to mark payout as paid',
      },
      {
        status: 500,
      }
    )
  }
}