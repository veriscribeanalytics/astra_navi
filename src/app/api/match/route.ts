import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/session';
import { MatchRequestSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Kundli Matching API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend's /api/match.
 * If authenticated, backend will save the result to user's history.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const email = session?.user?.email;

    const body = await req.json();
    const validation = MatchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: validation.error.issues[0].message 
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const narrative = searchParams.get('narrative') === 'true';

    // Forward to backend
    const response = await backendFetch(`/api/match?narrative=${narrative}`, {
      method: 'POST',
      body: JSON.stringify(validation.data),
      userEmail: email || undefined, // Forward JWT if available
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || data.detail || 'Celestial matching failed.' 
      }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Match proxy error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred during celestial alignment.' 
    }, { status: 500 });
  }
}
