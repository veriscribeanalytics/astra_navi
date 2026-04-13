import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getUserAnalyticsSummary } from '@/lib/chatAnalytics';

/**
 * GET /api/analytics/summary?email=user@example.com
 * Get user's analytics summary (preserved from deleted chats)
 * 
 * Returns:
 * - Total chats deleted
 * - Total ratings given
 * - Overall average rating
 * - Common feedback tags
 * 
 * Privacy: NO message content, only aggregated metrics
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('astra-navi-database');

    const summary = await getUserAnalyticsSummary(db, email);

    return NextResponse.json({
      userEmail: email,
      ...summary,
      privacyNote: 'Analytics contain NO message content, only ratings and feedback',
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
