import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = {
  '/buyer': ['buyer', 'admin'],
  '/artisan': ['artisan', 'admin'],
  '/admin': ['admin'],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;

  const matched = Object.entries(protectedRoutes).find(([route]) =>
    pathname.startsWith(route)
  );

  if (!matched) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL('/buyer/login?from=' + pathname, request.url));
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-token`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Invalid token');

    const { user } = await res.json();
    const [, allowedRoles] = matched;

    if (!user.role || !allowedRoles.includes(user.role)) {
      const redirectPath = user.role === 'artisan' ? '/artisan/dashboard'
                          : user.role === 'admin' ? '/admin/dashboard'
                          : '/marketplace';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/buyer/login?from=' + pathname, request.url));
  }
}

export const config = {
  matcher: ['/buyer/:path*', '/artisan/:path*', '/admin/:path*'],
};
