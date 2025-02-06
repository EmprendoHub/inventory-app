import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: any) {
  const token: any = await getToken({ req: request });
  request.nextauth = request.nextauth || {};
  request.nextauth.token = token;
  const pathname = request.nextUrl.pathname;
  let signInUrl;

  if (token?.user) {
    if (token?.user?.role === "superadmin" && !pathname.includes("sistema")) {
      signInUrl = new URL("/sistema/home", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (pathname.includes("sistema")) {
    //if admin user is not logged in
    if (!token) {
      signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (token?.user?.role !== "superadmin") {
      signInUrl = new URL("/no-autorizado", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (pathname.includes("perfil")) {
    //if afiliado user is not logged in
    let signInUrl;
    if (!token) {
      signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (token?.user?.role === "superadmin") {
      signInUrl = new URL("/sistema/home", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|logos|covers).*)",
  ],
};
