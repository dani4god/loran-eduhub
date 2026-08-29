// app/api/admin/workshop/certificates/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getToken } from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import WorkshopCertificateBatch from '@/models/WorkshopCertificateBatch'

import WorkshopCertificateIssue from '@/models/WorkshopCertificateIssue'

import {
  generate12DigitCode,
} from '@/lib/workshop'

// ============================================================
// GET CERTIFICATE BATCHES
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    const token =
      await getToken({
        req,
      })

    if (
      !token ||
      token.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    await connectDB()

    const batches =
      await WorkshopCertificateBatch
        .find()
        .sort({
          createdAt: -1,
        })
        .lean()

    const results =
      await Promise.all(
        batches.map(
          async (batch: any) => {
            const issuedCount =
              await WorkshopCertificateIssue.countDocuments(
                {
                  batchId:
                    batch._id,
                }
              )

            return {
              _id:
                batch._id.toString(),

              title:
                batch.title,

              code:
                batch.code,

              logoUrl:
                batch.logoUrl,

              signatureUrl:
                batch.signatureUrl,

              convenerName:
                batch.convenerName,

              certificateOutcomes:
                batch.certificateOutcomes ||
                [],

              isActive:
                batch.isActive,

              createdAt:
                batch.createdAt,

              issuedCount,
            }
          }
        )
      )

    return NextResponse.json({
      batches: results,
    })
  } catch (error) {
    console.error(
      'Failed to load workshop certificate batches:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Failed to load certificate batches',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// CREATE CERTIFICATE BATCH
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    const token =
      await getToken({
        req,
      })

    if (
      !token ||
      token.role !== 'admin'
    ) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const body =
      await req.json()

    const {
      title,
      logoUrl,
      signatureUrl,
      convenerName,
      certificateOutcomes,
    } = body

    if (!title?.trim()) {
      return NextResponse.json(
        {
          error:
            'Workshop title is required',
        },
        {
          status: 400,
        }
      )
    }

    if (!logoUrl?.trim()) {
      return NextResponse.json(
        {
          error:
            'Certificate logo is required',
        },
        {
          status: 400,
        }
      )
    }

    if (!signatureUrl?.trim()) {
      return NextResponse.json(
        {
          error:
            'Convener signature is required',
        },
        {
          status: 400,
        }
      )
    }

    const cleanOutcomes =
      Array.isArray(
        certificateOutcomes
      )
        ? certificateOutcomes
            .map(
              (
                outcome: unknown
              ) =>
                typeof outcome ===
                'string'
                  ? outcome.trim()
                  : ''
            )
            .filter(Boolean)
        : []

    await connectDB()

    let code =
      generate12DigitCode()

    while (
      await WorkshopCertificateBatch.exists(
        {
          code,
        }
      )
    ) {
      code =
        generate12DigitCode()
    }

    const batch =
      await WorkshopCertificateBatch.create(
        {
          title:
            title.trim(),

          code,

          logoUrl:
            logoUrl.trim(),

          signatureUrl:
            signatureUrl.trim(),

          convenerName:
            (
              convenerName ||
              'Okeke Daniel'
            ).trim(),

          certificateOutcomes:
            cleanOutcomes,

          isActive: true,
        }
      )

    return NextResponse.json(
      {
        success: true,

        batch: {
          _id:
            batch._id.toString(),

          title:
            batch.title,

          code:
            batch.code,

          logoUrl:
            batch.logoUrl,

          signatureUrl:
            batch.signatureUrl,

          convenerName:
            batch.convenerName,

          certificateOutcomes:
            batch.certificateOutcomes,

          isActive:
            batch.isActive,

          createdAt:
            batch.createdAt,

          issuedCount: 0,
        },
      },
      {
        status: 201,
      }
    )
  } catch (error: any) {
    console.error(
      'Failed to create workshop certificate batch:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to create certificate batch',
      },
      {
        status: 500,
      }
    )
  }
}