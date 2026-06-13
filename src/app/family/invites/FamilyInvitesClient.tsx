'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Mail, Send, ChevronLeft, Check, X, Loader2, Heart, ChevronDown, Trash2, Link2, Search,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
    useIncomingInvites,
    useOutgoingInvites,
    useFamilyConnections,
    sendInvite,
    acceptInvite,
    acceptInviteMerge,
    declineInvite,
    revokeInvite,
    updateConnection,
    deleteConnection,
    useTranslation,
    useToast,
} from '@/hooks';
import type {
    FamilyConnection,
    FamilyInvite,
    FamilyMergeCandidate,
    FamilyRelationshipType,
} from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, type FamilyCapDetail } from '@/lib/familyInviteErrors';
import FamilyCapDialog from '@/components/family/FamilyCapDialog';

const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; label: string }[] = [
    { value: 'mother', label: 'Mother' },
    { value: 'father', label: 'Father' },
    { value: 'son', label: 'Son' },
    { value: 'daughter', label: 'Daughter' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' },
];

const relationshipLabel = (rel: FamilyRelationshipType | string): string => {
    const found = RELATIONSHIP_TYPES.find(r => r.value === rel);
    return found ? found.label : (rel || '');
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FamilyInvitesClient: React.FC = () => {
    const { t } = useTranslation();
    const { success: toastSuccess, error: toastError } = useToast();

    const incoming = useIncomingInvites();
    const outgoing = useOutgoingInvites();
    const connections = useFamilyConnections();

    /* FAMILY_FREE_TIER_CAP upgrade dialog (send + accept paths). */
    const [capDialog, setCapDialog] = useState<FamilyCapDetail | null>(null);

    /* ----- Send invite form state ----- */
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRelationship, setInviteRelationship] = useState<FamilyRelationshipType>('friend');
    const [inviteMessage, setInviteMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const emailValid = EMAIL_REGEX.test(inviteEmail.trim());

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailValid || isSending) return;
        setIsSending(true);
        const res = await sendInvite({
            email: inviteEmail.trim(),
            relationshipType: inviteRelationship,
            message: inviteMessage.trim() || undefined,
        });
        setIsSending(false);
        if (res.ok) {
            toastSuccess(t('family.inviteSent'));
            setInviteEmail('');
            setInviteMessage('');
            outgoing.refetch();
        } else {
            const cap = familyCapDetail(res.raw);
            if (cap) setCapDialog(cap);
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
    };

    /* ----- Accept / decline / merge state ----- */
    const [acceptingInviteId, setAcceptingInviteId] = useState<number | null>(null);
    const [mergePrompt, setMergePrompt] = useState<{ inviteId: number; candidate: FamilyMergeCandidate } | null>(null);
    const [isMerging, setIsMerging] = useState(false);
    /** Per-invite "link them when I accept" checkbox. Defaults to true when an
     *  invite carries an inline mergeCandidate; user can untick to skip merge. */
    const [mergeChoice, setMergeChoice] = useState<Record<number, boolean>>({});

    const getMergeChoice = (invite: FamilyInvite): boolean => {
        if (!invite.mergeCandidate) return false;
        return mergeChoice[invite.id] ?? true;
    };

    const handleAccept = async (invite: FamilyInvite) => {
        setAcceptingInviteId(invite.id);
        const preAcceptCandidate = invite.mergeCandidate;
        const wantsMerge = getMergeChoice(invite);

        const res = await acceptInvite(invite.id);

        if (!res.ok || !res.data) {
            setAcceptingInviteId(null);
            const cap = familyCapDetail(res.raw);
            if (cap) setCapDialog(cap);
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
            incoming.refetch();
            return;
        }

        const postAcceptCandidate = (res.data as { mergeCandidate?: FamilyMergeCandidate }).mergeCandidate;
        const candidate = wantsMerge ? (preAcceptCandidate ?? postAcceptCandidate) : null;

        if (candidate) {
            const mergeRes = await acceptInviteMerge(invite.id, candidate.memberId);
            setAcceptingInviteId(null);
            if (mergeRes.ok) {
                toastSuccess(t('family.inviteStatusAccepted'));
            } else {
                toastError(parseInviteErrorByStatus(mergeRes.status, mergeRes.raw, t));
            }
            incoming.refetch();
            connections.refetch();
            return;
        }

        setAcceptingInviteId(null);

        // No pre-accept candidate the user chose to merge with: if the backend
        // surfaced a post-accept candidate (legacy/race path), prompt as before.
        if (!preAcceptCandidate && postAcceptCandidate) {
            setMergePrompt({ inviteId: invite.id, candidate: postAcceptCandidate });
        } else {
            toastSuccess(t('family.inviteStatusAccepted'));
        }
        incoming.refetch();
        connections.refetch();
    };

    const handleConfirmMerge = async () => {
        if (!mergePrompt) return;
        setIsMerging(true);
        const res = await acceptInviteMerge(mergePrompt.inviteId, mergePrompt.candidate.memberId);
        setIsMerging(false);
        if (res.ok) {
            toastSuccess(t('family.inviteStatusAccepted'));
        } else {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        setMergePrompt(null);
        connections.refetch();
    };

    const [decliningInviteId, setDecliningInviteId] = useState<number | null>(null);
    const handleDecline = async (invite: FamilyInvite) => {
        setDecliningInviteId(invite.id);
        const res = await declineInvite(invite.id);
        setDecliningInviteId(null);
        if (res.ok) {
            toastSuccess(t('family.inviteStatusDeclined'));
        } else {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        incoming.refetch();
    };

    const [revokingInviteId, setRevokingInviteId] = useState<number | null>(null);
    const handleRevoke = async (invite: FamilyInvite) => {
        setRevokingInviteId(invite.id);
        const res = await revokeInvite(invite.id);
        setRevokingInviteId(null);
        if (res.ok) {
            toastSuccess(t('family.inviteStatusRevoked'));
        } else {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        outgoing.refetch();
    };

    /* ----- Connection mutations ----- */
    const [togglingConnId, setTogglingConnId] = useState<number | null>(null);
    const handleToggleSharing = async (conn: FamilyConnection) => {
        setTogglingConnId(conn.connectionId);
        const res = await updateConnection(conn.connectionId, { sharingWithThem: !conn.sharingWithThem });
        setTogglingConnId(null);
        if (!res.ok) {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        connections.refetch();
    };

    const [disconnectPrompt, setDisconnectPrompt] = useState<FamilyConnection | null>(null);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const handleConfirmDisconnect = async () => {
        if (!disconnectPrompt) return;
        setIsDisconnecting(true);
        const res = await deleteConnection(disconnectPrompt.connectionId);
        setIsDisconnecting(false);
        if (res.ok) {
            toastSuccess(t('family.connectionDisconnect'));
        } else {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        setDisconnectPrompt(null);
        connections.refetch();
    };

    return (
        <div className="min-h-screen pt-[calc(var(--navbar-height,64px)+1.5rem)] pb-12">
            <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <header>
                    <Link
                        href="/family"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground/40 hover:text-secondary uppercase tracking-widest transition-colors mb-3"
                    >
                        <ChevronLeft className="w-3 h-3" />
                        {t('nav.myFamily')}
                    </Link>
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">
                                {t('family.invitesPageTitle')}
                            </h1>
                        </div>
                        <Link
                            href="/family/discover"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-secondary text-[12px] font-bold transition-colors shrink-0"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('family.discoverNavLink')}</span>
                        </Link>
                    </div>
                    <p className="text-sm text-on-surface-variant/60 max-w-2xl">
                        {t('family.invitesPageSubtitle')}
                    </p>
                </header>

                {/* Send invite form */}
                <Card variant="bordered" padding="md" hoverable={false}>
                    <form onSubmit={handleSend} className="space-y-4">
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
                                <div className="relative">
                                    <select
                                        value={inviteRelationship}
                                        onChange={(e) => setInviteRelationship(e.target.value as FamilyRelationshipType)}
                                        className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary pr-10"
                                    >
                                        {RELATIONSHIP_TYPES.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                                {t('family.inviteMessageLabel')}
                            </label>
                            <textarea
                                value={inviteMessage}
                                onChange={(e) => setInviteMessage(e.target.value)}
                                rows={2}
                                className="w-full bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 text-sm text-primary resize-none"
                                maxLength={500}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!emailValid || isSending}>
                                {isSending ? (
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

                {/* Incoming */}
                <section className="space-y-3">
                    <h2 className="text-[12px] font-bold text-secondary uppercase tracking-widest">
                        {t('family.invitesTabIncoming')}
                        {incoming.data && incoming.data.length > 0 && (
                            <span className="ml-2 text-on-surface-variant/40">({incoming.data.length})</span>
                        )}
                    </h2>
                    {incoming.isLoading && !incoming.data ? (
                        <SectionSkeleton />
                    ) : !incoming.data || incoming.data.length === 0 ? (
                        <EmptyRow text={t('family.invitesEmptyIncoming')} />
                    ) : (
                        incoming.data.map((invite) => (
                            <InviteRow
                                key={invite.id}
                                invite={invite}
                                kind="incoming"
                                onAccept={() => handleAccept(invite)}
                                onDecline={() => handleDecline(invite)}
                                isAccepting={acceptingInviteId === invite.id}
                                isDeclining={decliningInviteId === invite.id}
                                mergeChecked={getMergeChoice(invite)}
                                onMergeCheckedChange={(next) =>
                                    setMergeChoice(prev => ({ ...prev, [invite.id]: next }))
                                }
                            />
                        ))
                    )}
                </section>

                {/* Outgoing */}
                <section className="space-y-3">
                    <h2 className="text-[12px] font-bold text-secondary uppercase tracking-widest">
                        {t('family.invitesTabOutgoing')}
                        {outgoing.data && outgoing.data.length > 0 && (
                            <span className="ml-2 text-on-surface-variant/40">({outgoing.data.length})</span>
                        )}
                    </h2>
                    {outgoing.isLoading && !outgoing.data ? (
                        <SectionSkeleton />
                    ) : !outgoing.data || outgoing.data.length === 0 ? (
                        <EmptyRow text={t('family.invitesEmptyOutgoing')} />
                    ) : (
                        outgoing.data.map((invite) => (
                            <InviteRow
                                key={invite.id}
                                invite={invite}
                                kind="outgoing"
                                onRevoke={() => handleRevoke(invite)}
                                isRevoking={revokingInviteId === invite.id}
                            />
                        ))
                    )}
                </section>

                {/* Connections */}
                <section className="space-y-3">
                    <h2 className="text-[12px] font-bold text-secondary uppercase tracking-widest">
                        {t('family.invitesTabConnections')}
                        {connections.data && connections.data.length > 0 && (
                            <span className="ml-2 text-on-surface-variant/40">({connections.data.length})</span>
                        )}
                    </h2>
                    {connections.isLoading && !connections.data ? (
                        <SectionSkeleton />
                    ) : !connections.data || connections.data.length === 0 ? (
                        <EmptyRow text={t('family.invitesEmptyConnections')} />
                    ) : (
                        connections.data.map((conn) => (
                            <ConnectionRow
                                key={conn.connectionId}
                                connection={conn}
                                onToggleSharing={() => handleToggleSharing(conn)}
                                onDisconnect={() => setDisconnectPrompt(conn)}
                                isToggling={togglingConnId === conn.connectionId}
                            />
                        ))
                    )}
                </section>
            </div>

            {/* Merge prompt */}
            {mergePrompt && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => setMergePrompt(null)}
                    onConfirm={handleConfirmMerge}
                    title={t('family.inviteMergeTitle')}
                    message={t('family.inviteMergeBody', {
                        name: mergePrompt.candidate.name,
                        dob: mergePrompt.candidate.dob,
                    })}
                    confirmText={t('family.inviteMergeConfirm')}
                    cancelText={t('family.inviteMergeCancel')}
                    variant="warning"
                    isLoading={isMerging}
                />
            )}

            {/* Disconnect prompt */}
            {disconnectPrompt && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => setDisconnectPrompt(null)}
                    onConfirm={handleConfirmDisconnect}
                    title={t('family.connectionDisconnectTitle', { name: disconnectPrompt.otherName })}
                    message={t('family.connectionDisconnectBody')}
                    confirmText={t('family.connectionDisconnectConfirm')}
                    variant="danger"
                    isLoading={isDisconnecting}
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

/* ============================== Row helpers ============================== */

const SectionSkeleton: React.FC = () => (
    <div className="space-y-2">
        {[0, 1].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-surface border border-outline-variant/15 animate-pulse" />
        ))}
    </div>
);

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
    <div className="px-4 py-6 rounded-2xl bg-surface/50 border border-dashed border-outline-variant/30 text-center text-[13px] text-on-surface-variant/50">
        {text}
    </div>
);

interface InviteRowProps {
    invite: FamilyInvite;
    kind: 'incoming' | 'outgoing';
    onAccept?: () => void;
    onDecline?: () => void;
    onRevoke?: () => void;
    isAccepting?: boolean;
    isDeclining?: boolean;
    isRevoking?: boolean;
    /** Incoming-only: state of the "link them when I accept" checkbox. */
    mergeChecked?: boolean;
    onMergeCheckedChange?: (next: boolean) => void;
}

const InviteRow: React.FC<InviteRowProps> = ({
    invite, kind, onAccept, onDecline, onRevoke, isAccepting, isDeclining, isRevoking,
    mergeChecked, onMergeCheckedChange,
}) => {
    const { t } = useTranslation();
    const isPending = invite.status === 'pending';
    const statusKeyMap: Record<FamilyInvite['status'], string> = {
        pending: 'family.inviteStatusPending',
        accepted: 'family.inviteStatusAccepted',
        declined: 'family.inviteStatusDeclined',
        expired: 'family.inviteStatusExpired',
        revoked: 'family.inviteStatusRevoked',
    };

    const counterpartyEmail = kind === 'incoming' ? invite.requesterEmail : invite.inviteeEmail;
    const counterpartyName = kind === 'incoming' ? invite.requesterName : invite.inviteeName;
    const showMergeOffer = kind === 'incoming' && isPending && !!invite.mergeCandidate;

    return (
        <Card variant="bordered" padding="md" hoverable={false} className="!rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] font-headline font-semibold text-foreground truncate">
                            {counterpartyName || counterpartyEmail}
                        </p>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            isPending
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : invite.status === 'accepted'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-surface-variant/30 text-on-surface-variant/50 border-outline-variant/20'
                        }`}>
                            {t(statusKeyMap[invite.status])}
                        </span>
                    </div>
                    {counterpartyName && (
                        <p className="text-[11px] text-on-surface-variant/40 truncate">{counterpartyEmail}</p>
                    )}
                    <p className="mt-1 text-[12px] text-on-surface-variant/60">
                        {relationshipLabel(invite.requesterRelationshipType)}
                    </p>
                    {invite.message && (
                        <p className="mt-2 text-[12px] text-on-surface-variant/70 italic border-l-2 border-secondary/30 pl-2">
                            {invite.message}
                        </p>
                    )}
                    {showMergeOffer && invite.mergeCandidate && (
                        <label className="mt-3 flex items-start gap-2 p-2.5 rounded-xl border border-secondary/30 bg-secondary/5 cursor-pointer hover:bg-secondary/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={!!mergeChecked}
                                onChange={(e) => onMergeCheckedChange?.(e.target.checked)}
                                disabled={isAccepting || isDeclining}
                                className="mt-0.5 accent-secondary shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-secondary flex items-center gap-1.5">
                                    <Link2 className="w-3 h-3" />
                                    {(t('family.inviteMergePreAccept') ||
                                        'Looks like you already have {name} in your tree — link them when you accept?')
                                        .replace('{name}', invite.mergeCandidate.name)}
                                    {invite.mergeCandidate.matchScore === 'exact' && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-0.5">
                                            {t('family.mergeMatchExact') || 'Match'}
                                        </span>
                                    )}
                                </p>
                                <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                                    {invite.mergeCandidate.name} · {invite.mergeCandidate.dob}
                                </p>
                            </div>
                        </label>
                    )}
                </div>
                {isPending && (
                    <div className="flex gap-2 shrink-0">
                        {kind === 'incoming' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onAccept}
                                    disabled={isAccepting || isDeclining}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-50 text-emerald-300 text-[12px] font-medium transition-colors"
                                >
                                    {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    {t(isAccepting ? 'family.inviteAccepting' : 'family.inviteAccept')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onDecline}
                                    disabled={isAccepting || isDeclining}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 disabled:opacity-50 text-on-surface-variant/70 text-[12px] font-medium transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    {t('family.inviteDecline')}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onRevoke}
                                disabled={isRevoking}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 disabled:opacity-50 text-red-300 text-[12px] font-medium transition-colors"
                            >
                                {isRevoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                {t('family.inviteRevoke')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

interface ConnectionRowProps {
    connection: FamilyConnection;
    onToggleSharing: () => void;
    onDisconnect: () => void;
    isToggling: boolean;
}

const ConnectionRow: React.FC<ConnectionRowProps> = ({ connection, onToggleSharing, onDisconnect, isToggling }) => {
    const { t } = useTranslation();
    return (
        <Card variant="bordered" padding="md" hoverable={false} className="!rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4 text-secondary shrink-0" />
                        <p className="text-[14px] font-headline font-semibold text-foreground truncate">
                            {connection.otherName || connection.otherEmail}
                        </p>
                    </div>
                    {connection.otherName && (
                        <p className="text-[11px] text-on-surface-variant/40 truncate mb-2">{connection.otherEmail}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-on-surface-variant/60">
                        <p>{t('family.connectionISeeThemAs', { label: relationshipLabel(connection.iSeeThemAs) })}</p>
                        <p>{t('family.connectionTheySeeMeAs', { label: relationshipLabel(connection.theySeeMeAs) })}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-on-surface-variant/60">
                        <span className={`px-2 py-0.5 rounded-full border ${
                            connection.theyShareWithMe
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-surface-variant/30 text-on-surface-variant/40 border-outline-variant/20'
                        }`}>
                            {t('family.connectionTheyShareWithMe')}: {connection.theyShareWithMe ? 'on' : 'off'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 sm:items-end">
                    <button
                        type="button"
                        onClick={onToggleSharing}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 ${
                            connection.sharingWithThem
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                                : 'bg-surface-variant/30 hover:bg-surface-variant/50 text-on-surface-variant/70'
                        }`}
                    >
                        {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {t(connection.sharingWithThem ? 'family.connectionSharingOn' : 'family.connectionSharingOff')}
                    </button>
                    <button
                        type="button"
                        onClick={onDisconnect}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('family.connectionDisconnect')}
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default FamilyInvitesClient;
