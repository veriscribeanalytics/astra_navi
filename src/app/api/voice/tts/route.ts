import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { VoiceTtsSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Voice TTS API Route (Proxy Mode)
 *
 * Proxies text-to-speech requests to the FastAPI backend and streams the raw
 * MP3 audio straight back to the browser. Runs server-side so the backend
 * X-API-Key (a server-only secret) is never exposed to the client — the browser
 * only ever hits this same-origin route with its session cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const body = await req.json();
    const validation = VoiceTtsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const response = await backendFetch('/api/voice/tts', {
      method: 'POST',
      userEmail: email as string,
      accessToken: accessToken as string,
      body: JSON.stringify(validation.data),
      // TTS synthesis can take longer than a JSON round-trip; don't let the
      // default 20s timeout clip a long reply.
      timeoutMs: 0,
    });

    if (!response.ok) {
      // Error responses are JSON; pass the backend status + message through.
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || errorData.detail || 'Speech synthesis failed' },
        { status: response.status }
      );
    }

    // Stream the MP3 bytes straight to the client, preserving content-type.
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Voice TTS proxy error:', error);
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 });
  }
}
