import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * FCM device-token registration. JWT-only (no X-API-Key on the backend).
 *
 * POST  /api/fcm/register   body: { token, platform: 'android'|'ios'|'web' }
 *   → { success, active }
 * DELETE /api/fcm/register  body: { token }
 *   → { success, removed } (idempotent — removed:false when no row matched)
 */
async function forward(req: NextRequest, method: 'POST' | 'DELETE') {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        let body: string | undefined;
        if (method === 'POST' || req.method === 'DELETE') {
            // Both methods carry a JSON body (token [+ platform]). Read lazily.
            try {
                const raw = await req.json();
                body = JSON.stringify(raw);
            } catch {
                body = undefined;
            }
        }

        const response = await backendFetch('/api/fcm/register', {
            method,
            userEmail: user.email,
            accessToken,
            ...(body ? { body } : {}),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'FCM register failed.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error(`[fcm/register ${method}] error:`, error);
        return NextResponse.json({ error: 'FCM register failed.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return forward(req, 'POST');
}

export async function DELETE(req: NextRequest) {
    return forward(req, 'DELETE');
}
