import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * POST /api/fcm/test — send a test push to the caller's own registered tokens.
 *   → { success, summary }
 *   → 404 if no tokens, 503 if FCM unconfigured (statuses forwarded as-is).
 * JWT-only.
 */
export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const response = await backendFetch('/api/fcm/test', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || data.summary || 'FCM test failed.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[fcm/test POST] error:', error);
        return NextResponse.json({ error: 'FCM test failed.' }, { status: 500 });
    }
}
