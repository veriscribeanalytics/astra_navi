import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin revoke of a single FCM device token.
 * DELETE /api/fcm/tokens/{token_id}
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ token_id: string }> }
) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { token_id } = await params;
        const response = await backendFetch(`/api/fcm/tokens/${encodeURIComponent(token_id)}`, {
            method: 'DELETE',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to revoke token.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[admin fcm/tokens/[id] DELETE] error:', error);
        return NextResponse.json({ error: 'Failed to revoke token.' }, { status: 500 });
    }
}
