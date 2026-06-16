import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ threadId: string }> };

/**
 * GET /api/messages/threads/[threadId]/messages -> oldest → newest.
 * Query: `after` (last id seen — the polling cursor), `limit` (default 50, max 100).
 * 403 if you're not a party to the thread.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { threadId } = await params;

        const incoming = req.nextUrl.searchParams;
        const qs = new URLSearchParams();
        const after = incoming.get('after');
        const limit = incoming.get('limit');
        if (after != null) qs.set('after', after);
        if (limit != null) qs.set('limit', limit);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';

        const response = await backendFetch(
            `/api/messages/threads/${encodeURIComponent(threadId)}/messages${suffix}`,
            {
                userEmail: user.email,
                accessToken,
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load messages.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            },
        });
    } catch (error) {
        console.error('[messages/threads/[threadId]/messages GET] error:', error);
        return NextResponse.json({ error: 'Failed to load messages.' }, { status: 500 });
    }
}

/**
 * POST /api/messages/threads/[threadId]/messages -> send. Returns created message (201).
 * Errors: 422 (body length), 403 MESSAGE_BLOCKED, 409 NOT_CONNECTED, 403/404 thread.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { threadId } = await params;
        const body = await req.json().catch(() => ({}));

        const response = await backendFetch(
            `/api/messages/threads/${encodeURIComponent(threadId)}/messages`,
            {
                method: 'POST',
                userEmail: user.email,
                accessToken,
                body: JSON.stringify(body),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to send message.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[messages/threads/[threadId]/messages POST] error:', error);
        return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
    }
}
