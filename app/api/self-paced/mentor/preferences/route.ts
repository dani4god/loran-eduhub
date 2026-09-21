// app/api/self-paced/mentor/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'

import {
  isValidWhatsAppPhone,
  normalizeWhatsAppPhone,
} from '@/lib/whatsapp'

import SelfPacedStudent from '@/models/SelfPacedStudent'
import SelfPacedMentorPreference from '@/models/SelfPacedMentorPreference'

// ============================================================
// TYPES
// ============================================================

interface UpdateMentorPreferenceBody {
  enabled?: boolean

  whatsappPhone?: string

  studyReminders?: boolean
  progressMessages?: boolean
  assessmentSupport?: boolean
  feedbackRequests?: boolean

  preferredTime?: string
  timezone?: string
}

// ============================================================
// TIME VALIDATION
// ============================================================

function isValidTime(
  value: string
): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    value
  )
}

// ============================================================
// GET PREFERENCES
// ============================================================

export async function GET() {
  try {
    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const session =
      await getServerSession(
        authOptions
      )

    if (
      !session ||
      session.user.role !==
        'selfpaced_student'
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

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    await connectDB()

    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    const student =
      await SelfPacedStudent.findOne({
        userId: session.user.id,
      })

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Self-paced student profile not found.',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // EXISTING PREFERENCE
    // --------------------------------------------------------

    const preference =
      await SelfPacedMentorPreference.findOne({
        selfPacedStudentId:
          student._id,
      }).lean()

    // --------------------------------------------------------
    // DEFAULT PHONE
    // --------------------------------------------------------

    let defaultPhone = ''

    if (student.phone) {
      const normalized =
        normalizeWhatsAppPhone(
          student.phone
        )

      if (
        isValidWhatsAppPhone(
          normalized
        )
      ) {
        defaultPhone = normalized
      }
    }

    // --------------------------------------------------------
    // NO PREFERENCE YET
    // --------------------------------------------------------

    if (!preference) {
      return NextResponse.json({
        preference: {
          enabled: false,

          whatsappPhone:
            defaultPhone,

          consentGiven: false,

          consentGivenAt: null,

          studyReminders: true,

          progressMessages: true,

          assessmentSupport: true,

          feedbackRequests: true,

          preferredTime: '18:00',

          timezone:
            'Africa/Lagos',
        },
      })
    }

    // --------------------------------------------------------
    // RETURN SAVED PREFERENCE
    // --------------------------------------------------------

    return NextResponse.json({
      preference: {
        enabled:
          preference.enabled,

        whatsappPhone:
          preference.whatsappPhone,

        consentGiven:
          preference.consentGiven,

        consentGivenAt:
          preference.consentGivenAt ??
          null,

        studyReminders:
          preference.studyReminders,

        progressMessages:
          preference.progressMessages,

        assessmentSupport:
          preference.assessmentSupport,

        feedbackRequests:
          preference.feedbackRequests,

        preferredTime:
          preference.preferredTime,

        timezone:
          preference.timezone,
      },
    })
  } catch (error) {
    console.error(
      'Failed to load mentor preferences:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to load WhatsApp mentor settings.',
      },
      {
        status: 500,
      }
    )
  }
}

// ============================================================
// PUT PREFERENCES
// ============================================================

export async function PUT(
  request: NextRequest
) {
  try {
    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const session =
      await getServerSession(
        authOptions
      )

    if (
      !session ||
      session.user.role !==
        'selfpaced_student'
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

    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    const body =
      (await request.json()) as
        UpdateMentorPreferenceBody

    const enabled =
      body.enabled === true

    const studyReminders =
      body.studyReminders !==
      false

    const progressMessages =
      body.progressMessages !==
      false

    const assessmentSupport =
      body.assessmentSupport !==
      false

    const feedbackRequests =
      body.feedbackRequests !==
      false

    const preferredTime =
      typeof body.preferredTime ===
      'string'
        ? body.preferredTime.trim()
        : '18:00'

    const timezone =
      typeof body.timezone ===
        'string' &&
      body.timezone.trim()
        ? body.timezone.trim()
        : 'Africa/Lagos'

    const rawPhone =
      typeof body.whatsappPhone ===
      'string'
        ? body.whatsappPhone.trim()
        : ''

    // --------------------------------------------------------
    // VALIDATE TIME
    // --------------------------------------------------------

    if (
      !isValidTime(
        preferredTime
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Preferred time must use HH:MM format.',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    await connectDB()

    // --------------------------------------------------------
    // STUDENT
    // --------------------------------------------------------

    const student =
      await SelfPacedStudent.findOne({
        userId: session.user.id,
      })

    if (!student) {
      return NextResponse.json(
        {
          error:
            'Self-paced student profile not found.',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // EXISTING PREFERENCE
    // --------------------------------------------------------

    const existingPreference =
      await SelfPacedMentorPreference.findOne({
        selfPacedStudentId:
          student._id,
      })

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    let phoneSource =
      rawPhone

    if (
      !phoneSource &&
      existingPreference
        ?.whatsappPhone
    ) {
      phoneSource =
        existingPreference.whatsappPhone
    }

    if (
      !phoneSource &&
      student.phone
    ) {
      phoneSource =
        student.phone
    }

    const normalizedPhone =
      phoneSource
        ? normalizeWhatsAppPhone(
            phoneSource
          )
        : ''

    /*
     * A phone number is required when mentoring is enabled.
     *
     * A disabled preference can still be saved without
     * a phone number.
     */
    if (
      enabled &&
      !normalizedPhone
    ) {
      return NextResponse.json(
        {
          error:
            'Enter the WhatsApp number you want Loran Mentor to use.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      normalizedPhone &&
      !isValidWhatsAppPhone(
        normalizedPhone
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Enter a valid WhatsApp phone number including the country code.',
        },
        {
          status: 400,
        }
      )
    }

    // --------------------------------------------------------
    // PREVENT NUMBER COLLISION
    // --------------------------------------------------------

    if (normalizedPhone) {
      const numberOwner =
        await SelfPacedMentorPreference.findOne({
          whatsappPhone:
            normalizedPhone,

          selfPacedStudentId: {
            $ne: student._id,
          },
        })
          .select('_id')
          .lean()

      if (numberOwner) {
        return NextResponse.json(
          {
            error:
              'This WhatsApp number is already connected to another self-paced student.',
          },
          {
            status: 409,
          }
        )
      }
    }

    // --------------------------------------------------------
    // CONSENT STATE
    // --------------------------------------------------------

    const now = new Date()

    let consentGiven =
      existingPreference
        ?.consentGiven ?? false

    let consentGivenAt =
      existingPreference
        ?.consentGivenAt

    let consentRevokedAt =
      existingPreference
        ?.consentRevokedAt

    /*
     * Turning mentoring ON is the student's explicit
     * opt-in action.
     */
    if (
      enabled &&
      !consentGiven
    ) {
      consentGiven = true
      consentGivenAt = now
      consentRevokedAt =
        undefined
    }

    /*
     * Turning mentoring OFF revokes permission for
     * automated mentoring.
     */
    if (
      !enabled &&
      existingPreference?.enabled
    ) {
      consentGiven = false
      consentRevokedAt = now
    }

    // --------------------------------------------------------
    // UPSERT
    // --------------------------------------------------------

    const preference =
      await SelfPacedMentorPreference.findOneAndUpdate(
        {
          selfPacedStudentId:
            student._id,
        },

        {
          $set: {
            enabled,

            whatsappPhone:
              normalizedPhone,

            consentGiven,

            consentGivenAt,

            consentRevokedAt,

            studyReminders,

            progressMessages,

            assessmentSupport,

            feedbackRequests,

            preferredTime,

            timezone,
          },
        },

        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      )

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,

      message: enabled
        ? 'WhatsApp mentoring is now enabled.'
        : 'WhatsApp mentoring settings saved.',

      preference: {
        enabled:
          preference.enabled,

        whatsappPhone:
          preference.whatsappPhone,

        consentGiven:
          preference.consentGiven,

        consentGivenAt:
          preference.consentGivenAt ??
          null,

        studyReminders:
          preference.studyReminders,

        progressMessages:
          preference.progressMessages,

        assessmentSupport:
          preference.assessmentSupport,

        feedbackRequests:
          preference.feedbackRequests,

        preferredTime:
          preference.preferredTime,

        timezone:
          preference.timezone,
      },
    })
  } catch (error) {
    console.error(
      'Failed to save mentor preferences:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to save WhatsApp mentor settings.',
      },
      {
        status: 500,
      }
    )
  }
}