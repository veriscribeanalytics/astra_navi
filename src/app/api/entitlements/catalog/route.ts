import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendClient';

/**
 * Catalog API Route (Proxy Mode)
 *
 * GET /api/entitlements/catalog?lang=en&product_type=subscription
 * Proxies to backend /api/entitlements/catalog with optional query params:
 *   - lang: language code for localized product names (en, hi, etc.)
 *   - product_type: filter by type ('subscription' or 'one_time_pack')
 *
 * Returns the full product catalog (subscriptions + credit packs).
 * This endpoint is public — no auth required for catalog viewing.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || '';
    const productType = searchParams.get('product_type') || '';

    // Build backend URL with passthrough query params
    const backendParams = new URLSearchParams();
    if (lang) backendParams.set('lang', lang);
    if (productType) backendParams.set('product_type', productType);

    const backendUrl = `/api/entitlements/catalog${backendParams.toString() ? `?${backendParams.toString()}` : ''}`;

    // Catalog is public — no auth context needed
    const response = await backendFetch(backendUrl);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Catalog proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product catalog.' },
      { status: 500 }
    );
  }
}