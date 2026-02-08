import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './lib/supabase/database.types';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/analytics', '/transactions', '/settings', '/invite', '/onboarding'];
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users trying to access protected routes to signup (not login, so they can create account)
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  // Redirect authenticated users away from signup/login/forgot-password to dashboard
  if ((pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
