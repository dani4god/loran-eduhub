// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Tutor from '@/models/Tutor';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { email, role } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal that email doesn't exist for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists, you will receive a reset link',
      });
    }
    
    // Check role if specified
    if (role && user.role !== role) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, you will receive a reset link',
      });
    }
    
    // For tutors, check if they're approved
    if (user.role === 'tutor') {
      const tutor = await Tutor.findOne({ userId: user._id });
      if (tutor && tutor.status !== 'approved') {
        return NextResponse.json({
          success: true,
          message: 'If an account exists, you will receive a reset link',
        });
      }
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Store token
    resetTokens.set(resetToken, {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      expires: tokenExpiry,
    });
    
    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/${user.role}/reset-password?token=${resetToken}`;
    
    await sendPasswordResetEmail({
      email: user.email,
      // user.firstName may not exist on the typed document, cast to any
      name: (user as any).firstName || user.email.split('@')[0],
      resetUrl,
      role: user.role,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
    
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// Export resetTokens for use in other routes
export { resetTokens };