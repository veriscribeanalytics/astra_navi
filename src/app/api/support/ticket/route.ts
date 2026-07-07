import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Support Ticket Submission API Route (Proxy Mode)
 *
 * POST /api/support/ticket
 *
 * General user-support tickets from the Help Center (/support).
 * This is distinct from /api/support/grievance, which is the DPDP
 * Act 2023 Section 13 legal grievance channel. Submissions are
 * forwarded to the backend for tracking and email response.
 */
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;

    const body = await req.json();

    if (!body.subject || !body.description) {
      return NextResponse.json(
        { error: 'Subject and description are required.' },
        { status: 400 }
      );
    }

    const response = await backendFetch('/api/support/ticket', {
      method: 'POST',
      body: JSON.stringify({
        category: body.category || 'Something Else',
        subject: body.subject,
        description: body.description,
        submittedAt: new Date().toISOString(),
      }),
      userEmail: user?.email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || 'Failed to submit support ticket.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Support ticket POST proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit support ticket. Please try again later.' },
      { status: 500 }
    );
  }
}
