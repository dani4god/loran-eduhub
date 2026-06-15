// middleware.ts - FIXED VERSION
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define role-based route access
const roleRoutes = {
  student: ['/dashboard/student', '/api/student'],
  tutor: ['/dashboard/tutor', '/api/tutor'],  // Changed to match your actual route
  admin: ['/admin', '/api/admin'],
};

// Public routes (no authentication required)
const publicRoutes = [
  '/',
  '/tutors',
  '/tutors/(.*)',
  '/courses',
  '/about',
  '/contact',
  '/auth/student/login',
  '/auth/student/register',
  '/auth/tutor/login',
  '/auth/tutor/register',
  '/auth/admin/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/courses',
  '/api/tutors',
];

// Helper function to check if path matches any pattern
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.includes('(.*)')) {
      const basePattern = pattern.replace('(.*)', '');
      return path.startsWith(basePattern);
    }
    return path === pattern || path.startsWith(pattern);
  });
}

// Helper function to get login URL based on role
function getLoginUrl(role: string, callbackUrl: string): URL {
  const loginPaths: Record<string, string> = {
    student: '/auth/student/login',
    tutor: '/auth/tutor/login',
    admin: '/auth/admin/login',
  };
  
  const loginPath = loginPaths[role] || '/auth/student/login';
  const url = new URL(loginPath, process.env.NEXTAUTH_URL);
  url.searchParams.set('callbackUrl', callbackUrl);
  return url;
}

export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as any).nextauth?.token;
    const path = req.nextUrl.pathname;

    // Check if route is public
    if (matchesPattern(path, publicRoutes)) {
      return NextResponse.next();
    }

    // Check static assets
    if (path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/)) {
      return NextResponse.next();
    }

    // No token - redirect to appropriate login
    if (!token) {
      let role = 'student';
      if (path.includes('/tutor')) role = 'tutor';
      if (path.includes('/admin')) role = 'admin';
      return NextResponse.redirect(getLoginUrl(role, path));
    }

    const userRole = token.role as string;

    // Role-based access control
    if (userRole === 'student' && matchesPattern(path, roleRoutes.admin)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (userRole === 'tutor' && matchesPattern(path, roleRoutes.admin)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (userRole === 'student' && matchesPattern(path, roleRoutes.tutor)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (userRole === 'tutor' && matchesPattern(path, roleRoutes.student)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (userRole === 'admin' && matchesPattern(path, roleRoutes.student)) {
      return NextResponse.next();
    }

    // Dashboard redirects - FIXED: Remove route groups from URLs
    if (path === '/dashboard') {
      if (userRole === 'student') {
        return NextResponse.redirect(new URL('/dashboard/student', req.url));
      }
      if (userRole === 'tutor') {
        return NextResponse.redirect(new URL('/dashboard/tutor', req.url)); // Fixed: removed (tutor)/
      }
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    // API route protection
    if (path.startsWith('/api/admin') && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    if (path.startsWith('/api/tutor') && userRole !== 'tutor') {
      return NextResponse.json({ error: 'Unauthorized: Tutor access required' }, { status: 401 });
    }
    
    if (path.startsWith('/api/student') && userRole !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 401 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhook).*)',
  ],
};