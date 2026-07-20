import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin broadcast push to all users (or a filtered audience, backend-defined).
 * POST /api/fcm/broadcast  body: { title, body, data? }
 */
export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        let body: string | undefined;
        try {
            body = JSON.stringify(await req.json());
        } catch { /* empty body — backend will reject */ }

        const response = await backendFetch('/api/fcm/broadcast', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            ...(body ? { body } : {}),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Broadcast failed.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[admin fcm/broadcast POST] error:', error);
        return NextResponse.json({ error: 'Broadcast failed.' }, { status: 500 });
    }
}
