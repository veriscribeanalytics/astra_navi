'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Mail, Send, ChevronLeft, Check, X, Loader2, Heart, Clock, Trash2, Users, Search,
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
    FamilyRelationshipType,
} from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, familyPeerTierCapDetail, cooldownRetryAfter, type FamilyCapDetail } from '@/lib/familyInviteErrors';
import { useCountdown } from '@/lib/useCountdown';
import FamilyCapDialog from '@/components/family/FamilyCapDialog';
import MakeFamilyDialog from '@/components/family/MakeFamilyDialog';

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

const relationshipLabel = (rel: FamilyRelationshipType | string | null): string => {
    if (!rel) return '';
    const found = RELATIONSHIP_TYPES.find(r => r.value === rel);
    return found ? found.label : rel;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FamilyInvitesClient: React.FC = () => {
    const { t } = useTranslation();
    const { success: toastSuccess, error: toastError } = useToast();

    const incoming = useIncomingInvites();
    const outgoing = useOutgoingInvites();
    // A single source of truth: /connections returns all active connections, each
    // carrying `isFamily`. We split family vs. plain client-side.
    const connections = useFamilyConnections();
    const connectionItems: FamilyConnection[] = connections.data ?? [];
    const familyItems = connectionItems.filter(c => c.isFamily);
    const otherItems = connectionItems.filter(c => !c.isFamily);
    const connectionsLoading = connections.isLoading;
    const connectionsLoaded = connections.data !== null;
    const refetchConnections = () => connections.refetch();

    /* FAMILY_FREE_TIER_CAP upgrade dialog (send + accept + become-family). */
    const [capDialog, setCapDialog] = useState<FamilyCapDetail | null>(null);
    /* Become-family flow (pick a label + enable sharing) for a chosen connection. */
    const [makeFamilyFor, setMakeFamilyFor] = useState<FamilyConnection | null>(null);

    /* ----- Send invite form state (plain: email + optional message) ----- */
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendCooldownUntil, setSendCooldownUntil] = useState<string | null>(null);
    const sendCooldown = useCountdown(sendCooldownUntil);
    const sendBlockedByCooldown = !!sendCooldownUntil && !sendCooldown.expired;

    const emailValid = EMAIL_REGEX.test(inviteEmail.trim());

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailValid || isSending || sendBlockedByCooldown) return;
        setIsSending(true);
        const res = await sendInvite({
            email: inviteEmail.trim(),
            ...(inviteMessage.trim() ? { message: inviteMessage.trim() } : {}),
        });
        setIsSending(false);
        if (res.ok) {
            toastSuccess(t('family.inviteSent'));
            setInviteEmail('');
            setInviteMessage('');
            setSendCooldownUntil(null);
            outgoing.refetch();
        } else {
            const cap = familyCapDetail(res.raw);
            const retryAfter = cooldownRetryAfter(res.raw);
            if (retryAfter) setSendCooldownUntil(retryAfter);
            if (cap) setCapDialog(cap);
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
    };

    /* ----- Accept / decline / revoke (plain — no merge at accept) ----- */
    const [acceptingInviteId, setAcceptingInviteId] = useState<number | null>(null);
    const handleAccept = async (invite: FamilyInvite) => {
        setAcceptingInviteId(invite.id);
        const res = await acceptInvite(invite.id);
        setAcceptingInviteId(null);
        if (res.ok) {
            toastSuccess(t('family.inviteStatusAccepted'));
        } else {
            const cap = familyCapDetail(res.raw);
            if (cap) setCapDialog(cap);
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        incoming.refetch();
        refetchConnections();
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
        // Turning sharing ON without a label yet → run the become-family flow so
        // the user picks how they know them (and we can offer a merge).
        if (!conn.sharingWithThem && !conn.iSeeThemAs) {
            setMakeFamilyFor(conn);
            return;
        }
        setTogglingConnId(conn.connectionId);
        const res = await updateConnection(conn.connectionId, { sharingWithThem: !conn.sharingWithThem });
        setTogglingConnId(null);
        if (!res.ok) {
            const cap = familyCapDetail(res.raw);
            const peerCap = familyPeerTierCapDetail(res.raw);
            if (cap) setCapDialog(cap);
            else if (peerCap) toastError(peerCap.message || "They can't be added as family right now — their list is full.");
            else toastError(parseInviteErrorByStatus(res.status, res.raw, t));
        }
        refetchConnections();
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
        refetchConnections();
    };

    const renderConnection = (conn: FamilyConnection) => (
        <ConnectionRow
            key={conn.connectionId}
            connection={conn}
            onToggleSharing={() => handleToggleSharing(conn)}
            onMakeFamily={() => setMakeFamilyFor(conn)}
            onDisconnect={() => setDisconnectPrompt(conn)}
            isToggling={togglingConnId === conn.connectionId}
        />
    );

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

                {/* Send invite form (plain) */}
                <Card variant="bordered" padding="md" hoverable={false}>
                    <form onSubmit={handleSend} className="space-y-4">
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
                                placeholder={t('family.inviteMessagePlaceholder') || "Add a note (optional)…"}
                            />
                        </div>
                        <p className="text-[11px] text-on-surface-variant/55 ml-1">
                            {t('family.invitePlainHint') || 'You can mark them as family later, once you connect.'}
                        </p>
                        {sendBlockedByCooldown && (
                            <div className="flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-2xl px-3 py-2">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                {(t('family.inviteCooldownRetry') || 'Try again in {time}').replace('{time}', sendCooldown.label)}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={!emailValid || isSending || sendBlockedByCooldown}>
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
                        {connectionItems.length > 0 && (
                            <span className="ml-2 text-on-surface-variant/40">({connectionItems.length})</span>
                        )}
                    </h2>
                    {connectionsLoading && !connectionsLoaded ? (
                        <SectionSkeleton />
                    ) : connectionItems.length === 0 ? (
                        <EmptyRow text={t('family.invitesEmptyConnections')} />
                    ) : (
                        <div className="space-y-5">
                            {familyItems.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 ml-1">
                                        {t('family.connectionsFamilyGroup') || 'Family'} ({familyItems.length})
                                    </p>
                                    {familyItems.map(renderConnection)}
                                </div>
                            )}
                            {otherItems.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 ml-1">
                                        {t('family.connectionsOtherGroup') || 'Other connections'} ({otherItems.length})
                                    </p>
                                    {otherItems.map(renderConnection)}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Become-family flow */}
            {makeFamilyFor && (
                <MakeFamilyDialog
                    open={true}
                    connection={makeFamilyFor}
                    onClose={() => setMakeFamilyFor(null)}
                    onUpdated={() => refetchConnections()}
                    onFreeTierCap={(detail) => setCapDialog(detail)}
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

/** Family pill shown on connection rows once both sides share. */
const FamilyBadge: React.FC = () => {
    const { t } = useTranslation();
    return (
        <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-secondary/10 text-secondary border-secondary/30">
            <Users className="w-2.5 h-2.5" />
            {t('family.connectionKindFamily') || 'Family'}
        </span>
    );
};

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
}

const InviteRow: React.FC<InviteRowProps> = ({
    invite, kind, onAccept, onDecline, onRevoke, isAccepting, isDeclining, isRevoking,
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
                    {invite.message && (
                        <p className="mt-2 text-[12px] text-on-surface-variant/70 italic border-l-2 border-secondary/30 pl-2">
                            {invite.message}
                        </p>
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
    onMakeFamily: () => void;
    onDisconnect: () => void;
    isToggling: boolean;
}

const ConnectionRow: React.FC<ConnectionRowProps> = ({ connection, onToggleSharing, onMakeFamily, onDisconnect, isToggling }) => {
    const { t } = useTranslation();
    // Offer "Make family" when this isn't family yet and we haven't set a label.
    const canMakeFamily = !connection.isFamily && !connection.sharingWithThem;
    return (
        <Card variant="bordered" padding="md" hoverable={false} className="!rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4 text-secondary shrink-0" />
                        <p className="text-[14px] font-headline font-semibold text-foreground truncate">
                            {connection.otherName || connection.otherEmail}
                        </p>
                        {connection.isFamily && <FamilyBadge />}
                    </div>
                    {connection.otherName && (
                        <p className="text-[11px] text-on-surface-variant/40 truncate mb-2">{connection.otherEmail}</p>
                    )}
                    {(connection.iSeeThemAs || connection.theySeeMeAs) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-on-surface-variant/60">
                            {connection.iSeeThemAs && (
                                <p>{t('family.connectionISeeThemAs', { label: relationshipLabel(connection.iSeeThemAs) })}</p>
                            )}
                            {connection.theySeeMeAs && (
                                <p>{t('family.connectionTheySeeMeAs', { label: relationshipLabel(connection.theySeeMeAs) })}</p>
                            )}
                        </div>
                    )}
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
                    {canMakeFamily ? (
                        <button
                            type="button"
                            onClick={onMakeFamily}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary text-[12px] font-medium transition-colors"
                        >
                            <Users className="w-3.5 h-3.5" />
                            {t('family.makeFamilyCta') || 'Add to family'}
                        </button>
                    ) : (
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
                    )}
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
