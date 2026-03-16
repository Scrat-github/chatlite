import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check if user is authenticated (Supabase uses sb-* cookies)
  const hasSession = request.cookies.get("sb-ytbqeauuovcavchuumxs-auth-token")?.value;

  // Protected routes
  const protectedPaths = ["/conversations", "/team", "/settings", "/analytics"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtectedPath && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes redirect if already logged in
  const authPaths = ["/auth/login", "/auth/register"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL("/conversations", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/conversations/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/analytics/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
