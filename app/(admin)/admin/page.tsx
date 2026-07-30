// app/(admin)/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, AlertCircle, Ticket, ScrollText, BookMarked,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface DashboardStats {
  totalStudents: number;
  totalTutors: number;
  activeEnrollments: number;
  expiringEnrollments: number;
  totalCourses: number;
  totalRevenue: number;
  revenueChange: number;
  pendingTutors: number;
  pendingPayments: number;
  certificatesIssued: number;
  openTickets: number;
  recentActivities: any[];
}

function StatCard({ icon: Icon, label, value, color, sub, href }: any) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-4 hover:shadow-sm transition-all">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-lg sm:text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/admin/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/unauthorized');
    if (status === 'authenticated' && session?.user?.role === 'admin') fetchDashboardData();
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok) setStats(data);
      else toast.error(data.error || 'Failed to load dashboard');
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-80">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (session?.user?.role !== 'admin') return null;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back to your admin panel</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard icon={Users} label="Total Students" value={stats?.totalStudents ?? 0} color="bg-blue-50 text-blue-600" href="/admin/students" />
          <StatCard icon={GraduationCap} label="Total Tutors" value={stats?.totalTutors ?? 0} color="bg-purple-50 text-purple-600" sub={`${stats?.pendingTutors ?? 0} pending`} href="/admin/tutors" />
          <StatCard icon={BookOpen} label="Active Enrollments" value={stats?.activeEnrollments ?? 0} color="bg-green-50 text-green-600" sub={`${stats?.expiringEnrollments ?? 0} expiring soon`} href="/admin/enrollments" />
          <StatCard icon={DollarSign} label="Total Revenue" value={`₦${(stats?.totalRevenue ?? 0).toLocaleString()}`} color="bg-yellow-50 text-yellow-600" />
          <StatCard icon={BookMarked} label="Active Courses" value={stats?.totalCourses ?? 0} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={ScrollText} label="Certificates Issued" value={stats?.certificatesIssued ?? 0} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Ticket} label="Open Tickets" value={stats?.openTickets ?? 0} color="bg-orange-50 text-orange-600" href="/admin/tickets" />
          <StatCard icon={AlertCircle} label="Pending Payments" value={stats?.pendingPayments ?? 0} color="bg-red-50 text-red-600" href="/admin/payments" />
        </div>

        {/* Revenue trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (last 30 days)</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {stats?.revenueChange && stats.revenueChange !== 0 ? (
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenueChange > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    {stats.revenueChange > 0 ? '+' : ''}{stats.revenueChange}% vs previous 30 days
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">No change vs previous 30 days</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pending approvals */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Needs Attention</h2>
            <div className="space-y-2.5">
              <Link href="/admin/tutors" className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tutor Applications</p>
                    <p className="text-xs text-gray-500">{stats?.pendingTutors ?? 0} pending</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/payments" className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pending Payments</p>
                    <p className="text-xs text-gray-500">{stats?.pendingPayments ?? 0} pending</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/tickets" className="flex items-center justify-between p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Support Tickets</p>
                    <p className="text-xs text-gray-500">{stats?.openTickets ?? 0} open</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
            <div className="space-y-1">
              {stats?.recentActivities?.map((activity, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                  {activity.type === 'tutor_approved' && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                  {activity.type === 'tutor_rejected' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  {activity.type === 'new_enrollment' && <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-700 truncate">{activity.message}</p>
                    <p className="text-[10px] text-gray-400">{activity.timeAgo}</p>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                <p className="text-gray-400 text-center py-8 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}