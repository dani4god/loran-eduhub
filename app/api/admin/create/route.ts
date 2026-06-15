// app/api/admin/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    // Check if user is super admin
    if (!token || token.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current admin to check if they're super admin
    await connectDB();
    
    const currentAdmin = await Admin.findOne({ userId: token.id });
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can create new admins' }, { status: 403 });
    }
    
    const { firstName, lastName, email, phone, password, role } = await req.json();
    
    // Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      firstName,
      lastName,
    });
    
    // Create admin profile
    const admin = await Admin.create({
      userId: user._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      role: role || 'admin',
      permissions: role === 'admin' ? ['view', 'create', 'edit', 'delete'] : ['view'],
      createdBy: currentAdmin._id,
      isActive: true,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin._id,
        name: `${firstName} ${lastName}`,
        email,
        role: admin.role,
      },
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
