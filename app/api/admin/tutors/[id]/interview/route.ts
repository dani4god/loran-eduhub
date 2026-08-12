import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import connectDB from '@/lib/mongodb'
import Tutor from '@/models/Tutor'
import Admin from '@/models/Admin'
import InterviewInvite from '@/models/InterviewInvite'
import { buildInterviewInviteHtml } from '@/lib/interviewInvite'
import { sendInterviewInviteEmail } from '@/lib/email'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params

    // Authenticate admin
    const token = await getToken({ req })

    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Verify admin account
    const admin = await Admin.findOne({
      userId: token.id,
    })

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: 'Admin account deactivated' },
        { status: 403 }
      )
    }

    // Parse request body
    let body: {
      scheduledDate?: string
      venue?: string
      meetingLink?: string | null
      hrName?: string
    }

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const {
      scheduledDate,
      venue,
      meetingLink,
      hrName,
    } = body

    // Validate required fields
    if (
      !scheduledDate ||
      !venue?.trim() ||
      !hrName?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Date, venue, and HR team member name are required',
        },
        { status: 400 }
      )
    }

    // Find tutor
    const tutor = await Tutor.findById(id)
      .populate('courses', 'name')

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      )
    }

    if (!tutor.email) {
      return NextResponse.json(
        { error: 'Tutor does not have an email address' },
        { status: 400 }
      )
    }

    // Validate date
    const parsedDate = new Date(scheduledDate)

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time' },
        { status: 400 }
      )
    }

    // Get tutor courses safely
    const courseNames = Array.isArray(tutor.courses)
      ? (tutor.courses as any[])
          .map((course) => course?.name)
          .filter(Boolean)
      : []

    // Build interview email
    const html = buildInterviewInviteHtml({
      tutorFirstName: tutor.firstName,
      tutorLastName: tutor.lastName,
      courseNames,
      scheduledDate: parsedDate,
      venue: venue.trim(),
      meetingLink: meetingLink?.trim() || undefined,
      hrName: hrName.trim(),
    })

    // Send email to the tutor
    await sendInterviewInviteEmail(
      tutor.email,
      html
    )

    // Save interview invitation
    const interviewInvite = await InterviewInvite.create({
      tutorId: tutor._id,
      scheduledDate: parsedDate,
      venue: venue.trim(),
      meetingLink: meetingLink?.trim() || undefined,
      hrName: hrName.trim(),
      sentByAdminId: admin._id,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Interview invitation sent successfully',
        invite: {
          id: interviewInvite._id.toString(),
          tutorEmail: tutor.email,
        },
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error(
      'POST /api/admin/tutors/[id]/interview error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to schedule interview invitation',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params

    // Authenticate admin
    const token = await getToken({ req })

    if (!token || token.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const invites = await InterviewInvite.find({
      tutorId: id,
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      invites: invites.map((invite: any) => ({
        _id: invite._id.toString(),
        scheduledDate: invite.scheduledDate,
        venue: invite.venue,
        meetingLink: invite.meetingLink || null,
        hrName: invite.hrName,
        sentAt: invite.sentAt || invite.createdAt,
      })),
    })

  } catch (error: any) {
    console.error(
      'GET /api/admin/tutors/[id]/interview error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to load interview history',
      },
      { status: 500 }
    )
  }
}