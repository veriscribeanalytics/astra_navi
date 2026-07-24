import { NextResponse } from 'next/server';
import { checkRateLimit, AUTH_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { backendFetch } from '@/lib/backendClient';
import { getAuthContext } from '@/lib/session';
import { getClientIp } from '@/lib/request';

/**
 * Cancel-deletion / Restore-account (Proxy Mode)
 *
 * Proxies `POST /api/auth/account/cancel-deletion` to the backend. This one
 * endpoint serves two distinct modes, decided by the backend based on what's
 * present:
 *
 *  - Mode A — RESTORE a soft-deleted account. No valid session (the account is
 *    deleted, so any JWT is rejected) → email + password required in the body.
 *    This is the login-screen restore path (Path 2). It is rate-limited with
 *    the same strictness as login because a deleted-account restore is a
 *    password-guessing surface (wrong password → `401 incorrect_password`,
 *    repeated → `429 account_locked`, sharing the login lockout).
 *
 *  - Mode B — CANCEL a *pending* deletion while the account is still active.
 *    A valid `Authorization: Bearer` JWT is present and the account is NOT
 *    deleted → empty/no body. No password, no rate limit beyond the API limit
 *    (the caller is already authenticated).
 *
 * We branch before the backend call: if `getAuthContext` yields a session we
 * forward Mode B with the bearer; otherwise we enforce the login-grade limiter
 * and forward Mode A with the email+password body. In both cases the backend's
 * response envelope (code/field/action/retryAfterSeconds) is passed through
 * verbatim so `parseAuthError` on the client can route it exactly like a login
 * error.
 */
export async function POST(req: Request) {
    try {
        // Mode B path: a live session means "cancel my pending deletion".
        // getAuthContext returns null when the token is missing, expired, or
        // flagged with an error — all of which correctly fall through to Mode A.
        const authContext = await getAuthContext(req).catch(() => null);

        if (authContext) {
            const { accessToken } = authContext;
            const response = await backendFetch('/api/auth/account/cancel-deletion', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}), // Mode B: no body needed
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                return NextResponse.json(data, { status: response.status });
            }
            return NextResponse.json(data, { status: 200 });
        }

        // Mode A path — restore a deleted account. Treat it exactly like a
        // login attempt for brute-force purposes: same identifier shape, same
        // strict window (5 / 15min), fail CLOSED on a Redis outage.
        const ip = getClientIp(req);
        const rateLimitResult = await checkRateLimit(`cancel-deletion:${ip}`, AUTH_LIMIT_CONFIG);
        if (!rateLimitResult.allowed) {
            const retryAfterSeconds = Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000));
            return NextResponse.json({
                code: 'account_locked',
                message: `Too many attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
                error: 'Too many attempts. Please try again later.',
                field: 'password',
                action: 'retry',
                retryAfterSeconds,
            }, {
                status: 429,
                headers: { 'Retry-After': String(retryAfterSeconds) },
            });
        }

        const body = await req.json().catch(() => ({}));

        const response = await backendFetch('/api/auth/account/cancel-deletion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body), // { email, password }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // On `restored: true` the backend does NOT return a session — it clears
        // `deleted_at` and revokes old tokens, so the client must re-run the
        // normal login flow next. We just pass the envelope through; the login
        // page handles the re-login.
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Cancel-deletion proxy error:', error);
        return NextResponse.json({
            code: 'server_down',
            error: 'Server is down, please contact the developer.',
        }, { status: 500 });
    }
}
