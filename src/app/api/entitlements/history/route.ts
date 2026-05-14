import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Credit History API Route (Proxy Mode)
 *
 * GET /api/entitlements/history?limit=20&offset=0&action=consume
 * Proxies to backend /api/entitlements/history with the user's auth context.
 * Returns the user's credit usage history (ledger entries).
 *
 * Query params:
 *   - limit: max entries to return (default 20)
 *   - offset: offset for pagination (default 0)
 *   - action: filter by action type (consume, grant, refund, reserve, expire)
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';
    const action = searchParams.get('action') || '';

    // Build backend URL with all query params
    const backendParams = new URLSearchParams();
    backendParams.set('limit', limit);
    backendParams.set('offset', offset);
    if (action) backendParams.set('action', action);

    // Forward to backend
    const response = await backendFetch(`/api/entitlements/history?${backendParams.toString()}`, {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[History proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit history.' },
      { status: 500 }
    );
  }
}