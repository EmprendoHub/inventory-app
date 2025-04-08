import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isRouteAllowed } from "./lib/utils";

export async function middleware(request: any) {
  const token: any = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  let redirectUrl;

  // Redirect to login if not authenticated
  if (!token) {
    // console.log("User not authenticated, redirecting to login");
    if (!["/legal", "/legal"].some((path) => pathname.includes(path))) {
      if (pathname === "/") {
        // Redirect to the login page if the user is not authenticated and trying to access the root path
        return NextResponse.next();
      }
      // Redirect to the login page if the user is not authenticated and trying to access any other path
      redirectUrl = new URL("/iniciar", request.url);
      redirectUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check if the user's  role has access to the requested route
  const userRole = token?.user?.role;

  if (!isRouteAllowed(userRole, pathname)) {
    // console.log("User role:", userRole);
    // console.log("Requested path:", pathname);
    if (!["/legal", "/legal"].some((path) => pathname.includes(path))) {
      // Redirect to a default route if the user is authenticated but not authorized
      if (pathname !== "/sistema/home") {
        // If the user is already on /no-autorizado, redirect them to a default route (e.g., /sistema/home)
        redirectUrl = new URL("/sistema/home", request.url);
        return NextResponse.redirect(redirectUrl);
      } else {
        // If the user is already on /no-autorizado, redirect them to a default route (e.g., /sistema/home)
        redirectUrl = new URL("/sistema/home", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // console.log("User authorized, allowing access to route:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|logos|covers|iniciar|error|no-autorizado).*)",
  ],
};
