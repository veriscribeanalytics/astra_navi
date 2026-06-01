import { NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Auth Me API Route (Proxy Mode)
 *
 * Verifies the current access token by forwarding to the backend's
 * /api/auth/me endpoint. Returns 401 if the token is missing,
 * locally expired, or rejected by the backend.
 */
export async function GET(req: Request) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const response = await backendFetch('/api/auth/me', {
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Token validation failed' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Auth me error:', error);
        return NextResponse.json({ error: 'Failed to verify session.' }, { status: 500 });
    }
}
