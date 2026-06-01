import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/family/connections/[id] -> update sharing/avatar/notes/relationship. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const body = await req.json().catch(() => ({}));

        const response = await backendFetch(`/api/family/connections/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to update connection.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/connections/[id] PATCH] error:', error);
        return NextResponse.json({ error: 'Failed to update connection.' }, { status: 500 });
    }
}

/** DELETE /api/family/connections/[id] -> disconnect. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(`/api/family/connections/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to disconnect.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/connections/[id] DELETE] error:', error);
        return NextResponse.json({ error: 'Failed to disconnect.' }, { status: 500 });
    }
}
