// app/api/exam-prep/register/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import crypto from 'crypto'

import connectDB from '@/lib/mongodb'

import ExamPrepStudent from '@/models/ExamPrepStudent'
import ExamPrepSubscription from '@/models/ExamPrepSubscription'
import ExamPrepSettings from '@/models/ExamPrepSettings'

import {
  canonicalExamPrepSubject,
} from '@/lib/examPrepCatalog'

import {
  hashExamPrepPin,
  issueExamPrepSession,
  setExamPrepSessionCookie,
  validateExamPrepPin,
} from '@/lib/examPrepAuth'

// ============================================================
// HELPERS
// ============================================================

function makeRegNumber() {
  return `LEP-${new Date().getFullYear()}-${crypto
    .randomBytes(4)
    .toString('hex')
    .slice(0, 6)
    .toUpperCase()}`
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json()

    const {
      fullName,
      email,
      location,
      school,
      subjectsInterested = [],
      pin,
    } = body

    // ========================================================
    // VALIDATION
    // ========================================================

    const cleanFullName =
      String(
        fullName || ''
      ).trim()

    const normalizedEmail =
      String(
        email || ''
      )
        .trim()
        .toLowerCase()

    const cleanLocation =
      String(
        location || ''
      ).trim()

    const cleanSchool =
      String(
        school || ''
      ).trim()

    if (
      !cleanFullName ||
      !normalizedEmail ||
      !cleanLocation ||
      !cleanSchool
    ) {
      return NextResponse.json(
        {
          error:
            'Full name, email, location and school are required.',
        },
        {
          status:
            400,
        }
      )
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Enter a valid email address.',
        },
        {
          status:
            400,
        }
      )
    }

    if (
      !validateExamPrepPin(
        pin
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Create a 6-digit PIN.',
        },
        {
          status:
            400,
        }
      )
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // DUPLICATE EMAIL
    // ========================================================

    const existingStudent =
      await ExamPrepStudent.exists({
        email:
          normalizedEmail,
      })

    if (
      existingStudent
    ) {
      return NextResponse.json(
        {
          error:
            'This email is already registered.',
        },
        {
          status:
            409,
        }
      )
    }

    // ========================================================
    // REGISTRATION NUMBER
    // ========================================================

    let regNumber =
      makeRegNumber()

    while (
      await ExamPrepStudent.exists({
        regNumber,
      })
    ) {
      regNumber =
        makeRegNumber()
    }

    // ========================================================
    // SUBJECTS
    // ========================================================

    const cleanSubjects:
      string[] =
      Array.from(
        new Set(
          (
            Array.isArray(
              subjectsInterested
            )
              ? subjectsInterested
              : []
          )
            .map(
              (
                subject:
                  unknown
              ) =>
                canonicalExamPrepSubject(
                  String(
                    subject
                  )
                )
            )
            .filter(
              (
                subject
              ): subject is string =>
                typeof subject ===
                  'string' &&
                Boolean(
                  subject
                )
            )
        )
      )

    // ========================================================
    // SETTINGS
    // ========================================================

    const settings =
      await ExamPrepSettings.findOneAndUpdate(
        {
          key:
            'global',
        },
        {
          $setOnInsert: {
            key:
              'global',
          },
        },
        {
          upsert:
            true,
          new:
            true,
        }
      )

    const requiresPayment =
      Boolean(
        settings?.isPaid
      )

    // ========================================================
    // CREATE STUDENT
    // ========================================================

    const student =
      await ExamPrepStudent.create({
        regNumber,

        fullName:
          cleanFullName,

        email:
          normalizedEmail,

        location:
          cleanLocation,

        school:
          cleanSchool,

        subjectsInterested:
          cleanSubjects,

        authPinHash:
          await hashExamPrepPin(
            String(
              pin
            )
          ),

        lastLoginAt:
          new Date(),
      })

    // ========================================================
    // SUBSCRIPTION RECORD
    // ========================================================

    await ExamPrepSubscription.create({
      examPrepStudentId:
        student._id,

      /*
       * If Exam Prep was free at registration, this student
       * retains the free-registration access rule currently
       * supported by requireExamPrepAccess().
       *
       * If it was paid, they must subscribe.
       */
      wasFreeAtRegistration:
        !requiresPayment,
    })

    // ========================================================
    // LOGIN SESSION
    // ========================================================

    const session =
      await issueExamPrepSession(
        String(
          student._id
        ),
        req.headers.get(
          'user-agent'
        )
      )

    // ========================================================
    // REDIRECT DESTINATION
    // ========================================================

    const redirectTo =
      requiresPayment
        ? '/exam-prep/dashboard/subscription'
        : '/exam-prep/dashboard'

    const response =
      NextResponse.json(
        {
          success:
            true,

          regNumber:
            student.regNumber,

          requiresPayment,

          redirectTo,
        },
        {
          status:
            201,
        }
      )

    setExamPrepSessionCookie(
      response,
      session.rawToken,
      session.expiresAt
    )

    return response
  } catch (
    error:
      unknown
  ) {
    console.error(
      'Exam Prep register:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Registration failed.',
      },
      {
        status:
          500,
      }
    )
  }
}