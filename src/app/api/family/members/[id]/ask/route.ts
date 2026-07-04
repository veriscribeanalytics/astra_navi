import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * POST /api/family/members/[id]/ask
 *
 * Creates a pre-seeded chat thread + starter prefill for "ask about this
 * relationship" against a manual member. Empty request body forwarded as-is.
 * NOT cached — thread creation must be unique each call. 10/min per viewer.
 *
 * Returns `{ chat, starter }`. The frontend opens `/chat?id=<chat.id>` and
 * renders `starter.prefill` as a tappable suggestion; on tap it sends the
 * prefill via the normal `POST /api/chat/{id}/message` SSE path. The prefill
 * embeds the member's name, which is what activates the family chart tools
 * server-side.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(
            `/api/family/members/${encodeURIComponent(id)}/ask`,
            {
                userEmail: user.email,
                accessToken,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to start relationship chat.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            },
        });
    } catch (error) {
        console.error('[family/members/[id]/ask POST] error:', error);
        return NextResponse.json({ error: 'Failed to start relationship chat.' }, { status: 500 });
    }
}
