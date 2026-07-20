// app/api/auth/register/tutor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Tutor from '@/models/Tutor';
import Course from '@/models/Course';
import { sendTutorApplicationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      bio,
      qualifications,
      courses,
      profileImage,
      resume,
      videoLink,
      password,
      confirmPassword,
      pricing, // { monthly, threeMonths, sixMonths, oneYear }
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !bio || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Validate qualifications
    if (!qualifications || qualifications.length === 0) {
      return NextResponse.json(
        { error: 'At least one qualification is required' },
        { status: 400 }
      );
    }

    // Validate courses
    if (!courses || courses.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one course you can teach' },
        { status: 400 }
      );
    }

    // Verify courses exist in database
    const validCourses = await Course.find({ _id: { $in: courses } });
    if (validCourses.length !== courses.length) {
      return NextResponse.json(
        { error: 'One or more selected courses are invalid' },
        { status: 400 }
      );
    }

    // Validate video link
    if (!videoLink) {
      return NextResponse.json(
        { error: 'Please provide a video introduction link' },
        { status: 400 }
      );
    }

    // Validate pricing — all four plans required, each must be a positive number
    if (
      !pricing ||
      typeof pricing.monthly !== 'number' || pricing.monthly <= 0 ||
      typeof pricing.threeMonths !== 'number' || pricing.threeMonths <= 0 ||
      typeof pricing.sixMonths !== 'number' || pricing.sixMonths <= 0 ||
      typeof pricing.oneYear !== 'number' || pricing.oneYear <= 0
    ) {
      return NextResponse.json(
        { error: 'Please set a price greater than 0 for all four plans (monthly, 3 months, 6 months, 1 year)' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`;

    // Create user - Let the model hash the password via middleware
    const user = await User.create({
      email: email.toLowerCase(),
      password: password, // Don't hash here, let the pre-save middleware handle it
      role: 'tutor',
      isActive: true,
      emailVerified: false, // Will be verified later
    });

    // Create tutor profile
    const tutor = await Tutor.create({
      userId: user._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      bio,
      qualifications,
      courses,
      profileImage: profileImage || null,
      resume: resume || null,
      videoLink: videoLink || null,
      status: 'pending',
      slug,
      pricing: {
        monthly: pricing.monthly,
        threeMonths: pricing.threeMonths,
        sixMonths: pricing.sixMonths,
        oneYear: pricing.oneYear,
      },
    });

    // Send email notification to admin
    await sendTutorApplicationEmail({
      tutorName: `${firstName} ${lastName}`,
      tutorEmail: email,
      tutorId: tutor._id.toString(),
      qualifications,
      courses: validCourses.map(c => c.name),
      videoLink,
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        tutorId: tutor._id,
        status: tutor.status,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Tutor registration error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}