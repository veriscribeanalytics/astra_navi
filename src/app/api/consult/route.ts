import { NextRequest } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { ConsultRequestSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;
    const accessToken = (session.user as any).accessToken;

    const body = await req.json();
    const validation = ConsultRequestSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Forward to backend — stream the response back
    const response = await backendFetch('/api/consult', {
      method: 'POST',
      body: JSON.stringify({ ...validation.data, name: session.user?.name || 'Friend' }),
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    if (!response.ok) {
      const err = await response.json();
      return Response.json(
        { error: err.error || 'Consultation failed.' },
        { status: response.status }
      );
    }

    // Pass through SSE stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Consult proxy error:', error);
    return Response.json(
      { error: 'Unexpected error during consultation.' },
      { status: 500 }
    );
  }
}
