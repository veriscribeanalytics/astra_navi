'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ShieldAlert, Loader2, Plus, Pencil, Trash2, Send, Bell, RefreshCw,
    ArrowLeft, X, CheckCircle2, AlertTriangle, Smartphone, Users, Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks';
import {
    AdminError,
    AdminValidationError,
    CatalogProduct,
    CatalogProductType,
    FcmStats,
    FcmTokenRow,
    FcmTokensResponse,
    broadcastFcm,
    createCatalogProduct,
    deleteCatalogProduct,
    getFcmStats,
    getFcmTokens,
    revokeFcmToken,
    updateCatalogProduct,
    validateProduct,
} from '@/lib/admin';

type Tab = 'catalog' | 'fcm';

const PRODUCT_TYPES: CatalogProductType[] = ['subscription', 'one_time_pack', 'one_time_report'];

const EMPTY_PRODUCT: CatalogProduct = {
    product_id: '',
    product_type: 'subscription',
    category: '',
    tier: '',
    credits: 0,
    cycle_days: 30,
    price_inr: 0,
    price_usd: 0,
    currency: 'INR',
    is_active: true,
    sale_price_inr: null,
    sale_ends_at: null,
    metadata: null,
};

export default function AdminClient() {
    const { isLoggedIn, isAdmin, isLoading: authLoading } = useAuth();
    const { success, error } = useToast();
    const [tab, setTab] = useState<Tab>('catalog');

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                <p className="text-sm text-foreground/50">Loading admin console…</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
                <ShieldAlert className="h-10 w-10 text-secondary" />
                <h1 className="text-xl font-headline font-bold">Admin sign-in required</h1>
                <p className="text-sm text-foreground/60">Please sign in with an admin account.</p>
                <Link href="/login?callbackUrl=/admin" className="mt-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-primary">
                    Sign in
                </Link>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
                <ShieldAlert className="h-10 w-10 text-red-400" />
                <h1 className="text-xl font-headline font-bold">Not authorized</h1>
                <p className="text-sm text-foreground/60 max-w-md">
                    Your account does not have admin access. If you believe this is an error, contact the team.
                </p>
                <Link href="/" className="mt-2 rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-bold text-foreground/70">
                    Back to dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] pt-[calc(var(--navbar-height,64px)+1.5rem)] pb-12">
            <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <header className="flex items-center gap-3">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground/60 hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-secondary" />
                        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Admin Console</h1>
                    </div>
                </header>

                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-variant/30 border border-outline-variant/15">
                    {(['catalog', 'fcm'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors capitalize ${
                                tab === t ? 'bg-secondary/15 text-secondary' : 'text-foreground/60 hover:text-foreground'
                            }`}
                        >
                            {t === 'fcm' ? 'Push (FCM)' : 'Catalog'}
                        </button>
                    ))}
                </div>

                {tab === 'catalog' ? <CatalogTab onSuccess={success} onError={error} /> : <FcmTab onSuccess={success} onError={error} />}
            </div>
        </div>
    );
}

/* ============================================================= */
/* Catalog tab                                                   */
/* ============================================================= */

function CatalogTab({ onSuccess, onError }: { onSuccess: (m: string) => void; onError: (m: string) => void }) {
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<CatalogProduct | null>(null);
    const [showForm, setShowForm] = useState(false);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Reuse the public catalog endpoint (admin-readable). The backend
            // returns the full list including inactive products for admins.
            const res = await fetch('/api/entitlements/catalog');
            const data = await res.json().catch(() => ({ products: [] }));
            const list: CatalogProduct[] = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
            setProducts(list);
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to load catalog.');
        } finally {
            setLoading(false);
        }
    }, [onError]);

    useEffect(() => { void loadProducts(); }, [loadProducts]);

    const handleCreate = () => {
        setEditing({ ...EMPTY_PRODUCT });
        setShowForm(true);
    };

    const handleEdit = (p: CatalogProduct) => {
        setEditing({ ...p, sale_price_inr: p.sale_price_inr ?? null, sale_ends_at: p.sale_ends_at ?? null });
        setShowForm(true);
    };

    const handleDelete = async (productId: string) => {
        if (!confirm(`Delete product "${productId}"? This can't be undone.`)) return;
        try {
            await deleteCatalogProduct(productId);
            onSuccess('Product deleted.');
            void loadProducts();
        } catch (err) {
            const msg = err instanceof AdminError ? err.message : 'Failed to delete product.';
            onError(msg);
        }
    };

    const handleSubmit = async (product: CatalogProduct) => {
        const isNew = !products.some((p) => p.product_id === product.product_id);
        try {
            if (isNew) {
                await createCatalogProduct(product);
                onSuccess('Product created.');
            } else {
                await updateCatalogProduct(product.product_id, product);
                onSuccess('Product updated.');
            }
            setShowForm(false);
            setEditing(null);
            void loadProducts();
        } catch (err) {
            const msg = err instanceof AdminValidationError || err instanceof AdminError
                ? err.message
                : 'Failed to save product.';
            onError(msg);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-headline font-bold">Entitlements Catalog</h2>
                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-primary hover:bg-secondary-hover"
                >
                    <Plus className="h-4 w-4" /> New product
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 py-8 text-foreground/50">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
                </div>
            ) : products.length === 0 ? (
                <div className="rounded-2xl border border-outline-variant/15 bg-surface p-8 text-center text-foreground/50">
                    No products yet. Create one to get started.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {products.map((p) => (
                        <ProductCard key={p.product_id} product={p} onEdit={() => handleEdit(p)} onDelete={() => handleDelete(p.product_id)} />
                    ))}
                </div>
            )}

            {showForm && editing && (
                <ProductFormModal
                    product={editing}
                    isNew={!products.some((p) => p.product_id === editing.product_id)}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}

function ProductCard({ product, onEdit, onDelete }: { product: CatalogProduct; onEdit: () => void; onDelete: () => void }) {
    const onSale = product.sale_price_inr != null && product.sale_ends_at != null;
    return (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">{product.product_id}</h3>
                    <p className="text-xs text-foreground/50 uppercase tracking-wider mt-0.5">
                        {product.product_type}{product.tier ? ` · ${product.tier}` : ''}
                    </p>
                </div>
                <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${product.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-foreground/10 text-foreground/50'}`}>
                    {product.is_active ? 'Active' : 'Hidden'}
                </span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-black text-foreground">₹{product.price_inr}</span>
                {product.price_usd ? <span className="text-xs text-foreground/50">${product.price_usd}</span> : null}
                {onSale && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Sale ₹{product.sale_price_inr}
                    </span>
                )}
            </div>
            {product.credits ? <p className="text-xs text-foreground/60">{product.credits} credits</p> : null}
            <div className="mt-2 flex gap-2 pt-2 border-t border-outline-variant/10">
                <button onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-bold text-foreground/70 hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={onDelete} className="inline-flex items-center gap-1 text-xs font-bold text-red-400/80 hover:text-red-400 ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
            </div>
        </div>
    );
}

function ProductFormModal({
    product,
    isNew,
    onClose,
    onSubmit,
}: {
    product: CatalogProduct;
    isNew: boolean;
    onClose: () => void;
    onSubmit: (p: CatalogProduct) => void;
}) {
    const [form, setForm] = useState<CatalogProduct>(product);
    const [validationMsg, setValidationMsg] = useState<string | null>(null);

    const update = (patch: Partial<CatalogProduct>) => setForm((prev) => ({ ...prev, ...patch }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateProduct(form);
        if (err) { setValidationMsg(err); return; }
        setValidationMsg(null);
        void onSubmit(form);
    };

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="relative w-full max-w-2xl bg-surface border border-outline-variant/20 rounded-[28px] shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
                <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground/60">
                    <X className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-headline font-bold mb-4">{isNew ? 'New Product' : `Edit ${product.product_id}`}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Product ID (immutable)" disabled={!isNew}>
                        <input value={form.product_id} onChange={(e) => update({ product_id: e.target.value })} disabled={!isNew} className={inputCls} />
                    </Field>
                    <Field label="Product type">
                        <select value={form.product_type} onChange={(e) => update({ product_type: e.target.value as CatalogProductType })} className={inputCls}>
                            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </Field>
                    <Field label="Category">
                        <input value={form.category || ''} onChange={(e) => update({ category: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Tier (subscription only)">
                        <input value={form.tier || ''} onChange={(e) => update({ tier: e.target.value })} placeholder="pro / premium" className={inputCls} />
                    </Field>
                    <Field label="Credits">
                        <input type="number" min={0} value={form.credits ?? 0} onChange={(e) => update({ credits: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <Field label="Cycle days">
                        <input type="number" min={0} value={form.cycle_days ?? 0} onChange={(e) => update({ cycle_days: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <Field label="Price (INR) *">
                        <input type="number" min={0} step="0.01" value={form.price_inr} onChange={(e) => update({ price_inr: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <Field label="Price (USD)">
                        <input type="number" min={0} step="0.01" value={form.price_usd ?? 0} onChange={(e) => update({ price_usd: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <Field label="Currency">
                        <input value={form.currency || 'INR'} onChange={(e) => update({ currency: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Sale price (INR)">
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.sale_price_inr ?? ''}
                            onChange={(e) => update({ sale_price_inr: e.target.value === '' ? null : Number(e.target.value) })}
                            placeholder="Must be < price"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Sale ends at">
                        <input
                            type="datetime-local"
                            value={form.sale_ends_at ? form.sale_ends_at.slice(0, 16) : ''}
                            onChange={(e) => update({ sale_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Active">
                        <label className="flex items-center gap-2 mt-2">
                            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => update({ is_active: e.target.checked })} className="h-4 w-4" />
                            <span className="text-sm text-foreground/70">Visible to users</span>
                        </label>
                    </Field>
                </div>

                {validationMsg && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{validationMsg}</span>
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant/20 px-4 py-2 text-sm font-bold text-foreground/70">
                        Cancel
                    </button>
                    <button type="submit" className="rounded-xl bg-secondary px-5 py-2 text-sm font-bold text-on-primary hover:bg-secondary-hover">
                        {isNew ? 'Create' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = "w-full rounded-lg border border-outline-variant/20 bg-surface-variant/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-secondary/40";

function Field({ label, disabled, children }: { label: string; disabled?: boolean; children: React.ReactNode }) {
    return (
        <label className={`block ${disabled ? 'opacity-60' : ''}`}>
            <span className="block text-xs font-bold uppercase tracking-wider text-foreground/55 mb-1">{label}</span>
            {children}
        </label>
    );
}

/* ============================================================= */
/* FCM admin tab                                                 */
/* ============================================================= */

function FcmTab({ onSuccess, onError }: { onSuccess: (m: string) => void; onError: (m: string) => void }) {
    const [stats, setStats] = useState<FcmStats | null>(null);
    const [tokens, setTokens] = useState<FcmTokenRow[]>([]);
    const [tokensLoading, setTokensLoading] = useState(true);
    const [showBroadcast, setShowBroadcast] = useState(false);

    const loadStats = useCallback(async () => {
        try {
            setStats(await getFcmStats());
        } catch (err) {
            onError(err instanceof AdminError ? err.message : 'Failed to load stats.');
        }
    }, [onError]);

    const loadTokens = useCallback(async () => {
        setTokensLoading(true);
        try {
            const res: FcmTokensResponse = await getFcmTokens({ limit: 50 });
            setTokens(res.items || []);
        } catch (err) {
            onError(err instanceof AdminError ? err.message : 'Failed to load tokens.');
        } finally {
            setTokensLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        void loadStats();
        void loadTokens();
    }, [loadStats, loadTokens]);

    const handleRevoke = async (tokenId: string | number) => {
        if (!confirm('Revoke this device token? The user will stop receiving pushes on it.')) return;
        try {
            await revokeFcmToken(tokenId);
            onSuccess('Token revoked.');
            void loadTokens();
            void loadStats();
        } catch (err) {
            onError(err instanceof AdminError ? err.message : 'Failed to revoke token.');
        }
    };

    return (
        <div className="space-y-5">
            {/* Stats */}
            <section className="rounded-2xl border border-outline-variant/15 bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-headline font-bold flex items-center gap-2">
                        <Bell className="h-5 w-5 text-secondary" /> FCM Stats
                    </h2>
                    <button onClick={() => { void loadStats(); void loadTokens(); }} className="inline-flex items-center gap-1 text-xs font-bold text-foreground/60 hover:text-foreground">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatTile icon={<Smartphone className="h-4 w-4" />} label="Total tokens" value={stats?.total_tokens ?? '—'} />
                    <StatTile icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Active" value={stats?.active_tokens ?? '—'} />
                    <StatTile icon={<Users className="h-4 w-4" />} label="Reminders on" value={stats?.reminders_enabled ?? '—'} />
                    <StatTile icon={<Clock className="h-4 w-4" />} label="By platform" value={stats?.by_platform ? Object.entries(stats.by_platform).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => setShowBroadcast(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-primary hover:bg-secondary-hover">
                        <Send className="h-4 w-4" /> Broadcast
                    </button>
                </div>
            </section>

            {/* Tokens */}
            <section className="rounded-2xl border border-outline-variant/15 bg-surface p-5">
                <h2 className="text-lg font-headline font-bold mb-4">Device Tokens</h2>
                {tokensLoading ? (
                    <div className="flex items-center gap-2 py-6 text-foreground/50">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading tokens…
                    </div>
                ) : tokens.length === 0 ? (
                    <p className="py-6 text-center text-foreground/50">No registered tokens.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-foreground/50 border-b border-outline-variant/10">
                                    <th className="py-2 pr-3">Platform</th>
                                    <th className="py-2 pr-3">User</th>
                                    <th className="py-2 pr-3">Token</th>
                                    <th className="py-2 pr-3">Active</th>
                                    <th className="py-2 pr-3">Created</th>
                                    <th className="py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokens.map((t) => (
                                    <tr key={t.id} className="border-b border-outline-variant/5">
                                        <td className="py-2 pr-3 capitalize">{t.platform || '—'}</td>
                                        <td className="py-2 pr-3 truncate max-w-[160px]">{t.user_email || t.user_id}</td>
                                        <td className="py-2 pr-3 font-mono text-xs text-foreground/50 truncate max-w-[200px]">{t.token.slice(0, 16)}…</td>
                                        <td className="py-2 pr-3">
                                            {t.active ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-foreground/40" />}
                                        </td>
                                        <td className="py-2 pr-3 text-xs text-foreground/50">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                                        <td className="py-2">
                                            <button onClick={() => handleRevoke(t.id)} className="inline-flex items-center gap-1 text-xs font-bold text-red-400/80 hover:text-red-400">
                                                <Trash2 className="h-3.5 w-3.5" /> Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showBroadcast && (
                <BroadcastModal onClose={() => setShowBroadcast(false)} onSuccess={onSuccess} onError={onError} />
            )}
        </div>
    );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-variant/30 p-3.5">
            <div className="flex items-center gap-1.5 text-foreground/55 text-xs font-bold uppercase tracking-wider mb-1">{icon}{label}</div>
            <div className="text-lg font-black text-foreground truncate">{value}</div>
        </div>
    );
}

function BroadcastModal({ onClose, onSuccess, onError }: { onClose: () => void; onSuccess: (m: string) => void; onError: (m: string) => void }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            onError('Title and body are required.');
            return;
        }
        setSending(true);
        try {
            const res = await broadcastFcm({ title: title.trim(), body: body.trim() });
            onSuccess(res.summary || 'Broadcast sent.');
            onClose();
        } catch (err) {
            onError(err instanceof AdminError ? err.message : 'Broadcast failed.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={onClose}>
            <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="relative w-full max-w-md bg-surface border border-outline-variant/20 rounded-[28px] shadow-2xl p-6">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground/60">
                    <X className="h-4 w-4" />
                </button>
                <h3 className="text-lg font-headline font-bold mb-4">Broadcast Push</h3>
                <p className="text-sm text-foreground/60 mb-4">Sends a push notification to all registered devices.</p>
                <label className="block mb-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-foreground/55 mb-1">Title</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} maxLength={100} />
                </label>
                <label className="block mb-4">
                    <span className="block text-xs font-bold uppercase tracking-wider text-foreground/55 mb-1">Body</span>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={`${inputCls} resize-none`} maxLength={500} />
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-outline-variant/20 px-4 py-2 text-sm font-bold text-foreground/70">Cancel</button>
                    <button type="submit" disabled={sending} className="rounded-xl bg-secondary px-5 py-2 text-sm font-bold text-on-primary hover:bg-secondary-hover disabled:opacity-50">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
}
