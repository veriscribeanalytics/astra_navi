'use client';

import { clientFetch } from '@/lib/apiClient';

/**
 * Admin helpers for the entitlements catalog and FCM admin endpoints.
 *
 * All routes require `require_admin` on the backend (JWT). The BFF admin
 * routes under `/api/admin/*` forward the JWT via session cookies.
 */

export type CatalogProductType = 'subscription' | 'one_time_pack' | 'one_time_report';

export interface CatalogProduct {
    product_id: string;
    product_type: CatalogProductType;
    category?: string;
    tier?: string;
    credits?: number;
    cycle_days?: number;
    price_inr: number;
    price_usd?: number;
    currency?: string;
    is_active?: boolean;
    sale_price_inr?: number | null;
    sale_ends_at?: string | null;
    metadata?: Record<string, unknown> | null;
}

export interface FcmTokenRow {
    id: number | string;
    token: string;
    platform: string;
    user_id: number | string;
    user_email?: string;
    active: boolean;
    created_at?: string;
    last_used_at?: string | null;
}

export interface FcmTokensResponse {
    items: FcmTokenRow[];
    total?: number;
    page?: number;
    limit?: number;
}

export interface FcmStats {
    total_tokens?: number;
    active_tokens?: number;
    by_platform?: Record<string, number>;
    reminders_enabled?: number;
    [key: string]: unknown;
}

export interface FcmBroadcastPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

/** Validation rule from the backend notes: `sale_price_inr < price_inr`.
 *  The backend currently 500s on violation; we validate client-side. */
export function validateSalePrice(priceInr: number, salePriceInr?: number | null): string | null {
    if (salePriceInr == null || salePriceInr === undefined) return null;
    if (typeof salePriceInr !== 'number' || Number.isNaN(salePriceInr)) {
        return 'Sale price must be a number.';
    }
    if (salePriceInr <= 0) return 'Sale price must be greater than zero.';
    if (salePriceInr >= priceInr) {
        return 'Sale price must be less than the regular price.';
    }
    return null;
}

/** `sale_ends_at` must be paired with `sale_price_inr`. */
export function validateSalePair(
    priceInr: number,
    salePriceInr?: number | null,
    saleEndsAt?: string | null
): string | null {
    const hasSalePrice = salePriceInr != null && salePriceInr !== undefined;
    const hasSaleEnds = !!saleEndsAt;
    if (hasSalePrice && !hasSaleEnds) {
        return 'A sale end date is required when a sale price is set.';
    }
    if (!hasSalePrice && hasSaleEnds) {
        return 'Sale end date is set without a sale price.';
    }
    if (hasSalePrice && hasSaleEnds) {
        const priceErr = validateSalePrice(priceInr, salePriceInr);
        if (priceErr) return priceErr;
        const endsAt = new Date(saleEndsAt as string);
        if (Number.isNaN(endsAt.getTime())) return 'Sale end date is not a valid date.';
        if (endsAt.getTime() <= Date.now()) return 'Sale end date must be in the future.';
    }
    return null;
}

export function validateProduct(product: CatalogProduct): string | null {
    if (!product.product_id || !/^[a-z0-9_-]+$/i.test(product.product_id)) {
        return 'Product ID must be non-empty and contain only letters, numbers, dashes, or underscores.';
    }
    if (!['subscription', 'one_time_pack', 'one_time_report'].includes(product.product_type)) {
        return 'Product type must be subscription, one_time_pack, or one_time_report.';
    }
    if (product.product_type === 'subscription' && !product.tier) {
        return 'Tier is required for subscription products.';
    }
    if (typeof product.price_inr !== 'number' || product.price_inr <= 0) {
        return 'Price (INR) must be greater than zero.';
    }
    return validateSalePair(
        product.price_inr,
        product.sale_price_inr,
        product.sale_ends_at
    );
}

/* ------------------------------------------------------------------ */
/* Catalog API                                                          */
/* ------------------------------------------------------------------ */

export async function createCatalogProduct(product: CatalogProduct): Promise<CatalogProduct> {
    const err = validateProduct(product);
    if (err) throw new AdminValidationError(err);
    const res = await clientFetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    const data = await res.json().catch(() => ({})) as Partial<CatalogProduct> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new AdminError(data.error || data.detail || 'Failed to create product.', res.status);
    }
    return data as CatalogProduct;
}

export async function updateCatalogProduct(
    productId: string,
    patch: Partial<CatalogProduct>
): Promise<CatalogProduct> {
    // product_id is immutable — strip it from the patch defensively.
    const { product_id: _omit, ...rest } = patch;
    const res = await clientFetch(`/api/admin/catalog/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
    });
    const data = await res.json().catch(() => ({})) as Partial<CatalogProduct> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new AdminError(data.error || data.detail || 'Failed to update product.', res.status);
    }
    return data as CatalogProduct;
}

export async function deleteCatalogProduct(productId: string): Promise<void> {
    const res = await clientFetch(`/api/admin/catalog/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new AdminError(
            data.error || data.detail || 'Failed to delete product.',
            res.status
        );
    }
}

/* ------------------------------------------------------------------ */
/* FCM admin API                                                       */
/* ------------------------------------------------------------------ */

export async function getFcmStats(): Promise<FcmStats> {
    const res = await clientFetch('/api/admin/fcm/stats', { method: 'GET' });
    const data = await res.json().catch(() => ({})) as Partial<FcmStats> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new AdminError(data.error || data.detail || 'Failed to load FCM stats.', res.status);
    }
    return data as FcmStats;
}

export async function getFcmTokens(query: {
    page?: number;
    limit?: number;
    platform?: string;
    active?: boolean;
    q?: string;
} = {}): Promise<FcmTokensResponse> {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));
    if (query.platform) params.set('platform', query.platform);
    if (query.active != null) params.set('active', String(query.active));
    if (query.q) params.set('q', query.q);
    const qs = params.toString();
    const res = await clientFetch(`/api/admin/fcm/tokens${qs ? `?${qs}` : ''}`, { method: 'GET' });
    const data = await res.json().catch(() => ({})) as Partial<FcmTokensResponse> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new AdminError(data.error || data.detail || 'Failed to load tokens.', res.status);
    }
    return data as FcmTokensResponse;
}

export async function revokeFcmToken(tokenId: string | number): Promise<void> {
    const res = await clientFetch(`/api/admin/fcm/tokens/${encodeURIComponent(String(tokenId))}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new AdminError(data.error || data.detail || 'Failed to revoke token.', res.status);
    }
}

export async function broadcastFcm(payload: FcmBroadcastPayload): Promise<{ success: boolean; summary?: string }> {
    const res = await clientFetch('/api/admin/fcm/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({})) as { success?: boolean; summary?: string; error?: string; detail?: string };
    if (!res.ok) {
        throw new AdminError(data.error || data.detail || 'Broadcast failed.', res.status);
    }
    return { success: data.success === true, summary: data.summary };
}

export async function adminFcmTest(payload: {
    target_user_id?: string | number;
    target_email?: string;
    title?: string;
    body?: string;
} = {}): Promise<{ success: boolean; summary?: string }> {
    const res = await clientFetch('/api/admin/fcm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({})) as { success?: boolean; summary?: string; error?: string; detail?: string };
    if (!res.ok) {
        throw new AdminError(
            data.error || data.detail || data.summary || 'Test push failed.',
            res.status
        );
    }
    return { success: data.success === true, summary: data.summary };
}

export class AdminError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'AdminError';
        this.status = status;
    }
}

export class AdminValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AdminValidationError';
    }
}
