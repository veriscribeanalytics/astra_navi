import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files, metadata image routes, and
     * API/auth internals — none of those should ever hit the auth gate (a
     * 307-to-login on /lotus.png or /opengraph-image breaks previews, OG cards,
     * and indexed public assets).
     *
     * Two exclusion rules, both required:
     *
     * 1. `[^?]*\\.` — any path whose last segment contains a literal dot. This
     *    catches ALL public static assets by extension regardless of directory:
     *    /lotus.png, /vedic_houses.png, /zodiac-wheel.svg, /file.svg,
     *    /animation/nebula_left.jpeg, /static/avatars/NAVI_AVATAR.webp, etc.
     *    The previous matcher only excluded a few literal names (logo.jpeg,
     *    favicon.ico) so dotted files elsewhere slipped through → 307 to login.
     *
     * 2. Named metadata-route segments — Next.js generates these WITHOUT an
     *    extension (e.g. /opengraph-image, /twitter-image, /apple-icon, /icon,
     *    /favicon.ico), so the dot-rule above misses the extension-less ones.
     *    `sitemap.xml`/`robots.txt`/`manifest.webmanifest` are also covered.
     *
     * API routes handle their own auth, so they're excluded too.
     */
    '/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\..*|opengraph-image|twitter-image|apple-icon|icon|sitemap\\.xml|sitemap-0\\.xml|robots\\.txt|manifest\\.webmanifest).*)',
  ],
};
