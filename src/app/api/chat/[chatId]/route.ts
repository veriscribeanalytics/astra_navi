import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Single Chat API Route (Proxy Mode)
 * 
 * GET: Proxies request to FastAPI backend to fetch chat messages from PostgreSQL.
 * DELETE: Proxies deletion request to FastAPI backend.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { chatId } = await params;

    const response = await backendFetch(`/api/chats/${chatId}`, {
      userEmail: email as string,
      accessToken: accessToken as string
    });

    const data = await response.json();
    console.log('[GET /api/chat/:chatId] Backend status:', response.status, 'Data keys:', Object.keys(data), 'Has chat?', !!data.chat, 'Has messages?', !!data.chat?.messages?.length);

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.detail || 'Failed to load conversation' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch chat error:', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { chatId } = await params;

    const response = await backendFetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
      userEmail: email as string,
      accessToken: accessToken as string
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.detail || 'Failed to delete conversation' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
