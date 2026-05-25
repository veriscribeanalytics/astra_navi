import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/family/invites/[id]/accept/merge
 * -> confirm merging a manual member into the just-created linked connection.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const body = await req.json().catch(() => ({}));

        const response = await backendFetch(`/api/family/invites/${encodeURIComponent(id)}/accept/merge`, {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to merge member into connection.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/invites/[id]/accept/merge POST] error:', error);
        return NextResponse.json({ error: 'Failed to merge member into connection.' }, { status: 500 });
    }
}
