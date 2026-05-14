import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Paywall Check API Route (Proxy Mode)
 *
 * GET /api/entitlements/paywall?feature=chat_message
 * Proxies to backend /api/entitlements/paywall with the user's auth context.
 * Returns the paywall status for a single feature.
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { searchParams } = new URL(req.url);
    const feature = searchParams.get('feature');

    if (!feature) {
      return NextResponse.json(
        { error: 'Missing required query parameter: feature' },
        { status: 400 }
      );
    }

    // Forward to backend
    const response = await backendFetch(`/api/entitlements/paywall?feature=${encodeURIComponent(feature)}`, {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      // Pass through backend status (including 402 for blocked features)
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Paywall proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check entitlement.' },
      { status: 500 }
    );
  }
}