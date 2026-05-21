import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    // Forward ?lang= to the backend so catalog comes back localized.
    const lang = req.nextUrl.searchParams.get('lang');
    const path = lang
      ? `/api/chat/avatars?lang=${encodeURIComponent(lang)}`
      : '/api/chat/avatars';

    const response = await backendFetch(path, {
      userEmail: email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || 'Failed to load avatars' },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('List avatars error:', error);
    return NextResponse.json({ error: 'Failed to load avatars' }, { status: 500 });
  }
}
