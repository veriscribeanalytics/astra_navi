import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * POST /api/uploads/sign
 * Request a short-lived signed PUT URL for a direct browser→GCS upload.
 * Body: { kind, contentType, size }. The browser then PUTs the bytes to the
 * returned `uploadUrl` (no auth) and finally calls /api/uploads/commit.
 * Rate limit: 30/min (429 surfaced to the caller for a soft retry).
 */
export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const body = await req.json().catch(() => ({}));

        const response = await backendFetch('/api/uploads/sign', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to prepare upload.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[uploads/sign POST] error:', error);
        return NextResponse.json({ error: 'Failed to prepare upload.' }, { status: 500 });
    }
}
