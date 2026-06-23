import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * POST /api/uploads/commit
 * Finalize an upload after the bytes are in GCS. Body: { kind, objectKey, targetId }.
 * For kind `dm`, targetId is the threadId and commit only verifies membership;
 * the returned `objectKey` is permanent and used as the message `imageKey`.
 * Rate limit: 30/min (429 surfaced to the caller for a soft retry).
 */
export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const body = await req.json().catch(() => ({}));

        const response = await backendFetch('/api/uploads/commit', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to finalize upload.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[uploads/commit POST] error:', error);
        return NextResponse.json({ error: 'Failed to finalize upload.' }, { status: 500 });
    }
}
