import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, unauthorizedResponse } from '@/lib/session';
import { backendFetch } from '@/lib/backendClient';

/**
 * Admin entitlements catalog PATCH/DELETE for a single product.
 *   PATCH  /api/entitlements/catalog/{product_id} — update mutable columns
 *          (product_id is immutable). Body: any subset of mutable cols.
 *   DELETE /api/entitlements/catalog/{product_id} — remove a product.
 *          409 if referenced by a subscription/pack (forwarded as-is).
 */
async function forward(
    req: NextRequest,
    method: 'PATCH' | 'DELETE',
    productId: string
) {
    try {
        const authContext = await getAuthContext(req);
        if (!authContext) return unauthorizedResponse();
        const { user, accessToken } = authContext;

        let body: string | undefined;
        if (method === 'PATCH') {
            try {
                body = JSON.stringify(await req.json());
            } catch {
                return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
            }
        }

        const response = await backendFetch(
            `/api/entitlements/catalog/${encodeURIComponent(productId)}`,
            {
                method,
                userEmail: user.email,
                accessToken,
                ...(body ? { body } : {}),
            }
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || data.detail || `Failed to ${method.toLowerCase()} product.` },
                { status: response.status }
            );
        }
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error(`[admin catalog/[id] ${method}] error:`, error);
        return NextResponse.json({ error: `Failed to ${method.toLowerCase()} product.` }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ product_id: string }> }
) {
    const { product_id } = await params;
    return forward(req, 'PATCH', product_id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ product_id: string }> }
) {
    const { product_id } = await params;
    return forward(req, 'DELETE', product_id);
}
