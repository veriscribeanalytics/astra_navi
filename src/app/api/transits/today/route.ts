import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);

        const response = await backendFetch('/api/transits/today', {
            ...(authContext
                ? { userEmail: authContext.user.email, accessToken: authContext.accessToken }
                : {}),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load transits.', ...data },
                { status: response.status },
            );
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate, proxy-revalidate',
                'Vary': 'Cookie',
            },
        });
    } catch (error) {
        console.error('[transits/today GET] error:', error);
        return NextResponse.json({ error: 'Failed to load transits.' }, { status: 500 });
    }
}