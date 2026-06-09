import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/family/connections/[id]/compatibility/summary
 *  -> free linked-compat summary. Never charges credits. Returns
 *     SHARING_REQUIRED when sharing isn't mutual.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const lang = req.nextUrl.searchParams.get('lang') || 'en';

        const response = await backendFetch(
            `/api/family/connections/${encodeURIComponent(id)}/compatibility/summary?lang=${encodeURIComponent(lang)}`,
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
            status: response.status,
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            },
        });
    } catch (error) {
        console.error('[family/connections/[id]/compatibility/summary GET] error:', error);
        return NextResponse.json({ error: 'Failed to load compatibility summary.' }, { status: 500 });
    }
}
