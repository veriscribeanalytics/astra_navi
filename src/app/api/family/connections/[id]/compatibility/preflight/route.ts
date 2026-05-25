import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/family/connections/[id]/compatibility/preflight
 *  -> preflight status for linked-compat: cache availability, staleness, and
 *     optional refresh CTA metadata.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(
            `/api/family/connections/${encodeURIComponent(id)}/compatibility/preflight`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to check compatibility preflight.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[family/connections/[id]/compatibility/preflight GET] error:', error);
        return NextResponse.json({ error: 'Failed to check compatibility preflight.' }, { status: 500 });
    }
}
