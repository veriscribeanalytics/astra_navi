import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * GET  /api/family/members  → list current user's family members
 * POST /api/family/members  → create a new family member
 *
 * Forwards directly to backend /api/family/members.
 * Important status codes the client should handle:
 *   - 400: validation (e.g. consentAcknowledged !== true)
 *   - 402: free-tier cap (body.code === "FAMILY_FREE_TIER_CAP")
 */

export async function GET(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const response = await backendFetch('/api/family/members', {
            userEmail: user.email,
            accessToken,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to load family members.', ...data },
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
        console.error('[family/members GET] error:', error);
        return NextResponse.json({ error: 'Failed to load family members.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        const body = await req.json();

        const response = await backendFetch('/api/family/members', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to create family member.', ...data },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('[family/members POST] error:', error);
        return NextResponse.json({ error: 'Failed to create family member.' }, { status: 500 });
    }
}
