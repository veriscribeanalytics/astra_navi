import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

// Localized payload — must not be cached by the browser or any upstream CDN,
// otherwise switching languages keeps returning the first-fetched language.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const age = req.nextUrl.searchParams.get('age');
    const lang = req.nextUrl.searchParams.get('lang') || 'en';

    const qs = new URLSearchParams();
    if (age) qs.set('age', age);
    qs.set('lang', lang);

    const response = await backendFetch(`/api/consult/tree?${qs.toString()}`, {
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || 'Failed to load consult tree.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'Vary': 'Accept-Language, Cookie',
      },
    });
  } catch (error) {
    console.error('Consult tree proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to load consult tree.' },
      { status: 500 }
    );
  }
}
