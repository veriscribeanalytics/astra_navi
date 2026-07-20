import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin: send a test push to a target user.
 * POST /api/fcm/test  body: { target_user_id?: string, target_email?: string, ... }
 *
 * NOTE: this shadows the user-scoped `/api/fcm/test` on the backend — the
 * backend routes admin-targeted test pushes via the same path when the caller
 * is an admin (require_admin). We forward the full body so the admin UI can
 * specify a target user.
 */
export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        let body: string | undefined;
        try {
            body = JSON.stringify(await req.json());
        } catch { /* no target — backend may default to self */ }

        const response = await backendFetch('/api/fcm/test', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            ...(body ? { body } : {}),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || data.summary || 'Test push failed.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[admin fcm/test POST] error:', error);
        return NextResponse.json({ error: 'Test push failed.' }, { status: 500 });
    }
}
