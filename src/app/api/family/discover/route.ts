import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/** GET /api/family/discover?q=<term> -> search discoverable users by handle or
 *  display name. Min 2 chars enforced client-side; the backend caps at 10
 *  results and rate-limits at 20/min. */
export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const q = req.nextUrl.searchParams.get('q') ?? '';

        const response = await backendFetch(
            `/api/family/discover?q=${encodeURIComponent(q)}`,
            {
                userEmail: user.email,
                accessToken,
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Search failed.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/discover GET] error:', error);
        return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
    }
}
