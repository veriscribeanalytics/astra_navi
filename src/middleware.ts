/**
 * Next.js middleware — wires up NextAuth's `auth` function so the
 * `authorized()` callback in src/auth.config.ts actually runs on every
 * request. Without this file the entire route-protection layer is dead code
 * and routes like /chat, /profile, /family are reachable without a session.
 */
export { auth as middleware } from '@/lib/auth';

export const config = {
    // Apply to every path except Next.js internals, /api routes (which
    // handle their own auth), and static assets. The `authorized()` callback
    // in auth.config.ts then decides per-path whether to allow, redirect, or
    // require login.
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
    ],
};
