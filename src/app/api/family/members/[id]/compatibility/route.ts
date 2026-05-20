import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * GET /api/family/members/[id]/compatibility?lang=en|hi|ko
 *
 * First call charges credits per relationship_type. Subsequent calls for the
 * same (member, lang) return cached results free (response.cached === true).
 * Status codes the client must handle:
 *   - 400: user profile incomplete (missing dob/tob/coords/timezone)
 *   - 402: insufficient credits — body is the standard paywall detail
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

        const allowedLangs = new Set(['en', 'hi', 'ko']);
        const safeLang = allowedLangs.has(lang) ? lang : 'en';

        const response = await backendFetch(
            `/api/family/members/${encodeURIComponent(id)}/compatibility?lang=${encodeURIComponent(safeLang)}`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load compatibility.', ...data },
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
        console.error('[family/members/[id]/compatibility GET] error:', error);
        return NextResponse.json({ error: 'Failed to load compatibility.' }, { status: 500 });
    }
}
