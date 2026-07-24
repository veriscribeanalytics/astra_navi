import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * User Deletion (authenticated, no-password) — Proxy Mode
 *
 * Proxies the authenticated user's deletion to the FastAPI backend's
 * `DELETE /api/user/user`. Unlike `delete-request` (which re-confirms with a
 * password), this endpoint requires only a valid session — the caller is
 * already authenticated — and goes through the SAME 48-hour cooling-off window
 * as `delete-request` (it is no longer an instant delete). A repeat within the
 * window returns `409 deletion_already_requested`.
 *
 * Ownership is verified via the session; the browser never sees tokens.
 */
export async function DELETE(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;
        const email = user?.email;

        const response = await backendFetch('/api/user/user', {
            method: 'DELETE',
            userEmail: email as string,
            accessToken: accessToken as string,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Pass the backend envelope (code/field/message) through verbatim so
            // the client can route e.g. `409 deletion_already_requested`.
            return NextResponse.json(data, { status: response.status });
        }

        // 48h cooling-off shape: { message, emailSent, executeAfter }.
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json({
            code: 'server_down',
            error: 'The stars are currently obscured. Account deletion failed.',
        }, { status: 500 });
    }
}
