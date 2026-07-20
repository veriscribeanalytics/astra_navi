import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin FCM aggregate stats. Requires `require_admin` on the backend (JWT).
 * GET /api/fcm/stats
 */
export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const response = await backendFetch('/api/fcm/stats', {
            method: 'GET',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load FCM stats.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[admin fcm/stats GET] error:', error);
        return NextResponse.json({ error: 'Failed to load FCM stats.' }, { status: 500 });
    }
}
