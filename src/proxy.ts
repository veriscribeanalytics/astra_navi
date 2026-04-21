import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (public icons)
     * - images (public images)
     * - logo.jpeg (root assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|logo.jpeg|logo1.jpeg).*)',
  ],
};
