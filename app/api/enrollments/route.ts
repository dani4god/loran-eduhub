// app/api/enrollments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import { authOptions } from '@/lib/auth';

// GET: Fetch enrollments for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const tutorId = searchParams.get('tutorId');

    let query = {};
    if (studentId) query = { studentId };
    if (tutorId) query = { tutorId };

    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'firstName lastName email')
      .populate('tutorId', 'firstName lastName email')
      .populate('courseId', 'name description')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST: Create a new enrollment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { studentId, tutorId, courseId, plan, startDate, endDate, amount } = body;

    // Validate required fields
    if (!studentId || !tutorId || !courseId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const enrollment = await Enrollment.create({
      studentId,
      tutorId,
      courseId,
      plan,
      status: 'pending',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      amount: amount || 0,
    });

    return NextResponse.json(
      { success: true, enrollment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    );
  }
}