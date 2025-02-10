import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define protected paths that require specific roles
const PROTECTED_PATHS = [
  "/sistema/compras",
  "/sistema/compras/recibos",
  "/sistema/compras/recibos/nuevo",
  "/sistema/negocio/contabilidad/transacciones",
  "/sistema/negocio/contabilidad/cuentas",
  "/sistema/negocio/contabilidad/cuentas/nueva",
];

export async function middleware(request: any) {
  const token: any = await getToken({ req: request });
  request.nextauth = request.nextauth || {};
  request.nextauth.token = token;
  const pathname = request.nextUrl.pathname;
  let signInUrl;

  // Check if user is authenticated and redirect to sistema/home if accessing public routes
  if (token?.user) {
    if (!pathname.includes("sistema") && !pathname.includes("admin")) {
      signInUrl = new URL("/sistema/home", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Handle protected sistema routes
  if (pathname.includes("sistema")) {
    // Redirect to login if not authenticated
    if (!token) {
      signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if current path is in protected paths
    const isProtectedPath = PROTECTED_PATHS.some((path) =>
      pathname.startsWith(path)
    );

    if (isProtectedPath) {
      // Only allow SUPER_ADMIN and ADMIN roles for protected paths
      if (
        token?.user?.role !== "SUPER_ADMIN" &&
        token?.user?.role !== "ADMIN"
      ) {
        signInUrl = new URL("/no-autorizado", request.url);
        return NextResponse.redirect(signInUrl);
      }
    } else {
      // For non-protected sistema paths, allow SUPER_ADMIN, ADMIN, and GERENTE
      if (
        token?.user?.role !== "SUPER_ADMIN" &&
        token?.user?.role !== "ADMIN" &&
        token?.user?.role !== "GERENTE"
      ) {
        signInUrl = new URL("/no-autorizado", request.url);
        return NextResponse.redirect(signInUrl);
      }
    }
  }

  // Handle perfil routes
  if (pathname.includes("perfil")) {
    if (!token) {
      signInUrl = new URL("/api/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|logos|covers).*)",
  ],
};
