import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/session';
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
    const authContext = await getAuthContext(req);
    const email = authContext?.user?.email;
    const accessToken = authContext?.accessToken;

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
      userEmail: (email as string) || undefined,
      accessToken: accessToken as string
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || data.detail || 'Analysis failed. Please try again.' 
      }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Match proxy error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred during analysis.' 
    }, { status: 500 });
  }
}
