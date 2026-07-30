// app/api/admin/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Tutor from '@/models/Tutor';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Admin from '@/models/Admin';
import Course from '@/models/Course';
import Certificate from '@/models/Certificate';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await Admin.findOne({ userId: token.id });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Admin account deactivated' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      totalTutors,
      pendingTutors,
      activeEnrollments,
      expiringEnrollments,
      totalCourses,
      pendingPayments,
      certificatesIssued,
    ] = await Promise.all([
      Student.countDocuments(),
      Tutor.countDocuments({ status: 'approved' }),
      Tutor.countDocuments({ status: 'pending' }),
      Enrollment.countDocuments({ status: 'active' }),
      Enrollment.countDocuments({ status: 'active', endDate: { $gte: now, $lte: fiveDaysFromNow } }),
      Course.countDocuments({ isActive: true }),
      Payment.countDocuments({ status: 'pending' }),
      Certificate.countDocuments().catch(() => 0),
      
    ]);

    // Revenue
    const successPayments = await Payment.find({ status: 'success' }).select('amount');
    const totalRevenue = successPayments.reduce((sum, p: any) => sum + (p.amount || 0), 0);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [recentPayments, previousPayments] = await Promise.all([
      Payment.find({ status: 'success', paidAt: { $gte: thirtyDaysAgo } }).select('amount'),
      Payment.find({ status: 'success', paidAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }).select('amount'),
    ]);

    const recentRevenue = recentPayments.reduce((sum, p: any) => sum + (p.amount || 0), 0);
    const previousRevenue = previousPayments.reduce((sum, p: any) => sum + (p.amount || 0), 0);
    const revenueChange = previousRevenue > 0 ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100) : 0;

    // Recent activity — collected with REAL Date objects, sorted correctly,
    // then formatted to "X ago" strings only at the very end. The previous
    // version sorted by `new Date("3 days ago")`, which is always an
    // Invalid Date — that comparison silently did nothing.
    const [recentTutors, recentEnrollments] = await Promise.all([
      Tutor.find({ status: { $in: ['approved', 'disapproved'] } }).sort({ updatedAt: -1 }).limit(10),
      Enrollment.find().sort({ createdAt: -1 }).limit(10)
        .populate('studentId', 'firstName lastName')
        .populate('courseId', 'name'),
    ]);

    type Activity = { type: string; message: string; date: Date };
    const activities: Activity[] = [];

    for (const t of recentTutors as any[]) {
      activities.push({
        type: t.status === 'approved' ? 'tutor_approved' : 'tutor_rejected',
        message: `Tutor application ${t.status === 'approved' ? 'approved' : 'rejected'}: ${t.firstName} ${t.lastName}`,
        date: t.updatedAt,
      });
    }

    for (const e of recentEnrollments as any[]) {
      const studentName = e.studentId ? `${e.studentId.firstName} ${e.studentId.lastName}` : 'A student';
      const courseName = e.courseId?.name || 'a course';
      activities.push({
        type: 'new_enrollment',
        message: `New enrollment: ${studentName} enrolled in ${courseName}`,
        date: e.createdAt,
      });
    }

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    function getTimeAgo(date: Date): string {
      const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
      const intervals: [string, number][] = [
        ['year', 31536000], ['month', 2592000], ['week', 604800],
        ['day', 86400], ['hour', 3600], ['minute', 60],
      ];
      for (const [unit, secondsInUnit] of intervals) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
      return 'just now';
    }

    const recentActivities = activities.slice(0, 10).map((a) => ({
      type: a.type,
      message: a.message,
      timeAgo: getTimeAgo(a.date),
    }));

    return NextResponse.json({
      totalStudents,
      totalTutors,
      activeEnrollments,
      expiringEnrollments,
      totalCourses,
      totalRevenue,
      revenueChange,
      pendingTutors,
      pendingPayments,
      certificatesIssued,
      recentActivities,
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}