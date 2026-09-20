import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  getToken,
} from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import Tutor from '@/models/Tutor'
import User from '@/models/User'
import Admin from '@/models/Admin'

import {
  sendTutorApprovalEmail,
} from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
      action: string
    }>
  }
) {
  try {
    // ========================================================
    // AUTHENTICATION
    // ========================================================

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
          status:
            401,
        }
      )
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB()

    // ========================================================
    // CHECK ADMIN ACCOUNT
    // ========================================================

    const admin =
      await Admin.findOne({
        userId:
          token.id,
      })

    if (
      !admin ||
      !admin.isActive
    ) {
      return NextResponse.json(
        {
          error:
            'Admin account deactivated',
        },
        {
          status:
            403,
        }
      )
    }

    // ========================================================
    // PARAMS
    // ========================================================

    const {
      id,
      action,
    } =
      await context.params

    // ========================================================
    // FIND TUTOR
    // ========================================================

    const tutor =
      await Tutor
        .findById(
          id
        )
        .populate(
          'userId'
        )

    if (
      !tutor
    ) {
      return NextResponse.json(
        {
          error:
            'Tutor not found',
        },
        {
          status:
            404,
        }
      )
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      await req
        .json()
        .catch(
          () => ({})
        )

    let newStatus:
      | 'approved'
      | 'disapproved'
      | 'suspended'
      | 'paused' =
      tutor.status as any

    let message =
      ''

    let sendDecisionEmail =
      false

    // ========================================================
    // ACTION
    // ========================================================

    switch (
      action
    ) {
      // ======================================================
      // INITIAL APPROVAL
      // ======================================================

      case 'approve': {
        /*
         * This action is ONLY for approving a new/pending
         * tutor application.
         *
         * Course selection is therefore required.
         */

        if (
          tutor.status !==
          'pending'
        ) {
          return NextResponse.json(
            {
              error:
                'Only pending tutor applications can be approved. Use reactivate for a suspended tutor.',
            },
            {
              status:
                400,
            }
          )
        }

        const {
          courseIds,
        } =
          body

        if (
          !Array.isArray(
            courseIds
          ) ||
          courseIds.length ===
            0
        ) {
          return NextResponse.json(
            {
              error:
                'Select at least one course to assign this tutor before approving',
            },
            {
              status:
                400,
            }
          )
        }

        // ====================================================
        // VALIDATE COURSES
        // ====================================================

        /*
         * Only allow the admin to approve courses that were
         * part of the tutor's application.
         */

        const appliedCourseIds =
          (
            tutor.courses ||
            []
          ).map(
            (
              course:
                any
            ) =>
              course.toString()
          )

        const invalidCourse =
          courseIds.find(
            (
              courseId:
                string
            ) =>
              !appliedCourseIds.includes(
                courseId
              )
          )

        if (
          invalidCourse
        ) {
          return NextResponse.json(
            {
              error:
                'One or more selected courses were not part of this tutor\'s application',
            },
            {
              status:
                400,
            }
          )
        }

        // Keep only courses approved by admin.
        tutor.courses =
          courseIds

        newStatus =
          'approved'

        message =
          'Tutor application approved successfully'

        sendDecisionEmail =
          true

        // Activate tutor's login account.
        await User.findByIdAndUpdate(
          tutor.userId,
          {
            isActive:
              true,
          }
        )

        break
      }

      // ======================================================
      // REACTIVATE SUSPENDED / PAUSED TUTOR
      // ======================================================

      case 'reactivate': {
        /*
         * Reactivation is different from initial approval.
         *
         * The tutor has already been approved previously and
         * already has assigned courses.
         *
         * Therefore:
         *
         * - Do NOT require courseIds
         * - Do NOT overwrite tutor.courses
         * - Keep existing course assignments
         * - Restore approved status
         * - Reactivate login account
         */

        if (
          tutor.status !==
            'suspended' &&
          tutor.status !==
            'paused'
        ) {
          return NextResponse.json(
            {
              error:
                'Only suspended or paused tutors can be reactivated',
            },
            {
              status:
                400,
            }
          )
        }

        newStatus =
          'approved'

        message =
          'Tutor account reactivated successfully'

        await User.findByIdAndUpdate(
          tutor.userId,
          {
            isActive:
              true,
          }
        )

        break
      }

      // ======================================================
      // DISAPPROVE
      // ======================================================

      case 'disapprove': {
        newStatus =
          'disapproved'

        message =
          'Tutor application rejected'

        sendDecisionEmail =
          true

        await User.findByIdAndUpdate(
          tutor.userId,
          {
            isActive:
              false,
          }
        )

        break
      }

      // ======================================================
      // SUSPEND
      // ======================================================

      case 'suspend': {
        if (
          tutor.status ===
          'suspended'
        ) {
          return NextResponse.json(
            {
              error:
                'Tutor account is already suspended',
            },
            {
              status:
                400,
            }
          )
        }

        newStatus =
          'suspended'

        message =
          'Tutor account suspended'

        await User.findByIdAndUpdate(
          tutor.userId,
          {
            isActive:
              false,
          }
        )

        break
      }

      // ======================================================
      // PAUSE
      // ======================================================

      case 'pause': {
        if (
          tutor.status ===
          'paused'
        ) {
          return NextResponse.json(
            {
              error:
                'Tutor account is already paused',
            },
            {
              status:
                400,
            }
          )
        }

        newStatus =
          'paused'

        message =
          'Tutor account paused'

        await User.findByIdAndUpdate(
          tutor.userId,
          {
            isActive:
              false,
          }
        )

        break
      }

      // ======================================================
      // INVALID ACTION
      // ======================================================

      default: {
        return NextResponse.json(
          {
            error:
              'Invalid action',
          },
          {
            status:
              400,
          }
        )
      }
    }

    // ========================================================
    // SAVE TUTOR STATUS
    // ========================================================

    tutor.status =
      newStatus

    await tutor.save()

    // ========================================================
    // EMAIL
    // ========================================================

    /*
     * Approval/rejection emails belong to the application
     * process.
     *
     * Reactivating a previously approved tutor should not
     * accidentally send the original "application approved"
     * email again.
     */

    if (
      sendDecisionEmail &&
      (
        newStatus ===
          'approved' ||
        newStatus ===
          'disapproved'
      )
    ) {
      await sendTutorApprovalEmail(
        tutor.email,
        `${tutor.firstName} ${tutor.lastName}`,
        newStatus
      )
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      message,

      status:
        newStatus,

      courses:
        tutor.courses,
    })
  } catch (
    error:
      any
  ) {
    console.error(
      'Admin tutor action error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not update tutor account',
      },
      {
        status:
          500,
      }
    )
  }
}