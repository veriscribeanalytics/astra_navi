import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Payments Create Order API Route (Proxy Mode)
 *
 * POST /api/payments/create-order?lang=en
 * Req: { "product_id": "chat_pack_50" }
 * Res: { "order_id": "...", "amount": 4900, "currency": "INR", "key_id": "...", ... }
 */
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';

    // Forward to backend
    const response = await backendFetch(`/api/payments/create-order?lang=${lang}`, {
      method: 'POST',
      body: JSON.stringify(body),
      userEmail: user?.email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Create Order proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order.' },
      { status: 500 }
    );
  }
}
