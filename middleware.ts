import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Cookie-based Route Guard Middleware
 * Fast-path check for session cookie presence without hitting the database.
 * Full session and role authorization is strictly verified in server Route Handlers.
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // If visiting protected member or club desk areas without a session cookie, redirect to /login
  if (!sessionCookie && (pathname.startsWith("/me") || pathname.startsWith("/desk"))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware only to protected student member and management desk routes
  matcher: ["/me/:path*", "/desk/:path*"],
};
