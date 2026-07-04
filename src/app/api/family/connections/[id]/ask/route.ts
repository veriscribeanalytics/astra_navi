import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/family/connections/[id]/ask
 *
 * Creates a pre-seeded chat thread + starter prefill for "ask about this
 * relationship" against a linked connection — gated on bidirectional sharing.
 * Empty body forwarded. NOT cached. 10/min per viewer. Returns SHARING_REQUIRED
 * when sharing isn't mutual (forwarded as the backend's error body). Shape
 * identical to the member ask endpoint.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(
            `/api/family/connections/${encodeURIComponent(id)}/ask`,
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
        console.error('[family/connections/[id]/ask POST] error:', error);
        return NextResponse.json({ error: 'Failed to start relationship chat.' }, { status: 500 });
    }
}
