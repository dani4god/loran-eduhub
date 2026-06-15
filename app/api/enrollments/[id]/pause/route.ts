// app/api/enrollments/[id]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import { authOptions } from '@/lib/auth';

// ✅ Fix: params must be a Promise and awaited
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Await the params Promise
    const { id } = await params;

    await dbConnect();

    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      {
        status: 'paused',
        pausedAt: new Date(),
        pausedBy: 'tutor',
      },
      { new: true }
    );

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error pausing enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to pause enrollment' },
      { status: 500 }
    );
  }
}