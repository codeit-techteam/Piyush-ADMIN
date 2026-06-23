import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authRoutes = ["/login"];
const ADMIN_SESSION_COOKIE = "admin_session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value === "authenticated";

  if (!hasSession && !authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
