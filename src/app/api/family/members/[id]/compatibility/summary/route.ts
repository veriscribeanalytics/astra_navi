import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { COMPATIBILITY_LANGS } from '@/types/family';

/**
 * GET /api/family/members/[id]/compatibility/summary?lang=en|hi|ko
 *
 * Free compatibility summary. Never charges credits (response meta.credit_cost === 0).
 * Loaded by default before the paid report. Status codes the client must handle:
 *   - 400: user profile incomplete (missing dob/tob/coords/timezone)
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

        const safeLang = (COMPATIBILITY_LANGS as readonly string[]).includes(lang) ? lang : 'en';

        const response = await backendFetch(
            `/api/family/members/${encodeURIComponent(id)}/compatibility/summary?lang=${encodeURIComponent(safeLang)}`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load compatibility summary.', ...data },
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
        console.error('[family/members/[id]/compatibility/summary GET] error:', error);
        return NextResponse.json({ error: 'Failed to load compatibility summary.' }, { status: 500 });
    }
}
