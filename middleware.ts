import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block access to SMS-related routes
  const smsRoutes = [
    '/sms',
    '/schedule-sms',
    '/sms-history'
  ];

  // Check if the current path starts with any SMS route
  const isSmsRoute = smsRoutes.some(route => pathname.startsWith(route));

  if (isSmsRoute) {
    // Return 403 Forbidden for SMS routes
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'SMS functionality is currently not available in your region. Please contact support for more information.',
        status: 403
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sms/:path*',
    '/schedule-sms/:path*',
    '/sms-history/:path*'
  ],
};
