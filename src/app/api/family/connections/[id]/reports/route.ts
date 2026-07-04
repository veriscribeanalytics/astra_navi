import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { COMPATIBILITY_LANGS } from '@/types/family';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/family/connections/[id]/reports -> fetch saved reports for a linked connection.
 *
 * Mirrors /api/family/members/[id]/reports but hits the connection endpoint, so
 * linked members (source: 'linked', routed to /api/family/connections via
 * memberActionTargets) resolve instead of 404ing.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const lang = (searchParams.get('lang') || '').toLowerCase();
        const safeLang = (COMPATIBILITY_LANGS as readonly string[]).includes(lang) ? lang : '';
        const langParam = safeLang ? `?lang=${encodeURIComponent(safeLang)}` : '';

        const response = await backendFetch(`/api/family/connections/${encodeURIComponent(id)}/reports${langParam}`, {
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load connection reports.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[family/connections/[id]/reports GET] error:', error);
        return NextResponse.json({ error: 'Failed to load connection reports.' }, { status: 500 });
    }
}
