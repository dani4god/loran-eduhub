// app/api/admin/tutors/[id]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import connectDB from '@/lib/mongodb'

import Tutor from '@/models/Tutor'
import User from '@/models/User'
import Admin from '@/models/Admin'

import { sendTutorApprovalEmail } from '@/lib/email'

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
    const token = await getToken({ req })

    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Check admin account
    const admin = await Admin.findOne({
      userId: token.id,
    })

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin account deactivated' },
        { status: 403 }
      )
    }

    // IMPORTANT: await params
    const { id, action } = await context.params

    // Find tutor
    const tutor = await Tutor.findById(id).populate('userId')

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    const body = await req.json().catch(() => ({}))

    let newStatus: 'approved' | 'disapproved' | 'suspended' | 'paused' = tutor.status as any
    let message = ''

    switch (action) {
      case 'approve': {
        // Check if course IDs were provided
        const { courseIds } = body
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
          return NextResponse.json(
            { error: 'Select at least one course to assign this tutor before approving' },
            { status: 400 }
          )
        }

        // Only allow assigning courses the tutor actually applied for —
        // prevents an admin from accidentally approving a tutor for a
        // subject they never claimed to teach.
        const appliedCourseIds = tutor.courses.map((c: any) => c.toString())
        const invalid = courseIds.find((cid: string) => !appliedCourseIds.includes(cid))
        if (invalid) {
          return NextResponse.json(
            { error: 'One or more selected courses were not part of this tutor\'s application' },
            { status: 400 }
          )
        }

        // Update tutor's courses to only the approved ones
        tutor.courses = courseIds
        newStatus = 'approved'
        message = 'Tutor application approved successfully'
        
        // Activate user account
        await User.findByIdAndUpdate(tutor.userId, {
          isActive: true,
        })
        break
      }

      case 'disapprove':
        newStatus = 'disapproved'
        message = 'Tutor application rejected'
        await User.findByIdAndUpdate(tutor.userId, {
          isActive: false,
        })
        break

      case 'suspend':
        newStatus = 'suspended'
        message = 'Tutor account suspended'
        await User.findByIdAndUpdate(tutor.userId, {
          isActive: false,
        })
        break

      case 'pause':
        newStatus = 'paused'
        message = 'Tutor account paused'
        await User.findByIdAndUpdate(tutor.userId, {
          isActive: false,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update tutor status
    tutor.status = newStatus
    await tutor.save()

    // Send email for approval/disapproval only
    if (newStatus === 'approved' || newStatus === 'disapproved') {
      await sendTutorApprovalEmail(
        tutor.email,
        `${tutor.firstName} ${tutor.lastName}`,
        newStatus
      )
    }

    return NextResponse.json({
      success: true,
      message,
      status: newStatus,
      courses: tutor.courses,
    })

  } catch (error: any) {
    console.error('Admin tutor action error:', error)

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    )
  }
}