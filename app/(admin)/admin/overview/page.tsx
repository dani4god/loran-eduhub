// app/(admin)/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import toast from 'react-hot-toast';
// app/api/admin/overview/route.ts - make sure Course is imported if used
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Tutor from '@/models/Tutor';
import Course from '@/models/Course';  // Add if you populate courses
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Admin from '@/models/Admin';

interface DashboardStats {
  totalStudents: number;
  totalTutors: number;
  activeEnrollments: number;
  totalRevenue: number;
  revenueChange: number;
  pendingTutors: number;
  pendingPayments: number;
  recentActivities: any[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/admin/login');
    }
    
    // Redirect if not admin
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
    
    // Fetch data if authenticated and is admin
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        toast.error(data.error || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Don't render if not admin
  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back to your admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Students</h3>
            <p className="text-sm text-gray-400 mt-1">Active accounts</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.totalTutors || 0}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Tutors</h3>
            <p className="text-sm text-gray-400 mt-1">
              {stats?.pendingTutors || 0} pending approval
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.activeEnrollments || 0}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Active Enrollments</h3>
            <p className="text-sm text-gray-400 mt-1">Current subscriptions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ₦{(stats?.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Revenue</h3>
            <div className="flex items-center gap-1 mt-1">
              {stats?.revenueChange && stats.revenueChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+{stats.revenueChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600">{stats?.revenueChange}%</span>
                </>
              )}
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">Tutor Applications</p>
                    <p className="text-sm text-gray-600">{stats?.pendingTutors || 0} pending</p>
                  </div>
                </div>
                <a href="/admin/tutors" className="text-sm text-yellow-600 hover:text-yellow-700">
                  Review →
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Failed Payments</p>
                    <p className="text-sm text-gray-600">{stats?.pendingPayments || 0} pending</p>
                  </div>
                </div>
                <a href="/admin/payments" className="text-sm text-red-600 hover:text-red-700">
                  Review →
                </a>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {stats?.recentActivities?.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0">
                  {activity.type === 'tutor_approved' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {activity.type === 'tutor_rejected' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  {activity.type === 'new_enrollment' && (
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.message}</p>
                    <p className="text-xs text-gray-400">{activity.timeAgo}</p>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                <p className="text-gray-500 text-center py-8">No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}