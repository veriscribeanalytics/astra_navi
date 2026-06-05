import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/notifications/[id]/read -> mark one read. Idempotent; the backend
 *  returns { success, id, changed } and never 404s for a missing/foreign id. */
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
            method: 'POST',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to mark notification read.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[notifications/[id]/read POST] error:', error);
        return NextResponse.json({ error: 'Failed to mark notification read.' }, { status: 500 });
    }
}
