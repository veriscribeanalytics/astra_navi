import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';
import { COMPATIBILITY_LANGS } from '@/types/family';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/family/connections/[id]/compatibility
 *  -> run paid linked-compat. Returns SHARING_REQUIRED when sharing isn't mutual.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const { id } = await params;
        const lang = (req.nextUrl.searchParams.get('lang') || 'en').toLowerCase();
        const safeLang = (COMPATIBILITY_LANGS as readonly string[]).includes(lang) ? lang : 'en';

        const response = await backendFetch(
            `/api/family/connections/${encodeURIComponent(id)}/compatibility?lang=${encodeURIComponent(safeLang)}`,
            { userEmail: user.email, accessToken }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load compatibility.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/connections/[id]/compatibility GET] error:', error);
        return NextResponse.json({ error: 'Failed to load compatibility.' }, { status: 500 });
    }
}
