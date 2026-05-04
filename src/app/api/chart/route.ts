import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { ChartRequestSchema } from '@/lib/schemas';
import { backendFetch } from '@/lib/backendClient';

/**
 * Chart Calculation API Route (Proxy Mode)
 * 
 * Proxies chart calculation requests to FastAPI backend.
 * Backend handles PostgreSQL profile updates and extraction.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;
    const accessToken = (session.user as any).accessToken;

    const body = await req.json();
    const validation = ChartRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const response = await backendFetch('/api/chart', {
      method: 'POST',
      userEmail: email as string,
      accessToken: accessToken as string,
      body: JSON.stringify(validation.data),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.detail || 'Failed to fetch chart data' }, { status: response.status });
    }

    // Backend already handles auto-updating the user profile in PostgreSQL
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chart proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
