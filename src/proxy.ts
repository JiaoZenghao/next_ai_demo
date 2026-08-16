import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  getAuthRedirect,
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  const sessionValue = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const isAuthenticated = sessionValue === DEMO_SESSION_VALUE;
  const redirectTo = getAuthRedirect(
    request.nextUrl.pathname,
    isAuthenticated,
  );

  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
