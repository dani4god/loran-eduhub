// app/api/workshop/certificates/download/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import connectDB from '@/lib/mongodb'

import WorkshopCertificateBatch from '@/models/WorkshopCertificateBatch'

import WorkshopCertificateIssue from '@/models/WorkshopCertificateIssue'

import {
  generateWorkshopCertNumber,
} from '@/lib/workshop'

import {
  renderWorkshopCertificatePdf,
} from '@/lib/workshopCertificatePdf'

export async function POST(
  req: NextRequest
) {
  try {
    const {
      code,
      fullName,
    } = await req.json()

    // --------------------------------------------------------
    // Validate request
    // --------------------------------------------------------

    if (
      !code?.trim() ||
      !fullName?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Code and full name are required',
        },
        {
          status: 400,
        }
      )
    }

    await connectDB()

    // --------------------------------------------------------
    // Find active certificate batch
    // --------------------------------------------------------

    const batch =
      await WorkshopCertificateBatch.findOne(
        {
          code: code.trim(),

          isActive: true,
        }
      )

    if (!batch) {
      return NextResponse.json(
        {
          error:
            'Invalid or inactive code',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // Generate certificate details
    // --------------------------------------------------------

    const certificateNumber =
      generateWorkshopCertNumber()

    const issuedAt =
      new Date()

    const cleanFullName =
      fullName.trim()

    // --------------------------------------------------------
    // DEBUG — useful while testing
    // --------------------------------------------------------

    console.log(
      'Generating workshop certificate:',
      {
        batchId:
          batch._id.toString(),

        title:
          batch.title,

        certificateOutcomes:
          batch.certificateOutcomes ||
          [],
      }
    )

    // --------------------------------------------------------
    // Record certificate issue
    // --------------------------------------------------------

    await WorkshopCertificateIssue.create(
      {
        batchId:
          batch._id,

        fullName:
          cleanFullName,

        certificateNumber,

        issuedAt,
      }
    )

    // --------------------------------------------------------
    // Generate PDF
    // --------------------------------------------------------

    const pdfBuffer =
      await renderWorkshopCertificatePdf(
        {
          fullName:
            cleanFullName,

          workshopTitle:
            batch.title,

          certificateOutcomes:
            batch.certificateOutcomes ||
            [],

          logoUrl:
            batch.logoUrl,

          signatureUrl:
            batch.signatureUrl,

          convenerName:
            batch.convenerName,

          certificateNumber,

          issuedAt,
        }
      )

    // --------------------------------------------------------
    // Return PDF
    // --------------------------------------------------------

    const pdfData =
      new Uint8Array(
        pdfBuffer
      )

    return new NextResponse(
      pdfData,
      {
        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="${certificateNumber}.pdf"`,

          'Cache-Control':
            'no-store',
        },
      }
    )
  } catch (error: any) {
    console.error(
      'Workshop certificate download error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to generate certificate',
      },
      {
        status: 500,
      }
    )
  }
}