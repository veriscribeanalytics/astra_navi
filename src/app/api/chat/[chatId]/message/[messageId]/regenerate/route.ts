import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { RegenerateMessageSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Regenerate Message API Route (Proxy Mode)
 *
 * Replaces an existing backend AI message instead of creating a duplicate turn.
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
    const validation = RegenerateMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const response = await backendFetch(`/api/chats/${chatId}/messages/${messageId}/regenerate`, {
      method: 'POST',
      userEmail: email as string,
      accessToken: accessToken as string,
      body: JSON.stringify(validation.data),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Regenerate message error:', error);
    return NextResponse.json({ error: 'Failed to regenerate message' }, { status: 500 });
  }
}
