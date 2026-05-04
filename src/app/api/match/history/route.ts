import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Match History API Route (Proxy Mode)
 * 
 * Proxies requests to FastAPI backend's /api/match/history.
 * Requires authentication.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;
    const accessToken = (session.user as any).accessToken;

    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Forward to backend
    const response = await backendFetch(`/api/match/history?page=${page}&limit=${limit}`, {
      userEmail: email as string,
      accessToken: accessToken as string
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || data.detail || 'Failed to fetch match history.' 
      }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Match history proxy error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while retrieving your history.' 
    }, { status: 500 });
  }
}
