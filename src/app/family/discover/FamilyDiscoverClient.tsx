'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search, ChevronLeft, ChevronDown, ChevronRight, Loader2, UserPlus, Check, Send, Ban, AtSign,
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
import type { FamilyDiscoverResult, FamilyRelationshipType } from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, type FamilyCapDetail } from '@/lib/familyInviteErrors';
import FamilyCapDialog from '@/components/family/FamilyCapDialog';

const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; labelKey: string }[] = [
    { value: 'mother', labelKey: 'mother' },
    { value: 'father', labelKey: 'father' },
    { value: 'son', labelKey: 'son' },
    { value: 'daughter', labelKey: 'daughter' },
    { value: 'sibling', labelKey: 'sibling' },
    { value: 'spouse', labelKey: 'spouse' },
    { value: 'friend', labelKey: 'friend' },
    { value: 'other', labelKey: 'other' },
];

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

    /* ----- Invite (relationship picker per row) ----- */
    const [pickerFor, setPickerFor] = useState<string | null>(null);
    const [pickerRelationship, setPickerRelationship] = useState<FamilyRelationshipType>('friend');
    const [invitingUsername, setInvitingUsername] = useState<string | null>(null);

    const openPicker = (username: string) => {
        setPickerFor(username);
        setPickerRelationship('friend');
    };

    const handleInvite = async (result: FamilyDiscoverResult) => {
        setInvitingUsername(result.username);
        const res = await sendInvite({
            username: result.username,
            relationshipType: pickerRelationship,
        });
        setInvitingUsername(null);
        if (res.ok) {
            toastSuccess(t('family.discoverInviteSent', { name: result.name || result.username }));
            setPickerFor(null);
            setResultStatus(result.username, 'pending');
            outgoing.refetch();
        } else {
            const cap = familyCapDetail(res.raw);
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
    const [emailRelationship, setEmailRelationship] = useState<FamilyRelationshipType>('friend');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const emailValid = EMAIL_REGEX.test(inviteEmail.trim());

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailValid || isSendingEmail) return;
        setIsSendingEmail(true);
        const res = await sendInvite({
            email: inviteEmail.trim(),
            relationshipType: emailRelationship,
        });
        setIsSendingEmail(false);
        if (res.ok) {
            toastSuccess(t('family.inviteSent'));
            setInviteEmail('');
            outgoing.refetch();
        } else {
            const cap = familyCapDetail(res.raw);
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
                                    isPicking={pickerFor === r.username}
                                    pickerRelationship={pickerRelationship}
                                    onPickerRelationshipChange={setPickerRelationship}
                                    onOpenPicker={() => openPicker(r.username)}
                                    onCancelPicker={() => setPickerFor(null)}
                                    onConfirmInvite={() => handleInvite(r)}
                                    isInviting={invitingUsername === r.username}
                                    onBlock={() => setBlockTarget(r)}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                                    {t('family.inviteRelationshipLabel')}<span className="text-secondary ml-1">*</span>
                                </label>
                                <RelationshipSelect value={emailRelationship} onChange={setEmailRelationship} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!emailValid || isSendingEmail}>
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

const RelationshipSelect: React.FC<{
    value: FamilyRelationshipType;
    onChange: (v: FamilyRelationshipType) => void;
    disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
    const { t } = useTranslation();
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as FamilyRelationshipType)}
                disabled={disabled}
                className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary pr-10 disabled:opacity-50"
            >
                {RELATIONSHIP_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>
                        {t(`family.relationshipTypes.${r.labelKey}`)}
                    </option>
                ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40" />
        </div>
    );
};

interface ResultRowProps {
    result: FamilyDiscoverResult;
    isPicking: boolean;
    pickerRelationship: FamilyRelationshipType;
    onPickerRelationshipChange: (v: FamilyRelationshipType) => void;
    onOpenPicker: () => void;
    onCancelPicker: () => void;
    onConfirmInvite: () => void;
    isInviting: boolean;
    onBlock: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({
    result, isPicking, pickerRelationship, onPickerRelationshipChange,
    onOpenPicker, onCancelPicker, onConfirmInvite, isInviting, onBlock,
}) => {
    const { t } = useTranslation();
    const status = result.relationshipStatus;

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

            {/* Relationship picker (expanded) */}
            {isPicking && status === 'none' && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3 border-t border-outline-variant/10 pt-3">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                            {t('family.discoverRelationshipPrompt', { name: result.name || result.username })}
                        </label>
                        <RelationshipSelect
                            value={pickerRelationship}
                            onChange={onPickerRelationshipChange}
                            disabled={isInviting}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={onConfirmInvite} disabled={isInviting}>
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
