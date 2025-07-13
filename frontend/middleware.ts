import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes = {
  '/buyer': ['buyer', 'admin'],
  '/artisan': ['artisan', 'admin'],
  '/admin': ['admin'],
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/marketplace',
  '/buyer/login',
  '/artisan/login',
  '/admin/login',
];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check if the route requires protection
  const matchedRoute = Object.entries(protectedRoutes).find(([route]) =>
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const [route, allowedRoles] = matchedRoute;

  if (!token) {
    const loginUrl = new URL('/buyer/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify token and check role
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const { user } = await response.json();

    if (!user.role || !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      let redirectPath = '/';
      switch (user.role) {
        case 'artisan':
          redirectPath = '/artisan/dashboard';
          break;
        case 'buyer':
          redirectPath = '/marketplace';
          break;
        case 'admin':
          redirectPath = '/admin/dashboard';
          break;
      }
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    const loginUrl = new URL('/buyer/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure paths that trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|ico|jpg|jpeg|png|gif|webp)$).*)',
  ],
};