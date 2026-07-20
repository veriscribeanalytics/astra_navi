import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin entitlements catalog management.
 *
 * POST /api/entitlements/catalog — create a product. Body fields (snake_case,
 * per backend contract):
 *   product_id, product_type (subscription|one_time_pack|one_time_report),
 *   category, tier (subscription only), credits, cycle_days, price_inr,
 *   price_usd, currency, is_active, sale_price_inr, sale_ends_at, metadata.
 *
 * GET (passthrough) — list catalog. Reuses the public catalog endpoint, which
 * the backend makes admin-readable; included here so the admin UI has a single
 * admin-scoped base path.
 */
export async function POST(req: NextRequest) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        let body: string | undefined;
        try {
            body = JSON.stringify(await req.json());
        } catch {
            return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
        }

        const response = await backendFetch('/api/entitlements/catalog', {
            method: 'POST',
            userEmail: user.email,
            accessToken,
            body,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || 'Failed to create catalog product.' },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('[admin catalog POST] error:', error);
        return NextResponse.json({ error: 'Failed to create catalog product.' }, { status: 500 });
    }
}
