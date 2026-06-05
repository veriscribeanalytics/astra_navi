'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { AtSign, Eye, Ban, Loader2, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast, useTranslation, useFamilyBlocks, setUsername, unblockUser } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import type { FamilyBlock } from '@/types/family';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const ProfileDiscoverySettings: React.FC = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();

    /* ----- Handle ----- */
    const [username, setUsernameInput] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [usernameError, setUsernameError] = useState('');

    // Seed from profile once it loads, but don't clobber in-progress edits.
    const [dirty, setDirty] = useState(false);
    useEffect(() => {
        if (dirty) return;
        setUsernameInput(user?.username || '');
    }, [user?.username, dirty]);

    const currentUsername = user?.username || '';
    const normalized = username.trim().toLowerCase();
    const usernameValid = USERNAME_RE.test(normalized);
    const usernameChanged = normalized !== currentUsername;

    const handleUsernameChange = (raw: string) => {
        setDirty(true);
        setUsernameError('');
        setUsernameInput(raw.toLowerCase());
    };

    const handleSaveUsername = async () => {
        if (!usernameValid || savingUsername) {
            if (!usernameValid) setUsernameError(t('profile.discovery.usernameRulesError'));
            return;
        }
        setSavingUsername(true);
        setUsernameError('');
        const res = await setUsername(normalized);
        setSavingUsername(false);

        if (res.ok) {
            toastSuccess(t('profile.discovery.usernameSaved'));
            refreshUser({ username: normalized, discoverable: user?.discoverable ?? true });
            setDirty(false);
            return;
        }

        if (res.status === 409) {
            setUsernameError(t('family.usernameTaken'));
        } else if (res.status === 422) {
            // Client already gated on the format regex, so a server 422 here is
            // almost always a reserved/disallowed handle rather than bad format.
            setUsernameError(t('profile.discovery.usernameReservedError'));
        } else if (res.status === 429) {
            toastError(t('profile.discovery.usernameRateLimited'));
        } else {
            toastError(res.error || t('family.inviteErrorGeneric'));
        }
    };

    const handleClearUsername = async () => {
        setClearing(true);
        const res = await setUsername(null);
        setClearing(false);
        if (res.ok) {
            toastSuccess(t('profile.discovery.usernameCleared'));
            refreshUser({ username: null });
            setUsernameInput('');
            setDirty(false);
        } else if (res.status === 429) {
            toastError(t('profile.discovery.usernameRateLimited'));
        } else {
            toastError(res.error || t('family.inviteErrorGeneric'));
        }
    };

    /* ----- Discoverable toggle ----- */
    const discoverable = user?.discoverable ?? true;
    const [togglingDiscoverable, setTogglingDiscoverable] = useState(false);

    const handleToggleDiscoverable = async () => {
        if (togglingDiscoverable) return;
        const next = !discoverable;
        setTogglingDiscoverable(true);
        // Optimistic; revert on failure.
        refreshUser({ discoverable: next });
        try {
            const res = await clientFetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discoverable: next }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || body.detail || 'Failed');
            }
        } catch (err) {
            refreshUser({ discoverable: !next });
            toastError(err instanceof Error ? err.message : t('family.inviteErrorGeneric'));
        } finally {
            setTogglingDiscoverable(false);
        }
    };

    /* ----- Blocked list ----- */
    const blocks = useFamilyBlocks();
    const [unblockingId, setUnblockingId] = useState<number | null>(null);

    const handleUnblock = async (block: FamilyBlock) => {
        setUnblockingId(block.id);
        const res = await unblockUser(block.id);
        setUnblockingId(null);
        if (res.ok) {
            toastSuccess(t('family.unblockSuccess', { name: block.name || block.username }));
            blocks.refetch();
        } else {
            toastError(res.error || t('family.inviteErrorGeneric'));
        }
    };

    return (
        <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20 mt-8" hoverable={false}>
            <div className="space-y-8">
                {/* Handle */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-xl font-headline font-bold text-primary mb-1 flex items-center gap-2">
                            <AtSign className="w-5 h-5 text-secondary" />
                            {t('profile.discovery.sectionTitle')}
                        </h3>
                        <p className="text-sm text-on-surface-variant">{t('profile.discovery.sectionDescription')}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1">
                            <Input
                                label={t('profile.discovery.usernameLabel')}
                                placeholder={t('profile.discovery.usernamePlaceholder')}
                                value={username}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                                error={usernameError || undefined}
                                helperText={t('profile.discovery.usernameHelper')}
                                maxLength={20}
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex gap-2 sm:pt-7">
                            <Button
                                type="button"
                                size="md"
                                onClick={handleSaveUsername}
                                disabled={!usernameValid || !usernameChanged || savingUsername}
                                leftIcon={savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            >
                                {savingUsername ? t('profile.discovery.usernameSaving') : t('profile.discovery.usernameSave')}
                            </Button>
                            {currentUsername && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="md"
                                    onClick={handleClearUsername}
                                    disabled={clearing}
                                    leftIcon={clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                >
                                    {t('profile.discovery.usernameClear')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Discoverable toggle */}
                    <button
                        type="button"
                        onClick={handleToggleDiscoverable}
                        disabled={togglingDiscoverable}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all disabled:opacity-60"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl transition-colors ${discoverable ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                <Eye size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-primary">{t('profile.discovery.discoverableLabel')}</p>
                                <p className="text-[10px] text-on-surface-variant/60 max-w-md">{t('profile.discovery.discoverableDescription')}</p>
                            </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${discoverable ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${discoverable ? 'left-6' : 'left-1'}`} />
                        </div>
                    </button>
                </div>

                {/* Blocked list */}
                <div className="space-y-4 pt-6 border-t border-outline-variant/10">
                    <div>
                        <h3 className="text-base font-headline font-bold text-primary mb-1 flex items-center gap-2">
                            <Ban className="w-4 h-4 text-on-surface-variant/60" />
                            {t('profile.discovery.blockedTitle')}
                        </h3>
                        <p className="text-sm text-on-surface-variant">{t('profile.discovery.blockedDescription')}</p>
                    </div>

                    {blocks.isLoading && !blocks.data ? (
                        <div className="h-14 rounded-2xl bg-surface border border-outline-variant/15 animate-pulse" />
                    ) : !blocks.data || blocks.data.length === 0 ? (
                        <p className="px-4 py-4 rounded-2xl bg-surface/50 border border-dashed border-outline-variant/30 text-center text-[13px] text-on-surface-variant/50">
                            {t('profile.discovery.blockedEmpty')}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {blocks.data.map((block) => (
                                <div key={block.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface border border-outline-variant/15 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold text-foreground truncate">{block.name || block.username}</p>
                                        <p className="text-[11px] text-on-surface-variant/50 truncate">@{block.username}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleUnblock(block)}
                                        disabled={unblockingId === block.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 disabled:opacity-50 text-on-surface-variant/70 text-[12px] font-medium transition-colors shrink-0"
                                    >
                                        {unblockingId === block.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        {unblockingId === block.id ? t('profile.discovery.unblocking') : t('profile.discovery.unblock')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ProfileDiscoverySettings;
