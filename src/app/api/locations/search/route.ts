import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

/**
 * Location Search API Route (Proxy Mode)
 *
 * Proxies location/geocoding search requests to the FastAPI backend.
 * Used for birth place autocomplete with lat/lon/timezone data.
 * No auth required — this is a public lookup endpoint.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const response = await backendFetch(`/api/locations/search?q=${encodeURIComponent(q.trim())}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Log only status + a non-secret code/message, never the backend body.
      console.error('[Locations API] Backend returned', response.status, ':', {
        code: errorData?.code || null,
        message: errorData?.error || errorData?.detail || null,
      });
      return NextResponse.json({ error: errorData.error || errorData.detail || 'Location search failed.' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ error: 'Location search failed.' }, { status: 500 });
  }
}