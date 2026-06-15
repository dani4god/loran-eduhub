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

    let newStatus:
      | 'approved'
      | 'disapproved'
      | 'suspended' = tutor.status as any

    let message = ''

    switch (action) {
      case 'approve':
        newStatus = 'approved'
        message = 'Tutor application approved successfully'

        // Activate user account
        await User.findByIdAndUpdate(tutor.userId, {
          isActive: true,
        })

        break

      case 'disapprove':
        newStatus = 'disapproved'
        message = 'Tutor application rejected'

        // Deactivate user account
        await User.findByIdAndUpdate(tutor.userId, {
          isActive: false,
        })

        break

      case 'suspend':
        newStatus = 'suspended'
        message = 'Tutor account suspended'

        // Deactivate user account
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

    // Send email
    if (
      newStatus === 'approved' ||
      newStatus === 'disapproved'
    ) {
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