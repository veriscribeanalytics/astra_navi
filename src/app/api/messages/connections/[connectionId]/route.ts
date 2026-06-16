import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ connectionId: string }> };

/**
 * POST /api/messages/connections/[connectionId]
 * Open (or create) the 1:1 thread for a connection. Idempotent.
 * 404 if the connection doesn't exist, isn't yours, or is disconnected.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { connectionId } = await params;

        const response = await backendFetch(
            `/api/messages/connections/${encodeURIComponent(connectionId)}`,
            {
                method: 'POST',
                userEmail: user.email,
                accessToken,
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to open conversation.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[messages/connections/[connectionId] POST] error:', error);
        return NextResponse.json({ error: 'Failed to open conversation.' }, { status: 500 });
    }
}
