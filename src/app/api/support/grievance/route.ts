import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Grievance Submission API Route (Proxy Mode)
 *
 * POST /api/support/grievance
 *
 * DPDP Act 2023, Section 13 — provides Data Principals with a
 * grievance redressal mechanism. Submissions are forwarded to
 * the backend for tracking and response.
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

    const response = await backendFetch('/api/support/grievance', {
      method: 'POST',
      body: JSON.stringify({
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
        { error: data.error || data.detail || 'Failed to submit grievance.' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Grievance POST proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit grievance. Please try again later.' },
      { status: 500 }
    );
  }
}
