import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Packs API Route (Proxy Mode)
 *
 * GET /api/entitlements/packs
 * Proxies to backend /api/entitlements/packs with the user's auth context.
 * Returns the user's active credit packs details.
 */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    // Forward to backend
    const response = await backendFetch('/api/entitlements/packs', {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Packs proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit packs.' },
      { status: 500 }
    );
  }
}