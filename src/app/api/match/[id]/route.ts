import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Individual Match Result API Route
 * 
 * Supports:
 * GET: Fetch a single saved match result
 * DELETE: Remove a result from user's history
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;
    const accessToken = (session.user as any).accessToken;

    const { id } = await params;

    const response = await backendFetch(`/api/match/${id}`, {
      userEmail: email as string,
      accessToken: accessToken as string
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || data.detail || 'Failed to fetch match result.' 
      }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Match fetch error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while retrieving the match.' 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return unauthorizedResponse();
    const email = session.user?.email;
    const accessToken = (session.user as any).accessToken;

    const { id } = await params;

    const response = await backendFetch(`/api/match/${id}`, {
      method: 'DELETE',
      userEmail: email as string,
      accessToken: accessToken as string
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: data.error || data.detail || 'Failed to delete match result.' 
      }, { status: response.status });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Match delete error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while deleting the match.' 
    }, { status: 500 });
  }
}
