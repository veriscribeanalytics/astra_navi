import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Payments Verification API Route (Proxy Mode)
 *
 * POST /api/payments/verify
 * Req: { "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }
 * Res: { "success": true, "status": "fulfilled", ... }
 */
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;

    const body = await req.json();

    // Forward to backend
    const response = await backendFetch('/api/payments/verify', {
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
    console.error('[Verify Payment proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment.' },
      { status: 500 }
    );
  }
}
