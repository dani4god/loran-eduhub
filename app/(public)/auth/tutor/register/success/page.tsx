// app/(public)/auth/tutor/register/success/page.tsx
'use client';

import Link from 'next/link';
import { CheckCircle, Mail, Video, ArrowRight, Disc, MessageSquare, Smartphone, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function TutorRegistrationSuccess() {
  const [showDiscordSetup, setShowDiscordSetup] = useState(false);
  const discordInviteLink = process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK || 'https://discord.gg/your-invite-link';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
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
        
        {/* Interview Notification */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Interview Process</h3>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            A member of our HR team will reach out to you via email to schedule an interview. 
            <span className="font-medium text-purple-700"> Please keep an eye on your email inbox</span> (including spam/junk folder) for our communication.
          </p>
          <div className="bg-purple-100/50 rounded-md p-3 mt-3">
            <p className="text-xs text-purple-800">
              <span className="font-semibold">📌 Interview Tip:</span> Prepare to discuss your teaching philosophy, subject expertise, and experience with online tutoring platforms.
            </p>
          </div>
        </div>
        
        {/* Video Submission Reminder */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
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
        
        {/* Discord Community Section */}
        <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Disc className="w-6 h-6 text-[#5865F2]" />
            <h3 className="font-semibold text-gray-900">Join Our Discord Community</h3>
          </div>
          
          <p className="text-sm text-gray-700 mb-4">
            Stay updated on your application status, get interview tips, and connect with other tutors in our Discord community!
          </p>
          
          <Link
            href={discordInviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#5865F2] text-white rounded-lg font-medium hover:bg-[#4752C4] transition-all transform hover:scale-[1.02]"
          >
            <Disc className="w-5 h-5" />
            Join Our Discord Community
          </Link>
          
          <button
            onClick={() => setShowDiscordSetup(!showDiscordSetup)}
            className="mt-3 text-sm text-[#5865F2] hover:underline w-full text-center"
          >
            {showDiscordSetup ? 'Hide Discord Setup Guide' : "Don't have Discord? Learn how to set it up ↓"}
          </button>
          
          {showDiscordSetup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4 overflow-hidden"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  For Windows PC
                </h4>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                  <li>Go to <a href="https://discord.com/download" target="_blank" rel="noopener noreferrer" className="text-[#5865F2] hover:underline">discord.com/download</a></li>
                  <li>Click on <strong>"Download for Windows"</strong></li>
                  <li>Run the installer file (DiscordSetup.exe)</li>
                  <li>Follow the installation wizard instructions</li>
                  <li>Once installed, launch Discord from your desktop</li>
                  <li>Click <strong>"Register"</strong> to create a free account</li>
                  <li>Verify your email address</li>
                  <li>After setup, click the "Join Our Discord Community" button above</li>
                </ol>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  For Mobile Phone (Android & iOS)
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-800 mb-1">📱 Android:</p>
                    <ol className="space-y-1.5 text-sm text-gray-700 list-decimal list-inside">
                      <li>Open <strong>Google Play Store</strong></li>
                      <li>Search for <strong>"Discord"</strong></li>
                      <li>Tap <strong>"Install"</strong></li>
                      <li>Open the app after installation</li>
                      <li>Tap <strong>"Register"</strong> to create a free account</li>
                      <li>Verify your email address</li>
                      <li>After setup, tap the "Join Our Discord Community" button above</li>
                    </ol>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="font-medium text-sm text-gray-800 mb-1">🍎 iOS (iPhone/iPad):</p>
                    <ol className="space-y-1.5 text-sm text-gray-700 list-decimal list-inside">
                      <li>Open <strong>App Store</strong></li>
                      <li>Search for <strong>"Discord"</strong></li>
                      <li>Tap <strong>"Get"</strong></li>
                      <li>Authenticate with Face ID/Touch ID/Apple ID</li>
                      <li>Open the app after installation</li>
                      <li>Tap <strong>"Register"</strong> to create a free account</li>
                      <li>Verify your email address</li>
                      <li>After setup, tap the "Join Our Discord Community" button above</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  💡 <span className="font-semibold">Pro Tip:</span> After joining, introduce yourself in the #introductions channel and check the #announcements channel for updates on your application!
                </p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">What's Next?</h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">1.</span>
              <span>Our HR team will review your qualifications and video introduction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">2.</span>
              <span>You'll receive an email to schedule an interview with our team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">3.</span>
              <span>Join our Discord community for real-time updates and support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">4.</span>
              <span>Once approved, you'll get access to your tutor dashboard</span>
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