import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * FCM reminder preferences. JWT-only.
 *
 * GET /api/fcm/preferences
 *   → { morningEnabled, morningTime, eveningEnabled, eveningTime, timezone }
 *     Reminders are OPT-IN by default (morningEnabled=false until enabled).
 *
 * PUT /api/fcm/preferences  body: any subset (camelCase); null = leave unchanged,
 *   explicit false clears. Uses exclude_unset server-side — send only changed
 *   fields. Times are HH:MM 24h; timezone must be a valid IANA name.
 *   → { success, ...same camelCase fields }
 */
async function forward(req: NextRequest, method: 'GET' | 'PUT') {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        let body: string | undefined;
        if (method === 'PUT') {
            try {
                const raw = await req.json();
                body = JSON.stringify(raw);
            } catch {
                body = undefined;
            }
        }

        const response = await backendFetch('/api/fcm/preferences', {
            method,
            userEmail: user.email,
            accessToken,
            ...(body ? { body } : {}),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'FCM preferences request failed.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error(`[fcm/preferences ${method}] error:`, error);
        return NextResponse.json({ error: 'FCM preferences request failed.' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return forward(req, 'GET');
}

export async function PUT(req: NextRequest) {
    return forward(req, 'PUT');
}
