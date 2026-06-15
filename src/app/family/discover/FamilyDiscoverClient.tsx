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
import type { FamilyConnectionKind, FamilyDiscoverResult, FamilyRelationshipType } from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, cooldownRetryAfter, type FamilyCapDetail } from '@/lib/familyInviteErrors';
import { useCountdown } from '@/lib/useCountdown';
import ConnectionKindPicker from '@/components/family/ConnectionKindPicker';
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

    const { query, setQuery, results, isLoading, error, setResultStatus, removeResult } = useFamilyDiscover();
    const outgoing = useOutgoingInvites();

    /* FAMILY_FREE_TIER_CAP upgrade dialog. */
    const [capDialog, setCapDialog] = useState<FamilyCapDetail | null>(null);

    /* ----- Invite (kind + relationship picker per row) ----- */
    const [pickerFor, setPickerFor] = useState<string | null>(null);
    const [pickerKind, setPickerKind] = useState<FamilyConnectionKind>('friend');
    const [pickerRelationship, setPickerRelationship] = useState<FamilyRelationshipType>('mother');
    const [invitingUsername, setInvitingUsername] = useState<string | null>(null);
    /** username → DECLINE_COOLDOWN_ACTIVE retryAfter ISO timestamp. */
    const [cooldownByUsername, setCooldownByUsername] = useState<Record<string, string>>({});

    const openPicker = (username: string) => {
        setPickerFor(username);
        setPickerKind('friend');
        setPickerRelationship('mother');
    };

    const handleInvite = async (result: FamilyDiscoverResult) => {
        setInvitingUsername(result.username);
        const res = await sendInvite({
            username: result.username,
            kind: pickerKind,
            ...(pickerKind === 'family' ? { relationshipType: pickerRelationship } : {}),
        });
        setInvitingUsername(null);
        if (res.ok) {
            toastSuccess(t('family.discoverInviteSent', { name: result.name || result.username }));
            setPickerFor(null);
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

    /* ----- Secondary: invite by email ----- */
    const [inviteEmail, setInviteEmail] = useState('');
    const [emailKind, setEmailKind] = useState<FamilyConnectionKind>('friend');
    const [emailRelationship, setEmailRelationship] = useState<FamilyRelationshipType>('mother');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailCooldownUntil, setEmailCooldownUntil] = useState<string | null>(null);
    const emailCooldown = useCountdown(emailCooldownUntil);
    const emailBlockedByCooldown = !!emailCooldownUntil && !emailCooldown.expired;
    const emailValid = EMAIL_REGEX.test(inviteEmail.trim());

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailValid || isSendingEmail || emailBlockedByCooldown) return;
        setIsSendingEmail(true);
        const res = await sendInvite({
            email: inviteEmail.trim(),
            kind: emailKind,
            ...(emailKind === 'family' ? { relationshipType: emailRelationship } : {}),
        });
        setIsSendingEmail(false);
        if (res.ok) {
            toastSuccess(t('family.inviteSent'));
            setInviteEmail('');
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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
                                    isPicking={pickerFor === r.username}
                                    pickerKind={pickerKind}
                                    onPickerKindChange={setPickerKind}
                                    pickerRelationship={pickerRelationship}
                                    onPickerRelationshipChange={setPickerRelationship}
                                    onOpenPicker={() => openPicker(r.username)}
                                    onCancelPicker={() => setPickerFor(null)}
                                    onConfirmInvite={() => handleInvite(r)}
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
                            />
                        </div>
                        <ConnectionKindPicker
                            kind={emailKind}
                            onKindChange={setEmailKind}
                            relationshipType={emailRelationship}
                            onRelationshipChange={setEmailRelationship}
                            disabled={isSendingEmail}
                        />
                        {emailBlockedByCooldown && (
                            <div className="flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-2xl px-3 py-2">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {(t('family.inviteCooldownRetry') || 'Try again in {time}').replace('{time}', emailCooldown.label)}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!emailValid || isSendingEmail || emailBlockedByCooldown}>
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
    isPicking: boolean;
    pickerKind: FamilyConnectionKind;
    onPickerKindChange: (k: FamilyConnectionKind) => void;
    pickerRelationship: FamilyRelationshipType;
    onPickerRelationshipChange: (v: FamilyRelationshipType) => void;
    onOpenPicker: () => void;
    onCancelPicker: () => void;
    onConfirmInvite: () => void;
    isInviting: boolean;
    onBlock: () => void;
    /** DECLINE_COOLDOWN_ACTIVE retryAfter for this user, if any. */
    cooldownUntil: string | null;
}

const ResultRow: React.FC<ResultRowProps> = ({
    result, isPicking, pickerKind, onPickerKindChange, pickerRelationship, onPickerRelationshipChange,
    onOpenPicker, onCancelPicker, onConfirmInvite, isInviting, onBlock, cooldownUntil,
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
                    </p>
                    <p className="text-[11px] text-on-surface-variant/50 truncate">
                        @{result.username}
                        {result.moonSign && <span className="ml-2 text-secondary/70">{result.moonSign}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {status === 'connected' ? (
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
                    ) : !isPicking ? (
                        <>
                            <button
                                type="button"
                                onClick={onOpenPicker}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary text-[12px] font-medium transition-colors"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
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
                    ) : null}
                </div>
            </div>

            {/* Kind + relationship picker (expanded) */}
            {isPicking && status === 'none' && (
                <div className="mt-3 border-t border-outline-variant/10 pt-3 space-y-3">
                    <ConnectionKindPicker
                        kind={pickerKind}
                        onKindChange={onPickerKindChange}
                        relationshipType={pickerRelationship}
                        onRelationshipChange={onPickerRelationshipChange}
                        disabled={isInviting}
                    />
                    {blockedByCooldown && (
                        <div className="flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-2xl px-3 py-2">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {(t('family.inviteCooldownRetry') || 'Try again in {time}').replace('{time}', cooldown.label)}
                        </div>
                    )}
                    <div className="flex gap-2 justify-end">
                        <Button type="button" size="sm" onClick={onConfirmInvite} disabled={isInviting || blockedByCooldown}>
                            {isInviting ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    {t('family.inviteSending')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">
                                    <Send className="w-3.5 h-3.5" />
                                    {t('family.discoverRelationshipConfirm')}
                                </span>
                            )}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={onCancelPicker} disabled={isInviting}>
                            {t('family.discoverRelationshipCancel')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyDiscoverClient;
