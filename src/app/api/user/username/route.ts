import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/** PATCH /api/user/username -> set, change, or clear ({username: null}) the
 *  caller's discovery handle. Validation (422), uniqueness (409), and the
 *  5/hour rate limit (429) are enforced by the backend; we pass them through. */
export async function PATCH(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const body = await req.json().catch(() => ({}));

        const response = await backendFetch('/api/user/username', {
            method: 'PATCH',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Preserve the backend body verbatim so the client can switch on
            // error.code (USERNAME_TAKEN) and FastAPI 422 `detail` shapes.
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[user/username PATCH] error:', error);
        return NextResponse.json({ error: 'Failed to update username.' }, { status: 500 });
    }
}
