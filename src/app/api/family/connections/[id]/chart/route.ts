import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * GET /api/family/connections/[id]/chart — free, no credits.
 *
 * Mirrors /api/family/members/[id]/chart but hits the connection endpoint, so
 * linked members (source: 'linked', routed to /api/family/connections via
 * memberActionTargets) resolve instead of 404ing.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;

        const response = await backendFetch(
            `/api/family/connections/${encodeURIComponent(id)}/chart`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load chart.', ...data },
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
        console.error('[family/connections/[id]/chart GET] error:', error);
        return NextResponse.json({ error: 'Failed to load chart.' }, { status: 500 });
    }
}
