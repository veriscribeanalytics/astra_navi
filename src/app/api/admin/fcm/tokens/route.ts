import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin FCM device-token list (paginated/filtered).
 * GET /api/fcm/tokens?page=&limit=&platform=&active=&q=
 *
 * Query params are passed through to the backend. The backend enforces
 * `require_admin` via JWT.
 */
export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { search } = new URL(req.url);
        const path = `/api/fcm/tokens${search || ''}`;

        const response = await backendFetch(path, {
            method: 'GET',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load tokens.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[admin fcm/tokens GET] error:', error);
        return NextResponse.json({ error: 'Failed to load tokens.' }, { status: 500 });
    }
}
