import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/family/invites/[id] -> revoke an outgoing invite. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(`/api/family/invites/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to revoke invite.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/invites/[id] DELETE] error:', error);
        return NextResponse.json({ error: 'Failed to revoke invite.' }, { status: 500 });
    }
}
