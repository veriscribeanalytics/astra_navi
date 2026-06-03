import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * User Consent API Route (Proxy Mode)
 *
 * Manages DPDP Act 2023 consent audit records.
 *
 * GET    /api/user/consent          — List user's consent records
 * POST   /api/user/consent          — Record a new consent event
 * DELETE /api/user/consent          — Withdraw all optional consent
 */

/** GET — Retrieve the authenticated user's consent audit log. */
export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;

    const { searchParams } = new URL(req.url);
    const consentType = searchParams.get('type');
    const qs = consentType ? `?type=${encodeURIComponent(consentType)}` : '';

    const response = await backendFetch(`/api/user/consent${qs}`, {
      method: 'GET',
      userEmail: user?.email as string,
      accessToken: accessToken as string,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Consent GET proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve consent records.' },
      { status: 500 }
    );
  }
}

/** POST — Record a new consent event for the audit trail. */
export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    // Auth is optional for anonymous cookie consent (pre-registration).
    // We still accept the request but mark it as anonymous.
    const userEmail = authContext?.user?.email || undefined;
    const accessToken = authContext?.accessToken || undefined;

    const body = await req.json();

    // Forward to backend — backend handles whether auth is required
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await backendFetch('/api/user/consent', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        userEmail,
        // Backend can resolve userId from token or use the anonymous sessionId
      }),
      userEmail: userEmail || 'anonymous',
      accessToken: accessToken || '',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Consent POST proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record consent.' },
      { status: 500 }
    );
  }
}

/** DELETE — Withdraw optional consent categories. */
export async function DELETE(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;

    const body = await req.json().catch(() => ({}));

    const response = await backendFetch('/api/user/consent', {
      method: 'DELETE',
      body: JSON.stringify(body),
      userEmail: user?.email as string,
      accessToken: accessToken as string,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Consent DELETE proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw consent.' },
      { status: 500 }
    );
  }
}
