import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Balance API Route (Proxy Mode)
 *
 * GET /api/entitlements/balance
 * Proxies to backend /api/entitlements/balance with the user's auth context.
 * Returns the user's current credit balance, tier, and expiry info.
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    // Forward to backend
    const response = await backendFetch('/api/entitlements/balance', {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Balance proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit balance.' },
      { status: 500 }
    );
  }
}