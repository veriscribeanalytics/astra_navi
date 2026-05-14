import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Subscription API Route (Proxy Mode)
 *
 * GET /api/entitlements/subscription
 * Proxies to backend /api/entitlements/subscription with the user's auth context.
 * Returns the user's current active subscription details.
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    // Forward to backend
    const response = await backendFetch('/api/entitlements/subscription', {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Subscription proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details.' },
      { status: 500 }
    );
  }
}