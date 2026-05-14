import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Paywall Features Batch Check API Route (Proxy Mode)
 *
 * GET /api/entitlements/paywall/features
 * Proxies to backend /api/entitlements/paywall/features with the user's auth context.
 * Returns paywall status for all features in a single call.
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    // Forward to backend
    const response = await backendFetch('/api/entitlements/paywall/features', {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Paywall features proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check feature entitlements.' },
      { status: 500 }
    );
  }
}