import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/** GET /api/notifications -> cursor-paginated, newest-first feed. Forwards
 *  limit / before_id / unread_only / lang to the backend, which renders
 *  title+body in the user's profile language (or ?lang override). */
export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const sp = req.nextUrl.searchParams;
        const qs = new URLSearchParams();
        const limit = sp.get('limit');
        const beforeId = sp.get('before_id');
        const unreadOnly = sp.get('unread_only');
        const lang = sp.get('lang');
        if (limit) qs.set('limit', limit);
        if (beforeId) qs.set('before_id', beforeId);
        if (unreadOnly) qs.set('unread_only', unreadOnly);
        if (lang) qs.set('lang', lang);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';

        const response = await backendFetch(`/api/notifications${suffix}`, {
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load notifications.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[notifications GET] error:', error);
        return NextResponse.json({ error: 'Failed to load notifications.' }, { status: 500 });
    }
}
