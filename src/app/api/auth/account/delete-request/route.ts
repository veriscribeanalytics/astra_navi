import { NextResponse } from 'next/server';
import { checkRateLimit, API_LIMIT_CONFIG } from '@/middleware/rateLimit';
import { backendFetch } from '@/lib/backendClient';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { getClientIp } from '@/lib/request';

/**
 * Account Deletion Request (Proxy Mode)
 *
 * Proxies the authenticated user's request to start the 48-hour cooling-off
 * deletion window to the FastAPI backend (`POST /api/auth/account/delete-request`).
 * The caller is already authenticated, so the backend needs only `password` to
 * re-confirm. We mint nothing here — the backend creates the pending-deletion
 * record, revokes nothing yet (the account stays fully active for 48h), and
 * sends the restore-link notice email.
 *
 * Returns the backend envelope verbatim (`message`, `emailSent`, `executeAfter`)
 * so the client can show the cooling-off timing + the `emailSent: false` →
 * "contact support" fallback.
 */
export async function POST(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) {
            return unauthorizedResponse();
        }
        const { accessToken } = authContext;

        // Light rate limit per IP so a misbehaving client can't spam deletion
        // emails. The backend also enforces a 48h repeat guard (`409
        // deletion_already_requested`); this just stops the email flood upstream.
        const ip = getClientIp(req);
        const rateLimitResult = await checkRateLimit(`delete-request:${ip}`, API_LIMIT_CONFIG);
        if (!rateLimitResult.allowed) {
            return NextResponse.json({
                code: 'rate_limited',
                message: 'Too many requests. Please try again later.',
                error: 'Too many requests. Please try again later.',
            }, { status: 429 });
        }

        const body = await req.json().catch(() => ({}));

        const response = await backendFetch('/api/auth/account/delete-request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body), // { password: '...' }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // Pass the backend envelope through unchanged — `emailSent` and
        // `executeAfter` drive the client-side confirmation copy.
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Delete-request proxy error:', error);
        return NextResponse.json({
            code: 'server_down',
            error: 'Server is down, please contact the developer.',
        }, { status: 500 });
    }
}
