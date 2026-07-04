import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { FAMILY_DASHBOARD_LANGS } from '@/types/familyDashboard';

/**
 * GET /api/family/members/[id]/dashboard?lang=<en|hi|ko|ta|te|kn|bn|mr|pa|gu|ml>
 *
 * Daily "bond" dashboard for a manual family member. Pro+ fields (chips,
 * time_triggers, relationship_areas, and the Pro+ guidance sub-fields) are
 * absent for free-tier viewers; the body carries a `paywall` field only when
 * free & not accessible. Backend caches 1h per (viewer, day, tz, birth-location,
 * access-scope, lang).
 *
 * Pass-through notes:
 *  - `calculation_unavailable: true` is returned by the backend instead of a
 *    500 when transit calc fails — forward it so the client renders the
 *    "try again later" empty state rather than empty cards.
 *  - `paywall` is a normal 200 body field (soft block); forward as-is.
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
            `/api/family/members/${encodeURIComponent(id)}/dashboard?lang=${encodeURIComponent(safeLang)}`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: data.error || data.detail || 'Failed to load family dashboard.',
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
        console.error('[family/members/[id]/dashboard GET] error:', error);
        return NextResponse.json({ error: 'Failed to load family dashboard.' }, { status: 500 });
    }
}
