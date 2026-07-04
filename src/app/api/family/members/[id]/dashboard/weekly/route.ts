import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { FAMILY_DASHBOARD_LANGS } from '@/types/familyDashboard';

/**
 * GET /api/family/members/[id]/dashboard/weekly?lang=...
 *
 * Weekly bond graph (Mon→Sun, today flagged) + summary for a manual member.
 * Free tier gets the graph + summary but `summary.best_day_note` is stripped;
 * `paywall` is present only for free. 10/min per viewer rate limit.
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
        const { searchParams } = new URL(req.url);
        const lang = (searchParams.get('lang') || 'en').toLowerCase();
        const safeLang = (FAMILY_DASHBOARD_LANGS as readonly string[]).includes(lang) ? lang : 'en';

        const response = await backendFetch(
            `/api/family/members/${encodeURIComponent(id)}/dashboard/weekly?lang=${encodeURIComponent(safeLang)}`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: data.error || data.detail || 'Failed to load weekly bond.',
                    ...(data.calculation_unavailable ? { calculation_unavailable: true } : {}),
                    ...(data.message ? { message: data.message } : {}),
                    ...data,
                },
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
        console.error('[family/members/[id]/dashboard/weekly GET] error:', error);
        return NextResponse.json({ error: 'Failed to load weekly bond.' }, { status: 500 });
    }
}
