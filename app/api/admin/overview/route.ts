// app/api/admin/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Tutor from '@/models/Tutor';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Admin from '@/models/Admin';

interface TokenPayload {
  id: string;
  role: string;
  [key: string]: any;
}

interface PaymentDoc {
  amount: number;
  status: string;
  paidAt?: Date;
  [key: string]: any;
}

interface TutorDoc {
  status: string;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface StudentPop {
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

interface CoursePop {
  name?: string;
  [key: string]: any;
}

interface EnrollmentDoc {
  createdAt: Date;
  studentId?: StudentPop | string;
  courseId?: CoursePop | string;
  [key: string]: any;
}

interface AdminDoc {
  userId: string;
  isActive: boolean;
  [key: string]: any;
}

export async function GET(req: NextRequest) {
  try {
    const token = (await getToken({ req })) as TokenPayload | null;
    
    // Check authentication and admin role
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if admin is active
    const admin = (await Admin.findOne({ userId: token.id })) as AdminDoc | null;
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Admin account deactivated' }, { status: 403 });
    }
    
    await connectDB();
    
    // Get statistics
    const [totalStudents, totalTutors, activeEnrollments, payments] = await Promise.all([
      Student.countDocuments(),
      Tutor.countDocuments({ status: 'approved' }),
      Enrollment.countDocuments({ status: 'active' }),
      Payment.find({ status: 'success' }),
    ]);
    
    // Calculate total revenue
    const totalRevenue = (payments as PaymentDoc[]).reduce((sum: number, p: PaymentDoc) => sum + (p.amount || 0), 0);
    
    // Calculate revenue change (compare last 30 days with previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const recentPayments = (await Payment.find({
      status: 'success',
      paidAt: { $gte: thirtyDaysAgo },
    })) as PaymentDoc[];
    
    const previousPayments = (await Payment.find({
      status: 'success',
      paidAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    })) as PaymentDoc[];
    
    const recentRevenue = (recentPayments as PaymentDoc[]).reduce((sum: number, p: PaymentDoc) => sum + (p.amount || 0), 0);
    const previousRevenue = (previousPayments as PaymentDoc[]).reduce((sum: number, p: PaymentDoc) => sum + (p.amount || 0), 0);
    
    let revenueChange = 0;
    if (previousRevenue > 0) {
      revenueChange = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    }
    
    // Get pending tutors
    const pendingTutors = await Tutor.countDocuments({ status: 'pending' });
    
    // Get pending payments
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    
    // Get recent activities
    const recentTutors = (await Tutor.find({ status: { $in: ['approved', 'disapproved'] } })) as TutorDoc[];
    // fetch and sort/populate in original chain
    // re-run query to preserve chaining
    const recentTutorsFull = await Tutor.find({ status: { $in: ['approved', 'disapproved'] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('userId', 'email') as TutorDoc[];
    
    const recentEnrollments = (await Enrollment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'firstName lastName')
      .populate('courseId', 'name')) as EnrollmentDoc[];
    
    const recentActivities = [
      ...recentTutorsFull.map((t: TutorDoc) => ({
        type: t.status === 'approved' ? 'tutor_approved' : 'tutor_rejected',
        message: `Tutor application ${t.status === 'approved' ? 'approved' : 'rejected'}: ${t.firstName} ${t.lastName}`,
        timeAgo: getTimeAgo(t.updatedAt),
      })),
      ...recentEnrollments.map(e => ({
        type: 'new_enrollment',
        message: `New enrollment: ${typeof e.studentId === 'object' ? e.studentId?.firstName : ''} ${typeof e.studentId === 'object' ? e.studentId?.lastName : ''} enrolled in ${typeof e.courseId === 'object' ? e.courseId?.name : ''}`,
        timeAgo: getTimeAgo(e.createdAt),
      })),
    ].sort((a, b) => new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()).slice(0, 10);
    
    return NextResponse.json({
      totalStudents,
      totalTutors,
      activeEnrollments,
      totalRevenue,
      revenueChange: Math.round(revenueChange),
      pendingTutors,
      pendingPayments,
      recentActivities,
    });
    
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'just now';
}