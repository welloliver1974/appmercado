import { type NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  const userId = request.cookies.get("user-id")?.value;
  const isAuthRoute = request.nextUrl.pathname === "/login";

  if (isAuthRoute) {
    if (userId) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
