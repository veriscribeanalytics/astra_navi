import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Voice Token API Route (Proxy Mode)
 *
 * Mints a short-lived, voice-scoped token used to authenticate the STT
 * WebSocket (`wss://.../api/voice/stt`). The browser cannot proxy a WebSocket
 * through Next, so it connects to the FastAPI backend directly — but it must
 * NOT carry the full access token or the server-only X-API-Key. This route
 * exchanges the user's session (via server-injected X-API-Key + JWT) for a
 * scoped ~120s token the WS accepts.
 */
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const response = await backendFetch('/api/voice/token', {
      method: 'POST',
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || 'Failed to mint voice token' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Voice token proxy error:', error);
    return NextResponse.json({ error: 'Failed to mint voice token' }, { status: 500 });
  }
}
