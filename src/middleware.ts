import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isRouteAllowed } from "./lib/utils";
import { logError } from "./lib/logging";

export async function middleware(request: any) {
  try {
    const token: any = await getToken({ req: request });
    const pathname = request.nextUrl.pathname;
    let redirectUrl;

    //logAccess(`Middleware triggered for path: ${pathname}`);

    // Redirect to login if not authenticated
    if (!token) {
      //logAccess("User not authenticated, redirecting to login");
      if (!["/legal", "/legal"].some((path) => pathname.includes(path))) {
        redirectUrl = new URL("/iniciar", request.url);
        redirectUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Check if the user's role has access to the requested route
    const userRole = token?.user?.role;

    if (!isRouteAllowed(userRole, pathname)) {
      //logAccess(`User role: ${userRole}, Requested path: ${pathname}`);
      if (!["/legal", "/legal"].some((path) => pathname.includes(path))) {
        // Redirect to a default route if the user is authenticated but not authorized
        if (pathname !== "/no-autorizado") {
          redirectUrl = new URL("/no-autorizado", request.url);
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    //logAccess(`User authorized, allowing access to route: ${pathname}`);
    return NextResponse.next();
  } catch (error: any) {
    logError(`Middleware error: ${error.message}`);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|logos|covers|iniciar|error|no-autorizado).*)",
  ],
};
