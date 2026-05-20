import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;
    const email = user?.email;

    const response = await backendFetch('/api/chat/avatars', {
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
