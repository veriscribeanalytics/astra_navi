import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ threadId: string }> };

/**
 * POST /api/messages/threads/[threadId]/read -> mark read.
 * Body: { lastReadMessageId? } — omit to mark the whole thread read.
 * The pointer only moves forward. Returns the fresh unreadCount.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { threadId } = await params;
        const body = await req.json().catch(() => ({}));

        const response = await backendFetch(
            `/api/messages/threads/${encodeURIComponent(threadId)}/read`,
            {
                method: 'POST',
                userEmail: user.email,
                accessToken,
                body: JSON.stringify(body ?? {}),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to mark read.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[messages/threads/[threadId]/read POST] error:', error);
        return NextResponse.json({ error: 'Failed to mark read.' }, { status: 500 });
    }
}
