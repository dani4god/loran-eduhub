// app/(public)/auth/tutor/register/success/page.tsx
'use client';

import Link from 'next/link';
import { CheckCircle, Mail, Video, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TutorRegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for applying to become a tutor at Loran EduHub. Our team will review your application and get back to you within 3-5 business days.
          </p>
        </div>
        
        {/* Video Submission Reminder */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Video className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Video Introduction Required</h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Your 8-minute video introduction should cover:
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Your teaching background and experience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Your qualifications and areas of expertise</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>A demonstration of your teaching style</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Why students should choose you as their tutor</span>
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Note: Applications without a proper video introduction may be delayed or rejected.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">What's Next?</h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">1.</span>
              <span>Our team will review your qualifications and video introduction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">2.</span>
              <span>You'll receive an email confirmation of your application</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">3.</span>
              <span>Once approved, you'll get access to your tutor dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">4.</span>
              <span>You can then start managing students and courses</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Return to Homepage <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-gray-500 text-center">
            Have questions? <Link href="/contact" className="text-blue-600 hover:underline">Contact our support team</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}