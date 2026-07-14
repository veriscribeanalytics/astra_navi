import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { LoginSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';
import { createSessionNonce } from '@/lib/sessionNonce';
import { getClientIp } from '@/lib/request';

/**
 * Login API Route (Proxy Mode)
 *
 * Proxies login requests to the FastAPI backend, then mints a single-use
 * session-creation nonce. The browser receives { nonce, user, profileComplete }
 * and hands only the nonce to signIn('credentials') — never the tokens.
 * This route is rate-limited, so the session-creating backend call is the
 * throttled call (closing the prior limiter bypass via authorize()).
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validate input
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: validation.error.issues[0].message
            }, { status: 400 });
        }
        const { email, password } = validation.data;

        // 2. Rate limiting (Upstash Redis). The limiter fails CLOSED on a Redis
        // error (default) — see rateLimit.ts — so a store outage cannot turn
        // brute-force protection off. Client identity is derived via getClientIp
        // (leftmost x-forwarded-for hop, sanitized), not the raw header.
        const ip = getClientIp(req);
        const rateLimitResult = await checkRateLimit(`login:${ip}`, AUTH_LIMIT_CONFIG);

        if (!rateLimitResult.allowed) {
            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));
            return NextResponse.json({
                code: "rate_limited",
                message: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
                error: "Too many login attempts. Please try again later.",
                retryAfterSeconds,
            }, {
                status: 429,
                headers: { 'Retry-After': String(retryAfterSeconds) },
            });
        }

        // 3. Proxy to AI Backend (PostgreSQL) — the ONLY backend login call.
        const response = await backendFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // 4. Mint the single-use nonce carrying the real tokens. The browser
        // never sees accessToken/refreshToken.
        const expiresIn =
          (typeof data.expiresIn === 'number' && data.expiresIn > 0)
            ? data.expiresIn
            : 3600;
        const nonce = await createSessionNonce({
            id: data.user?.id,
            email: data.user?.email ?? null,
            name: data.user?.name ?? '',
            image: data.user?.image ?? null,
            phoneNumber: data.user?.phoneNumber ?? null,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn,
            profileComplete: data.profileComplete,
        });

        return NextResponse.json({
            message: "Welcome back.",
            nonce,
            user: data.user,
            profileComplete: data.profileComplete
        });

    } catch (error) {
        console.error("Login proxy error:", error);
        return NextResponse.json({
            code: "server_down",
            error: "Server is down, please contact the developer."
        }, { status: 500 });
    }
}
