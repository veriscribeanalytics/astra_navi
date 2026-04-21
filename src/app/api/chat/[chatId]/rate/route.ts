import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { RateMessageSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Rate Message API Route (Proxy Mode)
 * 
 * Proxies rating requests to the FastAPI backend.
 * Verification via session email.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;

    const { chatId } = await params;
    const body = await req.json();

    const validation = RateMessageSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const response = await backendFetch(`/api/chats/${chatId}/messages/${validation.data.messageId}/rate`, {
      method: 'PUT',
      userEmail: email as string,
      body: JSON.stringify(validation.data)
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ error: data.error || 'Failed to rate message' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Rate message error:', error);
    return NextResponse.json({ error: 'Failed to rate message' }, { status: 500 });
  }
}
