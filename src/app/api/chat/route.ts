import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { CreateChatSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Chat List API Route (Proxy Mode)
 * 
 * Proxies list requests to the FastAPI backend.
 * Uses PostgreSQL for chat storage.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;

    const limit = req.nextUrl.searchParams.get('limit') || '50';
    const cursor = req.nextUrl.searchParams.get('cursor') || '';

    const response = await backendFetch(`/api/chats?limit=${limit}&cursor=${cursor}`, {
      userEmail: email as string
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.detail || 'Failed to load celestial conversations' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('List chats error:', error);
    return NextResponse.json({ error: 'Failed to load celestial conversations' }, { status: 500 });
  }
}

/**
 * Create Chat API Route (Proxy Mode)
 * 
 * Proxies creation requests to the FastAPI backend.
 * Prevents duplicate empty chats logic now lives in the backend.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;

    const body = await req.json();
    const validation = CreateChatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const response = await backendFetch('/api/chats', {
      method: 'POST',
      userEmail: email as string,
      body: JSON.stringify(validation.data)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.detail || 'Failed to create chat' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
