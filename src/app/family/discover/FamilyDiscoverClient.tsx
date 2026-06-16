'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search, ChevronLeft, ChevronRight, Loader2, UserPlus, Check, Send, Ban, AtSign, Clock,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
    useFamilyDiscover,
    useOutgoingInvites,
    sendInvite,
    blockUser,
    useTranslation,
    useToast,
} from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import type { FamilyDiscoverResult } from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, cooldownRetryAfter, type FamilyCapDetail } from '@/lib/familyInviteErrors';
import { useCountdown } from '@/lib/useCountdown';
import FamilyCapDialog from '@/components/family/FamilyCapDialog';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initials(name: string, username: string): string {
    const base = (name || username || '').trim();
    if (!base) return '?';
    const parts = base.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
}

const FamilyDiscoverClient: React.FC = () => {
    const { t } = useTranslation();
    const { success: toastSuccess, error: toastError } = useToast();

    const { user } = useAuth();
    const hasHandle = !!user?.username;
    const myUsername = (user?.username ?? '').toLowerCase();
    const myEmail = (user?.email ?? '').toLowerCase();

    const { query, setQuery, results, isLoading, error, setResultStatus, removeResult } = useFamilyDiscover();
    const outgoing = useOutgoingInvites();

    /* FAMILY_FREE_TIER_CAP upgrade dialog. */
    const [capDialog, setCapDialog] = useState<FamilyCapDetail | null>(null);

    /* ----- Invite (plain — one click, no relationship/kind at invite time) ----- */
    const [invitingUsername, setInvitingUsername] = useState<string | null>(null);
    /** username → DECLINE_COOLDOWN_ACTIVE retryAfter ISO timestamp. */
    const [cooldownByUsername, setCooldownByUsername] = useState<Record<string, string>>({});

    const handleInvite = async (result: FamilyDiscoverResult) => {
        // Guard against self-invites client-side (backend also rejects with 400).
        if (result.username.toLowerCase() === myUsername) {
            toastError(t('family.inviteErrorSelf') || "You can't invite yourself.");
            return;
        }
        setInvitingUsername(result.username);
        const res = await sendInvite({ username: result.username });
        setInvitingUsername(null);
        if (res.ok) {
            toastSuccess(t('family.discoverInviteSent', { name: result.name || result.username }));
            setResultStatus(result.username, 'pending');
            outgoing.refetch();
        } else {
            const cap = familyCapDetail(res.raw);
            const retryAfter = cooldownRetryAfter(res.raw);
            if (retryAfter) setCooldownByUsername(prev => ({ ...prev, [result.username]: retryAfter }));
            if (cap) setCapDialog(cap);
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
    };

    /* ----- Block ----- */
    const [blockTarget, setBlockTarget] = useState<FamilyDiscoverResult | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const handleConfirmBlock = async () => {
        if (!blockTarget) return;
        setIsBlocking(true);
        const res = await blockUser({ username: blockTarget.username });
        setIsBlocking(false);
        if (res.ok) {
            toastSuccess(t('family.blockUserSuccess', { name: blockTarget.name || blockTarget.username }));
            removeResult(blockTarget.username);
        } else {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        setBlockTarget(null);
    };

    /* ----- Secondary: invite by email (plain) ----- */
    const [inviteEmail, setInviteEmail] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailCooldownUntil, setEmailCooldownUntil] = useState<string | null>(null);
    const emailCooldown = useCountdown(emailCooldownUntil);
    const emailBlockedByCooldown = !!emailCooldownUntil && !emailCooldown.expired;
    const emailValid = EMAIL_REGEX.test(inviteEmail.trim());
    const emailIsSelf = inviteEmail.trim().toLowerCase() === myEmail && !!myEmail;

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailValid || isSendingEmail || emailBlockedByCooldown) return;
        if (emailIsSelf) {
            toastError(t('family.inviteErrorSelf') || "You can't invite yourself.");
            return;
        }
        setIsSendingEmail(true);
        const res = await sendInvite({
            email: inviteEmail.trim(),
            ...(emailMessage.trim() ? { message: emailMessage.trim() } : {}),
        });
        setIsSendingEmail(false);
        if (res.ok) {
            toastSuccess(t('family.inviteSent'));
            setInviteEmail('');
            setEmailMessage('');
            setEmailCooldownUntil(null);
            outgoing.refetch();
        } else {
            const cap = familyCapDetail(res.raw);
            const retryAfter = cooldownRetryAfter(res.raw);
            if (retryAfter) setEmailCooldownUntil(retryAfter);
            if (cap) setCapDialog(cap);
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
    };

    const trimmedQuery = query.trim();
    const showNoResults = trimmedQuery.length >= 2 && !isLoading && !error && results.length === 0;

    return (
        <div className="min-h-screen pt-[calc(var(--navbar-height,64px)+1.5rem)] pb-12">
            <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <header>
                    <Link
                        href="/family/invites"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground/40 hover:text-secondary uppercase tracking-widest transition-colors mb-3"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        {t('family.invitesPageTitle')}
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <Search className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">
                            {t('family.discoverPageTitle')}
                        </h1>
                    </div>
                    <p className="text-sm text-on-surface-variant/60 max-w-2xl">
                        {t('family.discoverPageSubtitle')}
                    </p>
                </header>

                {/* Opt-in prompt: the current user is only findable once they set a handle. */}
                {!hasHandle && (
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-2xl bg-secondary/5 border border-secondary/20 px-4 py-3 hover:bg-secondary/10 transition-colors"
                    >
                        <AtSign className="w-4 h-4 text-secondary shrink-0" />
                        <span className="text-[13px] text-on-surface-variant/80 flex-1">
                            {t('family.discoverSetHandlePrompt')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
                    </Link>
                )}

                {/* Search */}
                <Card variant="bordered" padding="md" hoverable={false}>
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block mb-2">
                        {t('family.discoverSearchLabel')}
                    </label>
                    <Input
                        type="search"
                        icon={<Search className="w-4 h-4" />}
                        placeholder={t('family.discoverSearchPlaceholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                    />

                    <div className="mt-4 space-y-2">
                        {trimmedQuery.length < 2 ? (
                            <p className="px-1 text-[12px] text-on-surface-variant/50">{t('family.discoverHint')}</p>
                        ) : isLoading ? (
                            <div className="flex items-center gap-2 px-1 text-[13px] text-on-surface-variant/60">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('family.discoverSearching')}
                            </div>
                        ) : error ? (
                            <p className="px-1 text-[13px] text-red-400">{error}</p>
                        ) : showNoResults ? (
                            <div className="px-3 py-4 rounded-2xl bg-surface/50 border border-dashed border-outline-variant/30 space-y-1.5">
                                <p className="text-[13px] text-on-surface-variant/60">
                                    {t('family.discoverNoResults', { query: trimmedQuery })}
                                </p>
                                <p className="text-[12px] text-on-surface-variant/45">
                                    {t('family.discoverNoResultsHint')}
                                </p>
                            </div>
                        ) : (
                            results.map((r) => (
                                <ResultRow
                                    key={r.username}
                                    result={r}
                                    isSelf={r.username.toLowerCase() === myUsername}
                                    onInvite={() => handleInvite(r)}
                                    isInviting={invitingUsername === r.username}
                                    onBlock={() => setBlockTarget(r)}
                                    cooldownUntil={cooldownByUsername[r.username] ?? null}
                                />
                            ))
                        )}
                    </div>
                </Card>

                {/* Secondary: invite by email */}
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-bold">
                        {t('family.discoverInviteByEmailDivider')}
                    </span>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                </div>

                <Card variant="bordered" padding="md" hoverable={false}>
                    <form onSubmit={handleSendEmail} className="space-y-4">
                        <h2 className="text-[12px] font-bold text-secondary uppercase tracking-widest mb-2">
                            {t('family.inviteByEmail')}
                        </h2>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                                {t('family.inviteEmailLabel')}<span className="text-secondary ml-1">*</span>
                            </label>
                            <Input
                                type="email"
                                placeholder={t('family.inviteEmailPlaceholder')}
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                                error={emailIsSelf ? (t('family.inviteErrorSelf') || "You can't invite yourself.") : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                                {t('family.inviteMessageLabel')}
                            </label>
                            <textarea
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                rows={2}
                                maxLength={500}
                                placeholder={t('family.inviteMessagePlaceholder') || "Add a note (optional)…"}
                                className="w-full bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 text-sm text-primary resize-none"
                            />
                        </div>
                        {emailBlockedByCooldown && (
                            <div className="flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-2xl px-3 py-2">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {(t('family.inviteCooldownRetry') || 'Try again in {time}').replace('{time}', emailCooldown.label)}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!emailValid || emailIsSelf || isSendingEmail || emailBlockedByCooldown}>
                                {isSendingEmail ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('family.inviteSending')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2">
                                        <Send className="w-4 h-4" />
                                        {t('family.inviteSend')}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>

            {/* Block confirm */}
            {blockTarget && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => setBlockTarget(null)}
                    onConfirm={handleConfirmBlock}
                    title={t('family.blockUserConfirmTitle', { name: blockTarget.name || blockTarget.username })}
                    message={t('family.blockUserConfirmBody')}
                    confirmText={t('family.blockUserConfirm')}
                    cancelText={t('family.blockUserCancel')}
                    variant="danger"
                    isLoading={isBlocking}
                />
            )}

            <FamilyCapDialog
                open={!!capDialog}
                onClose={() => setCapDialog(null)}
                message={capDialog?.message}
                currentTier={capDialog?.currentTier}
                limit={capDialog?.limit}
            />
        </div>
    );
};

/* ============================== helpers ============================== */

interface ResultRowProps {
    result: FamilyDiscoverResult;
    isSelf: boolean;
    onInvite: () => void;
    isInviting: boolean;
    onBlock: () => void;
    /** DECLINE_COOLDOWN_ACTIVE retryAfter for this user, if any. */
    cooldownUntil: string | null;
}

const ResultRow: React.FC<ResultRowProps> = ({
    result, isSelf, onInvite, isInviting, onBlock, cooldownUntil,
}) => {
    const { t } = useTranslation();
    const status = result.relationshipStatus;
    const cooldown = useCountdown(cooldownUntil);
    const blockedByCooldown = !!cooldownUntil && !cooldown.expired;

    return (
        <div className="rounded-2xl bg-surface border border-outline-variant/15 px-3 py-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-[12px] font-bold text-secondary shrink-0">
                    {initials(result.name, result.username)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                        {result.name || result.username}
                        {isSelf && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">
                                {t('family.youLabel') || 'You'}
                            </span>
                        )}
                    </p>
                    <p className="text-[11px] text-on-surface-variant/50 truncate">
                        @{result.username}
                        {result.moonSign && <span className="ml-2 text-secondary/70">{result.moonSign}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {isSelf ? null : status === 'connected' ? (
                        <Link
                            href="/family/invites"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[12px] font-medium transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" />
                            {t('family.discoverConnected')}
                        </Link>
                    ) : status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 text-[12px] font-medium cursor-default">
                            <Check className="w-3.5 h-3.5" />
                            {t('family.discoverRequested')}
                        </span>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onInvite}
                                disabled={isInviting || blockedByCooldown}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 disabled:opacity-50 text-secondary text-[12px] font-medium transition-colors"
                            >
                                {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                {t('family.discoverInvite')}
                            </button>
                            <button
                                type="button"
                                onClick={onBlock}
                                aria-label={t('family.discoverBlock')}
                                title={t('family.discoverBlock')}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-on-surface-variant/40 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            >
                                <Ban className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Re-invite cooldown banner */}
            {!isSelf && status === 'none' && blockedByCooldown && (
                <div className="mt-3 flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-2xl px-3 py-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {(t('family.inviteCooldownRetry') || 'Try again in {time}').replace('{time}', cooldown.label)}
                </div>
            )}
        </div>
    );
};

export default FamilyDiscoverClient;
