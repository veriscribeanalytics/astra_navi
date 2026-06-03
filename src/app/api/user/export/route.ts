import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Data Export API Route (Proxy Mode)
 *
 * Implements DPDP Act 2023 Section 11 — Right to Data Portability.
 * Returns all personal data held about the authenticated user in a
 * structured, machine-readable JSON format.
 *
 * GET /api/user/export
 *   Returns JSON with all user data including:
 *   - Profile & birth details
 *   - Consent records
 *   - Chat history metadata
 *   - Payment / credit history
 *   - Family member data
 */

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req);
    if (!authContext) return unauthorizedResponse();
    const { user, accessToken } = authContext;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const response = await backendFetch(
      `/api/user/export?format=${encodeURIComponent(format)}`,
      {
        method: 'GET',
        userEmail: user?.email as string,
        accessToken: accessToken as string,
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.error || data.detail || 'Failed to export user data.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return with appropriate headers for download if needed
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Export-Timestamp': new Date().toISOString(),
    };

    if (format === 'download') {
      headers['Content-Disposition'] =
        'attachment; filename="astra_navi_data_export.json"';
    }

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('[Data Export proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data.' },
      { status: 500 }
    );
  }
}
