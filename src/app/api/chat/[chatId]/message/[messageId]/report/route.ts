import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { ReportMessageSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Report Message API Route (Proxy Mode)
 *
 * Proxies a report on an AI (Navi) message to the FastAPI backend. Idempotent
 * and rate-limited server-side — the 429 status is passed through so the client
 * can surface a "try again later" toast.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { chatId, messageId } = await params;
    const body = await req.json().catch(() => ({}));

    const validation = ReportMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const response = await backendFetch(`/api/chats/${chatId}/messages/${messageId}/report`, {
      method: 'POST',
      userEmail: email as string,
      accessToken: accessToken as string,
      body: JSON.stringify(validation.data),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Report message error:', error);
    return NextResponse.json({ error: 'Failed to report message' }, { status: 500 });
  }
}
