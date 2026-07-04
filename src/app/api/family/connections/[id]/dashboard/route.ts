import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { FAMILY_DASHBOARD_LANGS } from '@/types/familyDashboard';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/family/connections/[id]/dashboard?lang=...
 *
 * Daily "bond" dashboard for a linked connection — gated on bidirectional
 * sharing. Same shape as the member dashboard; returns SHARING_REQUIRED when
 * sharing isn't mutual (forwarded as the backend's error body). Pro+ vs free
 * paywall behavior mirrors the member dashboard exactly.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const lang = (req.nextUrl.searchParams.get('lang') || 'en').toLowerCase();
        const safeLang = (FAMILY_DASHBOARD_LANGS as readonly string[]).includes(lang) ? lang : 'en';

        const response = await backendFetch(
            `/api/family/connections/${encodeURIComponent(id)}/dashboard?lang=${encodeURIComponent(safeLang)}`,
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
            status: response.status,
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            },
        });
    } catch (error) {
        console.error('[family/connections/[id]/dashboard GET] error:', error);
        return NextResponse.json({ error: 'Failed to load family dashboard.' }, { status: 500 });
    }
}
