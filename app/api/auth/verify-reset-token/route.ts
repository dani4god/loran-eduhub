// app/api/auth/verify-reset-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { resetTokens } from '../forgot-password/route';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      );
    }
    
    if (role && tokenData.role !== role) {
      return NextResponse.json(
        { error: 'Invalid token for this role' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      valid: true,
      email: tokenData.email,
    });
    
  } catch (error: any) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}