import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { SendMessageSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Send Message API Route (Proxy Mode)
 * 
 * Proxies message requests to FastAPI backend.
 * Streams the response through to the frontend.
 * Language field is now forwarded via SendMessageSchema.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const { chatId } = await params;
    const body = await req.json();

    const validation = SendMessageSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    // Proxy request to backend (returns a raw stream)
    const response = await backendFetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      userEmail: email as string,
      accessToken: accessToken as string,
      body: JSON.stringify(validation.data),
      timeoutMs: 0,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(errorData, { status: response.status });
    }

    // Return the backend's stream directly to our frontend client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
