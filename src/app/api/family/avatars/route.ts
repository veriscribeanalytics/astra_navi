import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * GET /api/family/avatars -> get the list of available family avatars from backend
 */
export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const response = await backendFetch('/api/family/avatars', {
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load family avatars.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[family/avatars GET] error:', error);
        return NextResponse.json({ error: 'Failed to load family avatars.' }, { status: 500 });
    }
}
