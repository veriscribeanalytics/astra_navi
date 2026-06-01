import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * GET    /api/family/members/[id]  → fetch a single family member
 * PATCH  /api/family/members/[id]  → update editable fields
 * DELETE /api/family/members/[id]  → remove a family member
 */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(`/api/family/members/${encodeURIComponent(id)}`, {
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load family member.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            },
        });
    } catch (error) {
        console.error('[family/members/[id] GET] error:', error);
        return NextResponse.json({ error: 'Failed to load family member.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const body = await req.json();

        const response = await backendFetch(`/api/family/members/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to update family member.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[family/members/[id] PATCH] error:', error);
        return NextResponse.json({ error: 'Failed to update family member.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(`/api/family/members/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            userEmail: user.email,
            accessToken,
        });

        // DELETE may return empty body; guard json parsing
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to delete family member.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data || { success: true });
    } catch (error) {
        console.error('[family/members/[id] DELETE] error:', error);
        return NextResponse.json({ error: 'Failed to delete family member.' }, { status: 500 });
    }
}
