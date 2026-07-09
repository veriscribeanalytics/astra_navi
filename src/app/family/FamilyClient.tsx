'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Users, Plus, Pencil, Trash2, Heart, BookOpen,
    Calendar, Clock, Star, AlertCircle,
    Crown, Sparkles, FileText,
    Mail, Send, Link2, Settings, Search,
    MoreVertical, Eye, ArrowUpRight, UserPlus, Activity,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSearch, { LocationResult } from '@/components/ui/LocationSearch';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTranslation, useToast, usePaywallContext } from '@/hooks';
import {
    useFamilyMembers,
    createFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    useFamilyAvatars,
    useFamilyChart,
    useFamilyConnections,
    useIncomingInvites,
    useOutgoingInvites,
    sendInvite,
    acceptInvite,
    revokeInvite,
    updateConnection,
    deleteConnection,
} from '@/hooks/useFamily';
import { useFamilyDashboard } from '@/hooks/useFamilyDashboard';
import {
    type FamilyMember,
    type FamilyConnection,
    type FamilyRelationshipType,
    type FamilyGender,
    type FamilyInvite,
    familyRosterLimit,
} from '@/types/family';
import { parseInviteErrorByStatus, familyCapDetail, familyPeerTierCapDetail, cooldownRetryAfter, type FamilyCapDetail } from '@/lib/familyInviteErrors';
import { computeFamilyMemberStatus } from '@/lib/familyStatus';
import { getFamilyIcon, formatDob } from '@/lib/familyDisplay';
import { useCountdown } from '@/lib/useCountdown';
import MakeFamilyDialog from '@/components/family/MakeFamilyDialog';
import OpenMessageButton from '@/components/family/OpenMessageButton';
import { tzOffsetHoursAt } from '@/lib/tzOffset';
import { isUnder18 } from '@/utils/age';
import FamilyChartView from '@/components/family/FamilyChartView';
import BondDashboardBody, { memberFromConnection } from '@/components/family/BondDashboardBody';
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

const GENDERS: { value: FamilyGender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

/* ====================================================================== */
/* MAIN CLIENT                                                            */
/* ====================================================================== */

export default function FamilyClient() {
    const { t } = useTranslation();
    const { tier } = usePaywallContext();
    const { success, error: toastError } = useToast();
    const { data: members, isLoading, error, refetch } = useFamilyMembers();
    // /connections returns all active connections, accepted invites that aren't
    // mutually sharing yet. Mutually-sharing linked entries now live in `members`.
    const { data: allConnections, refetch: refetchAll } = useFamilyConnections();
    const { data: incomingInvites } = useIncomingInvites();
    const { data: outgoingInvites } = useOutgoingInvites();
    // The connections tab shows ALL accepted connections, including ones that are
    // already family — that overlap is intentional by backend design.
    const connections = useMemo(() => allConnections ?? [], [allConnections]);
    const refetchConnections = () => { refetchAll(); };

    const [view, setView] = useState<'list' | 'form' | 'detail' | 'invite' | 'connectionDetail'>('list');
    const [editing, setEditing] = useState<FamilyMember | null>(null);
    const [detailMember, setDetailMember] = useState<FamilyMember | null>(null);
    const [detailConnection, setDetailConnection] = useState<FamilyConnection | null>(null);
    const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Deep-link: when arriving via `/family?member=<id>` from the dashboard
    // strip, auto-open that member's detail view once the members list loads.
    // Guard ref prevents the effect from re-firing if the user navigates back
    // to the list and the URL still carries the param.
    const searchParams = useSearchParams();
    const memberIdParam = searchParams?.get('member');
    const sourceParam = searchParams?.get('source') as FamilyMember['source'] | null;
    const autoOpenedRef = useRef(false);

    useEffect(() => {
        if (autoOpenedRef.current) return;
        if (!memberIdParam || !members) return;
        const found = members.find(m =>
            String(m.id) === memberIdParam &&
            (sourceParam ? m.source === sourceParam : true)
        );
        if (!found) return;
        if (found.source === 'linked') {
            const conn = allConnections?.find(c => c.connectionId === found.connectionId);
            if (conn) {
                setDetailConnection(conn);
                setView('connectionDetail');
                autoOpenedRef.current = true;
            }
            return;
        }
        setDetailMember(found);
        setView('detail');
        autoOpenedRef.current = true;
    }, [memberIdParam, sourceParam, members, allConnections]);

    // /api/family/members now returns manual entries + linked connections where
    // both sides share. The array length itself is the roster count.
    const totalCount = members?.length ?? 0;
    // null limit = unlimited (premium). Free: 1, Pro: 6.
    const rosterLimit = familyRosterLimit(tier);
    const atFreeCap = rosterLimit != null && totalCount >= rosterLimit;
    const showCounter = rosterLimit != null;

    // FAMILY_FREE_TIER_CAP upgrade dialog (shared across create path here; the
    // invites/discover pages own their own instances).
    const [capDialog, setCapDialog] = useState<FamilyCapDetail | null>(null);

    const openAdd = () => {
        setEditing(null);
        setView('form');
    };

    const openInvite = () => {
        setView('invite');
    };

    const openEdit = (m: FamilyMember) => {
        setEditing(m);
        setView('form');
    };

    const openDetail = (m: FamilyMember) => {
        if (m.source === 'linked') {
            const conn = allConnections?.find(c => c.connectionId === m.connectionId);
            if (conn) {
                setDetailConnection(conn);
                setView('connectionDetail');
                return;
            }
        }
        setDetailMember(m);
        setView('detail');
    };

    const openConnectionDetail = (c: FamilyConnection) => {
        setDetailConnection(c);
        setView('connectionDetail');
    };

    const backToList = () => {
        setView('list');
        setEditing(null);
        setDetailMember(null);
        setDetailConnection(null);
    };

    const handleDelete = async () => {
        if (!deletingMember) return;
        if (deletingMember.source !== 'manual') {
            // Linked-family entries are managed via connection detail/disonnect.
            setDeletingMember(null);
            return;
        }
        setIsDeleting(true);
        const res = await deleteFamilyMember(deletingMember.id);
        setIsDeleting(false);
        if (!res.ok) {
            toastError(res.error || 'Failed to remove member');
            return;
        }
        success(`${deletingMember.name} removed.`);
        setDeletingMember(null);
        if (detailMember?.id === deletingMember.id) {
            setDetailMember(null);
            setView('list');
        }
        refetch();
    };

    return (
        <div className="min-h-screen pt-[calc(var(--navbar-height,64px)+1.5rem)] pb-12">
            <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-3 mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-[#C9972E]/10 border border-[#C9972E]/20 flex items-center justify-center text-[#C9972E] shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-[#F4EFE7]">
                                    {t('family.myFamily') || 'My Family'}
                                </h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                {(view === 'list' || view === 'detail' || view === 'connectionDetail') && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={openAdd}
                            leftIcon={<Plus className="w-4 h-4" />}
                            disabled={atFreeCap}
                            className="bg-gradient-to-r from-[#C9972E] to-[#A57E23]"
                        >
                            <span className="hidden sm:inline">{t('family.addFamilyMember') || 'Add Family Member'}</span>
                            <span className="sm:hidden">{t('family.addShort') || 'Add'}</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={openInvite}
                            leftIcon={<Mail className="w-4 h-4" />}
                            disabled={atFreeCap}
                        >
                            <span className="hidden sm:inline">{t('family.inviteByEmail') || 'Invite'}</span>
                            <span className="sm:hidden">{t('family.inviteShort') || 'Invite'}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            href="/family/discover"
                            leftIcon={<Search className="w-4 h-4" />}
                        >
                            {t('family.discoverNavLink') || 'Find people'}
                        </Button>
                    </div>
                )}
                        </div>
                    </div>

                    {/* Roster counter (hidden for unlimited/premium) */}
                    {showCounter && view === 'list' && (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant/70">
                            <Crown className="w-3.5 h-3.5 text-secondary/70" />
                            <span>
                                {totalCount} / {rosterLimit} {t('family.freeTierUsed') || 'members used on your plan'}
                            </span>
                            {atFreeCap && (
                                <a href="/plans" className="text-secondary font-bold hover:underline">
                                    {t('family.upgrade') || 'Upgrade for more'}
                                </a>
                            )}
                        </div>
                    )}
                </header>

                {/* Views */}
        {view === 'list' && (
                    <FamilyList
                        members={members}
                        connections={connections}
                        incomingInvites={incomingInvites ?? null}
                        outgoingInvites={outgoingInvites ?? null}
                        isLoading={isLoading}
                        error={error}
                        onOpen={openDetail}
                        onOpenConnection={openConnectionDetail}
                        onEdit={openEdit}
                        onDelete={(m) => setDeletingMember(m)}
                        onAdd={openAdd}
                        atFreeCap={atFreeCap}
                    />
                )}

                {view === 'form' && (
                    <FamilyMemberForm
                        editing={editing}
                        onCancel={backToList}
                        onSaved={(member, isNew) => {
                            success(
                                isNew
                                    ? `${member.name} added to your family.`
                                    : `${member.name} updated.`
                            );
                            refetch();
                            if (isNew) {
                                setDetailMember(member);
                                setView('detail');
                            } else {
                                setView('list');
                            }
                        }}
                        onFreeTierCap={(detail) => {
                            setCapDialog(detail ?? {});
                            setView('list');
                        }}
                    />
                )}

                {view === 'invite' && (
                    <FamilyInviteForm
                        onCancel={backToList}
                        onSent={() => {
                            success(t('family.inviteSent') || 'Invite sent');
                            setView('list');
                        }}
                    />
                )}

                {view === 'detail' && detailMember && (
                    <FamilyMemberDetail member={detailMember} onEdit={() => openEdit(detailMember)} onBack={backToList} />
                )}

                {view === 'connectionDetail' && detailConnection && (
                    <FamilyConnectionDetail
                        connection={detailConnection}
                        onBack={backToList}
                        onUpdated={(updated) => {
                            setDetailConnection(updated);
                            refetchConnections();
                        }}
                        onDisconnected={() => {
                            success(`${detailConnection.otherName} disconnected.`);
                            refetchConnections();
                            backToList();
                        }}
                    />
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deletingMember}
                onClose={() => setDeletingMember(null)}
                onConfirm={handleDelete}
                title={t('family.removeTitle') || 'Remove family member?'}
                message={
                    deletingMember
                        ? `${deletingMember.name} will be removed along with any saved chart and compatibility data. This cannot be undone.`
                        : ''
                }
                confirmText={t('family.removeConfirm') || 'Remove'}
                cancelText={t('common.back') || 'Cancel'}
                variant="danger"
                isLoading={isDeleting}
            />

            <FamilyCapDialog
                open={!!capDialog}
                onClose={() => setCapDialog(null)}
                message={capDialog?.message}
                currentTier={capDialog?.currentTier ?? tier}
                limit={capDialog?.limit ?? rosterLimit}
            />
        </div>
    );
}

/* ====================================================================== */
/* LIST                                                                   */
/* ====================================================================== */

function formatRelationshipLabel(rel?: string | null): string {
    if (!rel) return '';
    return rel.charAt(0).toUpperCase() + rel.slice(1);
}

interface FamilyListProps {
    members: FamilyMember[] | null;
    connections: FamilyConnection[];
    incomingInvites: FamilyInvite[] | null;
    outgoingInvites: FamilyInvite[] | null;
    isLoading: boolean;
    error: string | null;
    onOpen: (m: FamilyMember) => void;
    onOpenConnection: (c: FamilyConnection) => void;
    onEdit: (m: FamilyMember) => void;
    onDelete: (m: FamilyMember) => void;
    onAdd: () => void;
    atFreeCap: boolean;
}

function FamilyList({
    members,
    connections: otherConnections,
    incomingInvites,
    outgoingInvites,
    isLoading,
    error,
    onOpen,
    onOpenConnection,
    onEdit,
    onDelete,
    onAdd,
    atFreeCap,
}: FamilyListProps) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'family' | 'connections'>('family');

    const hasMembers = !!members && members.length > 0;
    const connectionLinks = otherConnections ?? [];
    const hasFamilySection = hasMembers;
    const hasOthers = connectionLinks.length > 0;
    const isEmpty = !hasFamilySection && !hasOthers;
    const pendingInvitesCount = (incomingInvites?.length ?? 0) + (outgoingInvites?.length ?? 0);
    const familyCount = members?.length ?? 0;
    const connectionsCount = connectionLinks.length;

    if (isLoading && !members) {
        return (
            <Card variant="default" padding="lg" className="bg-[#170D31] border-[rgba(196,181,253,0.11)]">
                <div className="flex items-center justify-center text-secondary/60">
                    <Star className="w-5 h-5 animate-pulse" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card variant="bordered" padding="md" className="border-red-500/30 bg-[#170D31]">
                <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            </Card>
        );
    }

    if (isEmpty) {
        return (
            <Card variant="default" padding="lg" className="bg-[#170D31] border-[rgba(196,181,253,0.11)]">
                <div className="text-center py-8">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-[#C9972E]/10 items-center justify-center text-[#C9972E] mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-headline font-bold text-[#F4EFE7] mb-2">
                        {t('family.empty') || 'No family members yet'}
                    </h3>
                    <p className="text-sm text-[#AFA8C0] mb-5 max-w-md mx-auto">
                        {t('family.emptyDesc') ||
                            'Add a parent, partner, or friend to view their chart and check compatibility.'}
                    </p>
                    <Button variant="primary" size="md" onClick={onAdd} leftIcon={<Plus className="w-4 h-4" />} disabled={atFreeCap}>
                        {t('family.addFirstMember') || 'Add Your First Member'}
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tabs placed under the page title, aligned with the content grid. */}
            <div className="border-b border-[rgba(196,181,253,0.11)] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm text-[#AFA8C0] max-w-2xl leading-relaxed">
                            {t('family.subtitle') || 'Save birth details, view charts, and check compatibility with loved ones.'}
                        </p>
                    </div>
                    <div className="inline-flex p-1 bg-[#170D31] border border-[rgba(196,181,253,0.11)] rounded-2xl" role="tablist">
                        <button
                            role="tab"
                            aria-selected={tab === 'family'}
                            onClick={() => setTab('family')}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                tab === 'family'
                                    ? 'border border-[#C9972E] bg-[#C9972E]/10 text-[#C9972E]'
                                    : 'text-[#AFA8C0] hover:text-[#F4EFE7]'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            {t('family.tabFamily') || 'Family'}
                            <span className="text-[#AFA8C0]/60 normal-case">({familyCount})</span>
                        </button>
                        <button
                            role="tab"
                            aria-selected={tab === 'connections'}
                            onClick={() => setTab('connections')}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                tab === 'connections'
                                    ? 'border border-[#C9972E] bg-[#C9972E]/10 text-[#C9972E]'
                                    : 'text-[#AFA8C0] hover:text-[#F4EFE7]'
                            }`}
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            {t('family.tabConnections') || 'Connections'}
                            <span className="text-[#AFA8C0]/60 normal-case">({connectionsCount})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* FAMILY TAB */}
            {tab === 'family' && (
                hasFamilySection ? (
                    <section className="space-y-4">
                        <p className="text-sm text-[#AFA8C0] max-w-2xl">
                            {t('family.tabFamilyHint') || 'People you share birth details with both ways. View their chart and run compatibility.'}
                        </p>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {(members ?? []).map((m) => (
                                <MemberCard
                                    key={`m-${m.source}-${m.id}`}
                                    member={m}
                                    onOpen={() => onOpen(m)}
                                    onEdit={() => onEdit(m)}
                                    onDelete={() => onDelete(m)}
                                />
                            ))}
                        </div>
                    </section>
                ) : (
                    <TabEmptyState
                        icon={<Users className="w-6 h-6" />}
                        title={t('family.tabFamilyEmptyTitle') || 'No family members yet'}
                        desc={hasOthers
                            ? (t('family.tabFamilyEmptyWithConnections') || 'Turn on two-way sharing with a connection to add them here, or add a member manually.')
                            : (t('family.emptyDesc') || 'Add a parent, partner, or friend to view their chart and check compatibility.')}
                        action={
                            <Button variant="primary" size="md" onClick={onAdd} leftIcon={<Plus className="w-4 h-4" />} disabled={atFreeCap}>
                                {t('family.addFirstMember') || 'Add Your First Member'}
                            </Button>
                        }
                    />
                )
            )}

            {/* CONNECTIONS TAB */}
            {tab === 'connections' && (
                hasOthers ? (
                    <section className="space-y-4">
                        <p className="text-sm text-[#AFA8C0] max-w-2xl">
                            {t('family.tabConnectionsHint') || 'People you’re connected with. Enable two-way sharing to move someone into Family and unlock compatibility.'}
                        </p>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {connectionLinks.map((c) => (
                                <ConnectionCard key={`c-${c.connectionId}`} connection={c} onManage={() => onOpenConnection(c)} />
                            ))}
                        </div>
                    </section>
                ) : (
                    <TabEmptyState
                        icon={<Link2 className="w-6 h-6" />}
                        title={t('family.tabConnectionsEmptyTitle') || 'No connections yet'}
                        desc={t('family.tabConnectionsEmptyDesc') || 'Invite someone or accept an invite to start a connection. Family links still appear here too.'}
                    />
                )
            )}

            {/* Lower-page content */}
            {tab === 'family' && (
                <LowerPageSuggestions
                    pendingInvitesCount={pendingInvitesCount}
                    incomingInvites={incomingInvites}
                    outgoingInvites={outgoingInvites}
                    connections={connectionLinks}
                    members={members}
                />
            )}
        </div>
    );
}

function TabEmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
    return (
        <Card variant="default" padding="lg" className="bg-[#170D31] border-[rgba(196,181,253,0.11)]">
            <div className="text-center py-8">
                <div className="inline-flex w-14 h-14 rounded-2xl bg-[#C9972E]/10 items-center justify-center text-[#C9972E] mb-4">
                    {icon}
                </div>
                <h3 className="text-lg font-headline font-bold text-[#F4EFE7] mb-2">{title}</h3>
                <p className="text-sm text-[#AFA8C0] mb-5 max-w-md mx-auto">{desc}</p>
                {action}
            </div>
        </Card>
    );
}

function SuggestedActionCard({
    icon,
    title,
    desc,
    action,
    highlight = false,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    action?: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <Card
            variant="default"
            padding="sm"
            hoverable={!!action}
            className={`bg-[#170D31] border-[rgba(196,181,253,0.11)] ${highlight ? 'ring-1 ring-[#C9972E]/20' : ''}`}
        >
            <div className="flex items-start gap-3">
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? 'bg-[#C9972E]/10 text-[#C9972E]' : 'bg-[rgba(196,181,253,0.08)] text-[#AFA8C0]'}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-headline font-bold text-[#F4EFE7] truncate">{title}</h4>
                    <p className="text-xs text-[#AFA8C0] mt-0.5 leading-relaxed">{desc}</p>
                    {action && <div className="mt-2">{action}</div>}
                </div>
            </div>
        </Card>
    );
}

function LowerPageSuggestions({
    pendingInvitesCount,
    incomingInvites,
    outgoingInvites,
    connections,
    members,
}: {
    pendingInvitesCount: number;
    incomingInvites: FamilyInvite[] | null;
    outgoingInvites: FamilyInvite[] | null;
    members: FamilyMember[] | null;
    connections: FamilyConnection[];
}) {
    const { t } = useTranslation();
    const { success, error: toastError } = useToast();
    const pendingIncoming = incomingInvites?.filter((i: FamilyInvite) => i.status === 'pending') ?? [];
    const pendingOutgoing = outgoingInvites?.filter((i: FamilyInvite) => i.status === 'pending') ?? [];

    const handleAccept = async (invite: FamilyInvite) => {
        const res = await acceptInvite(invite.id);
        if (res.ok) {
            success(t('family.inviteStatusAccepted') || 'Invite accepted');
        } else {
            toastError(res.error || t('family.inviteAcceptError') || 'Could not accept invite');
        }
    };

    const handleRevoke = async (invite: FamilyInvite) => {
        const res = await revokeInvite(invite.id);
        if (res.ok) {
            success(t('family.inviteStatusRevoked') || 'Invite revoked');
        } else {
            toastError(res.error || t('family.inviteRevokeError') || 'Could not revoke invite');
        }
    };

    if (pendingInvitesCount === 0 && members && members.length >= 3) return null;

    return (
        <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[rgba(196,181,253,0.08)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#AFA8C0]">
                    {t('family.suggested') || 'Suggested'}
                </span>
                <div className="h-px flex-1 bg-[rgba(196,181,253,0.08)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingIncoming.length > 0 && (
                    <SuggestedActionCard
                        highlight
                        icon={<Mail className="w-4 h-4" />}
                        title={t('family.pendingInvitesTitle') || 'Pending invitations'}
                        desc={t('family.pendingIncomingDesc') || 'You have invites waiting to be accepted.'}
                        action={
                            <div className="space-y-2">
                                {pendingIncoming.slice(0, 2).map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between gap-2 rounded-lg bg-[rgba(196,181,253,0.05)] p-2">
                                        <span className="text-xs text-[#F4EFE7] truncate">{invite.requesterName || invite.requesterEmail}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleAccept(invite)}
                                                className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                aria-label={t('family.accept') || 'Accept'}
                                            >
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {pendingIncoming.length > 2 && (
                                    <a href="/family/invites" className="text-xs font-bold text-[#C9972E] hover:underline">
                                        {t('family.viewAllInvites') || 'View all invites'}
                                    </a>
                                )}
                            </div>
                        }
                    />
                )}

                {pendingOutgoing.length > 0 && (
                    <SuggestedActionCard
                        icon={<Send className="w-4 h-4" />}
                        title={t('family.outgoingInvitesTitle') || 'Sent invitations'}
                        desc={t('family.outgoingInvitesDesc') || 'Invites you have already sent.'}
                        action={
                            <div className="space-y-2">
                                {pendingOutgoing.slice(0, 2).map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between gap-2 rounded-lg bg-[rgba(196,181,253,0.05)] p-2">
                                        <span className="text-xs text-[#F4EFE7] truncate">{invite.inviteeName || invite.inviteeEmail}</span>
                                        <button
                                            onClick={() => handleRevoke(invite)}
                                            className="p-1.5 rounded-md text-[#AFA8C0] hover:text-red-400 hover:bg-red-500/10"
                                            aria-label={t('common.revoke') || 'Revoke'}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        }
                    />
                )}

                {(members?.length ?? 0) < 3 && (
                    <SuggestedActionCard
                        icon={<UserPlus className="w-4 h-4" />}
                        title={t('family.addMoreTitle') || 'Add more family members'}
                        desc={t('family.addMoreDesc') || 'Build a fuller compatibility picture by adding parents, partner, or close friends.'}
                        action={
                            <a
                                href="/family"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9972E]/40 bg-[#170D31] px-2.5 py-1.5 text-xs font-bold text-[#C9972E] hover:bg-[#C9972E]/10 transition-colors"
                            >
                                {t('family.addFamilyMember') || 'Add member'}
                            </a>
                        }
                    />
                )}

                <SuggestedActionCard
                    icon={<Search className="w-4 h-4" />}
                    title={t('family.discoverTitle') || 'Find people'}
                    desc={t('family.discoverDesc') || 'Search for other AstraNavi users to connect with.'}
                    action={
                        <a
                            href="/family/discover"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(196,181,253,0.11)] bg-[rgba(196,181,253,0.05)] px-2.5 py-1.5 text-xs font-bold text-[#AFA8C0] hover:border-[#C9972E]/40 hover:text-[#F4EFE7] transition-colors"
                        >
                            {t('family.discoverNavLink') || 'Find people'}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                    }
                />

                {connections.length > 0 && (members?.length ?? 0) < 3 && (
                    <SuggestedActionCard
                        icon={<Link2 className="w-4 h-4" />}
                        title={t('family.turnOnSharingTitle') || 'Turn on sharing'}
                        desc={t('family.turnOnSharingDesc') || 'Enable two-way sharing with a connection to move them into Family.'}
                        action={
                            <a
                                href="/family?tab=connections"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9972E]/40 bg-[#170D31] px-2.5 py-1.5 text-xs font-bold text-[#C9972E] hover:bg-[#C9972E]/10 transition-colors"
                            >
                                {t('family.viewConnections') || 'View connections'}
                            </a>
                        }
                    />
                )}
            </div>
        </section>
    );
}

function CompactScoreRing({ score, size = 44 }: { score: number; size?: number }) {
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.max(0, Math.min(100, score));
    const offset = circumference - (pct / 100) * circumference;
    const color = pct >= 70 ? '#3DD6A0' : pct >= 55 ? '#E5A33A' : '#D96B78';
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="-rotate-90" width={size} height={size} viewBox="0 0 32 32">
                <circle cx="16" cy="16" r={radius} fill="none" stroke="rgba(196,181,253,0.11)" strokeWidth="3" />
                <circle
                    cx="16" cy="16" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700"
                />
            </svg>
            <span className="absolute text-[10px] font-black tabular-nums" style={{ color }}>{score}</span>
        </div>
    );
}

function MemberCard({ member: m, onOpen, onEdit, onDelete }: { member: FamilyMember; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
    const { t, language } = useTranslation();
    const isLinked = m.source === 'linked';
    const relationshipLabel = formatRelationshipLabel(m.relationshipType) || (t('family.relationshipNotSet') || 'Connection');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [menuOpen]);

    // Daily bond dashboard drives the card preview (free teaser — zero credits,
    // server-cached 1h). Replaces the old free /compatibility/summary fetch.
    const { data: dashboard, isLoading: bondLoading } = useFamilyDashboard(m, language);

    const rawScore = dashboard?.bond?.score;
    const score = typeof rawScore === 'number' ? Math.max(0, Math.min(100, Math.round(rawScore))) : null;
    const status = computeFamilyMemberStatus({ member: m, dashboard: dashboard ?? null });
    const verdict = dashboard?.guidance?.summary ?? null;
    const birthDetailStatus = isLinked
        ? null
        : status?.kind === 'incomplete'
            ? (t('family.statusIncompleteShort') || 'Birth details incomplete')
            : (m.dob ? formatDob(m.dob) : (t('family.statusCompleteShort') || 'Birth details saved'));

    return (
        <div
            className="bg-[#170D31] border border-[rgba(196,181,253,0.11)] rounded-[24px] transition-all duration-300 hover:border-[rgba(196,181,253,0.22)] hover:shadow-lg cursor-pointer"
            onClick={onOpen}
        >
            <div className="flex items-stretch gap-0">
                {/* Avatar column */}
                <div className="shrink-0 w-[72px] sm:w-20 flex flex-col items-center justify-center gap-2 border-r border-[rgba(196,181,253,0.08)] p-3">
                    <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border"
                        style={{
                            color: m.avatar?.accentColor || '#C9972E',
                            borderColor: `${m.avatar?.accentColor || '#C9972E'}33`,
                            backgroundColor: `${m.avatar?.accentColor || '#C9972E'}11`,
                        }}
                    >
                        {m.avatar
                            ? React.createElement(getFamilyIcon(m.avatar.iconKey), { className: 'w-5 h-5 sm:w-6 sm:h-6' })
                            : <span className="text-lg font-headline font-bold">{m.name.charAt(0).toUpperCase()}</span>
                        }
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#C9972E] text-center leading-tight">
                        {relationshipLabel}
                    </span>
                </div>

                {/* Centre content */}
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-headline font-bold text-[#F4EFE7] truncate">{m.name}</h3>
                            {isLinked && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-[#C9972E]/10 text-[#C9972E] border-[#C9972E]/30 shrink-0">
                                    <Link2 className="w-2.5 h-2.5" />
                                    {t('family.connectionKindFamily') || 'Linked'}
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#AFA8C0]">
                            {birthDetailStatus && (
                                <span className="inline-flex items-center gap-1.5">
                                    {status?.kind === 'incomplete' ? (
                                        <AlertCircle className="w-3 h-3 text-amber-400" />
                                    ) : (
                                        <Calendar className="w-3 h-3 text-[#C9972E]" />
                                    )}
                                    {birthDetailStatus}
                                </span>
                            )}
                            {verdict && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 opacity-60" />
                                    {verdict}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottom action row */}
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={onOpen}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9972E]/40 bg-[#170D31] px-2.5 py-1.5 text-xs font-bold text-[#C9972E] hover:bg-[#C9972E]/10 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            {isLinked ? (t('family.manage') || 'Manage') : (t('family.viewProfile') || 'View Profile')}
                        </button>
                        <button
                            type="button"
                            onClick={onOpen}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(196,181,253,0.11)] bg-[rgba(196,181,253,0.05)] px-2.5 py-1.5 text-xs font-bold text-[#AFA8C0] hover:border-[#C9972E]/40 hover:text-[#F4EFE7] transition-colors"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            {t('family.viewBond') || 'View Bond'}
                        </button>
                    </div>
                </div>

                {/* Right column: score + more menu */}
                <div className="shrink-0 w-[72px] sm:w-20 flex flex-col items-center justify-between p-3 border-l border-[rgba(196,181,253,0.08)]">
                    <div className="relative">
                        {score !== null && !bondLoading ? (
                            <CompactScoreRing score={score} size={48} />
                        ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[rgba(196,181,253,0.11)] bg-[rgba(196,181,253,0.05)] flex items-center justify-center">
                                <Star className="w-4 h-4 text-[#AFA8C0]/50" />
                            </div>
                        )}
                    </div>
                    <div className="mt-auto relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((v) => !v)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#AFA8C0] hover:text-[#F4EFE7] hover:bg-[rgba(196,181,253,0.08)] transition-colors"
                            aria-label="More actions"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 bottom-full mb-2 z-20 min-w-[140px] rounded-xl border border-[rgba(196,181,253,0.11)] bg-[#170D31] shadow-xl p-1.5">
                                {!isLinked && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setMenuOpen(false); onEdit(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#AFA8C0] hover:bg-[rgba(196,181,253,0.08)] hover:text-[#F4EFE7] transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit member
                                        </button>
                                        <div className="my-1 h-px bg-[rgba(196,181,253,0.08)]" />
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); onDelete(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isLinked ? 'Disconnect' : 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ConnectionCard({ connection: c, onManage }: { connection: FamilyConnection; onManage: () => void }) {
    const { t } = useTranslation();
    const accent = c.avatar?.accentColor || '#C9972E';
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [menuOpen]);

    const sharingLabel = c.sharingWithThem
        ? (t('family.connectionSharingOn') || 'Sharing on')
        : (t('family.connectionSharingOff') || 'Sharing off');

    return (
        <div
            className="bg-[#170D31] border border-[rgba(196,181,253,0.11)] rounded-[24px] transition-all duration-300 hover:border-[rgba(196,181,253,0.22)] hover:shadow-lg cursor-pointer"
            onClick={onManage}
        >
            <div className="flex items-stretch gap-0">
                {/* Avatar column */}
                <div className="shrink-0 w-[72px] sm:w-20 flex flex-col items-center justify-center gap-2 border-r border-[rgba(196,181,253,0.08)] p-3">
                    <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border"
                        style={{
                            color: accent,
                            borderColor: `${accent}33`,
                            backgroundColor: `${accent}11`,
                        }}
                    >
                        {c.avatar
                            ? React.createElement(getFamilyIcon(c.avatar.iconKey), { className: 'w-5 h-5 sm:w-6 sm:h-6' })
                            : <span className="text-lg font-headline font-bold" style={{ color: accent }}>{c.otherName.charAt(0).toUpperCase()}</span>
                        }
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${c.isFamily ? 'text-[#C9972E]' : 'text-sky-300'}`}>
                        {c.isFamily ? (t('family.connectionKindFamily') || 'Family') : (t('family.connectionStatusConnected') || 'Connected')}
                    </span>
                </div>

                {/* Centre content */}
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base sm:text-lg font-headline font-bold text-[#F4EFE7] truncate">{c.otherName}</h3>
                        {c.iSeeThemAs && (
                            <p className="text-xs text-[#C9972E] font-bold uppercase tracking-wider mt-0.5">
                                {formatRelationshipLabel(c.iSeeThemAs)}
                            </p>
                        )}
                        <div className="mt-2 space-y-1 text-xs text-[#AFA8C0]">
                            <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 opacity-60 shrink-0" />
                                <span className="truncate">{c.otherEmail}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Heart className={`w-3 h-3 ${c.sharingWithThem ? 'text-emerald-400' : 'opacity-50'}`} />
                                <span className={c.sharingWithThem ? 'text-emerald-400' : ''}>{sharingLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={onManage}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9972E]/40 bg-[#170D31] px-2.5 py-1.5 text-xs font-bold text-[#C9972E] hover:bg-[#C9972E]/10 transition-colors"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            {t('family.viewProfile') || 'View Profile'}
                        </button>
                        {!c.disconnected && (
                            <OpenMessageButton connectionId={c.connectionId} variant="ghost" />
                        )}
                    </div>
                </div>

                {/* Right column: status + more menu */}
                <div className="shrink-0 w-[72px] sm:w-20 flex flex-col items-center justify-between p-3 border-l border-[rgba(196,181,253,0.08)]">
                    <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border"
                        style={{
                            borderColor: c.sharingWithThem ? 'rgba(61,214,160,0.35)' : 'rgba(196,181,253,0.11)',
                            backgroundColor: c.sharingWithThem ? 'rgba(61,214,160,0.08)' : 'rgba(196,181,253,0.05)',
                        }}
                    >
                        <Link2 className={`w-4 h-4 sm:w-5 sm:h-5 ${c.sharingWithThem ? 'text-emerald-400' : 'text-[#AFA8C0]'}`} />
                    </div>
                    <div className="mt-auto relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((v) => !v)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#AFA8C0] hover:text-[#F4EFE7] hover:bg-[rgba(196,181,253,0.08)] transition-colors"
                            aria-label="More actions"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 bottom-full mb-2 z-20 min-w-[140px] rounded-xl border border-[rgba(196,181,253,0.11)] bg-[#170D31] shadow-xl p-1.5">
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); onManage(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#AFA8C0] hover:bg-[rgba(196,181,253,0.08)] hover:text-[#F4EFE7] transition-colors"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    {t('family.manage') || 'Manage'}
                                </button>
                                <div className="my-1 h-px bg-[rgba(196,181,253,0.08)]" />
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); /* disconnect handled inside connection detail */ }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {t('family.disconnect') || 'Disconnect'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ====================================================================== */
/* FORM (create + edit)                                                   */
/* ====================================================================== */

interface FormProps {
    editing: FamilyMember | null;
    onSaved: (m: FamilyMember, isNew: boolean) => void;
    onCancel: () => void;
    onFreeTierCap: (detail: FamilyCapDetail | null) => void;
}

interface FormState {
    name: string;
    relationshipType: FamilyRelationshipType;
    gender: FamilyGender;
    dob: string;
    tob: string;
    pob: string;
    latitude: number | null;
    longitude: number | null;
    timezoneName: string;
    notes: string;
    consentAcknowledged: boolean;
    avatarKey: string;
}

function FamilyMemberForm({ editing, onSaved, onCancel, onFreeTierCap }: FormProps) {
    const { t } = useTranslation();
    const { error: toastError } = useToast();
    const isEdit = !!editing;

    const [state, setState] = useState<FormState>(() => ({
        name: editing?.name ?? '',
        relationshipType: (editing?.relationshipType as FamilyRelationshipType) ?? 'other',
        gender: (editing?.gender as FamilyGender) ?? 'other',
        dob: editing?.dob ?? '',
        tob: editing?.tob ?? '',
        pob: editing?.pob ?? '',
        latitude: editing?.latitude ?? null,
        longitude: editing?.longitude ?? null,
        timezoneName: '',
        notes: editing?.notes ?? '',
        avatarKey: editing?.avatarKey ?? '',
        // Consent is locked on existing records; we only send it on create.
        consentAcknowledged: isEdit,
    }));

    const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(() => {
        if (editing && editing.latitude != null && editing.longitude != null) {
            return {
                name: editing.pob ?? '',
                lat: editing.latitude,
                lon: editing.longitude,
                timezone: '',
            };
        }
        return null;
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const { data: familyAvatars } = useFamilyAvatars();

    const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setState((s) => ({ ...s, [k]: v }));

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!state.name.trim()) e.name = 'Name is required';
        if (!state.dob) e.dob = 'Date of birth is required';
        else if (isUnder18(state.dob)) e.dob = "Astra Navi is for adults (18+). You can't add a minor's birth details.";
        if (!state.tob) e.tob = 'Time of birth is required';
        if (!state.pob.trim()) e.pob = 'Place of birth is required';
        if (state.latitude === null || state.longitude === null) {
            e.pob = e.pob || 'Please select a location from the dropdown';
        }
        if (!isEdit && !state.consentAcknowledged) {
            e.consent = 'Please confirm consent to continue';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) {
            toastError('Please fix the highlighted fields.');
            return;
        }
        setIsSaving(true);
        try {
            if (isEdit && editing) {
                // Compute timezoneOffset if we have an IANA name from a new selection;
                // otherwise re-derive from the existing member's metadata if needed.
                const computedTz = state.timezoneName
                    ? tzOffsetHoursAt(state.timezoneName, state.dob, state.tob)
                    : null;
                const payload = {
                    name: state.name.trim(),
                    gender: state.gender,
                    dob: state.dob,
                    tob: state.tob,
                    pob: state.pob.trim(),
                    latitude: state.latitude ?? undefined,
                    longitude: state.longitude ?? undefined,
                    ...(computedTz !== null ? { timezoneOffset: computedTz } : {}),
                    notes: state.notes.trim() || undefined,
                    avatarKey: state.avatarKey || undefined,
                };
                const res = await updateFamilyMember(editing.id, payload);
                if (!res.ok || !res.data) {
                    toastError(res.error || 'Failed to update member.');
                    return;
                }
                onSaved(res.data, false);
                return;
            }
            // CREATE — timezoneOffset is required.
            const tz = tzOffsetHoursAt(state.timezoneName, state.dob, state.tob);
            if (tz === null) {
                toastError('Could not determine timezone from the selected location. Please re-pick the city.');
                return;
            }
            const payload = {
                name: state.name.trim(),
                relationshipType: state.relationshipType,
                gender: state.gender,
                dob: state.dob,
                tob: state.tob,
                pob: state.pob.trim(),
                latitude: state.latitude!,
                longitude: state.longitude!,
                timezoneOffset: tz,
                notes: state.notes.trim() || undefined,
                avatarKey: state.avatarKey || undefined,
                consentAcknowledged: true as const,
            };
            const res = await createFamilyMember(payload);
            if (!res.ok || !res.data) {
                const cap = familyCapDetail(res.raw);
                if (cap) {
                    onFreeTierCap(cap);
                    return;
                }
                toastError(res.error || 'Failed to add member.');
                return;
            }
            onSaved(res.data, true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card variant="default" padding="lg">
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <h2 className="text-lg font-headline font-bold text-primary mb-1">
                        {isEdit
                            ? t('family.editMember') || 'Edit Family Member'
                            : t('family.addMember') || 'Add Family Member'}
                    </h2>
                    <p className="text-xs text-on-surface-variant/75">
                        {t('family.formDesc') ||
                            'Use the most accurate birth time and location for reliable charts.'}
                    </p>
                </div>

                <Input
                    label="Name"
                    value={state.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="e.g. Mom"
                    required
                    error={errors.name}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                            Relationship<span className="text-secondary ml-1">*</span>
                        </label>
                        <select
                            value={state.relationshipType}
                            disabled={isEdit}
                            onChange={(e) => update('relationshipType', e.target.value as FamilyRelationshipType)}
                            className="w-full bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary disabled:opacity-50"
                        >
                            {RELATIONSHIP_TYPES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                        {isEdit && (
                            <p className="text-[10px] text-on-surface-variant/70 ml-1">
                                Relationship is fixed after creation.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                            Gender<span className="text-secondary ml-1">*</span>
                        </label>
                        <select
                            value={state.gender}
                            onChange={(e) => update('gender', e.target.value as FamilyGender)}
                            className="w-full bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary"
                        >
                            {GENDERS.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Date of Birth"
                        type="date"
                        icon={<Calendar className="w-4 h-4" />}
                        value={state.dob}
                        onChange={(e) => update('dob', e.target.value)}
                        required
                        error={errors.dob}
                    />
                    <Input
                        label="Time of Birth"
                        type="time"
                        icon={<Clock className="w-4 h-4" />}
                        value={state.tob}
                        onChange={(e) => update('tob', e.target.value)}
                        required
                        error={errors.tob}
                    />
                </div>

                <LocationSearch
                    label="Place of Birth"
                    placeholder="Search city, e.g. Delhi"
                    value={state.pob}
                    onSelect={(loc) => {
                        setSelectedLocation(loc);
                        setState((s) => ({
                            ...s,
                            pob: loc.name,
                            latitude: loc.lat,
                            longitude: loc.lon,
                            timezoneName: loc.timezone,
                        }));
                    }}
                    onChange={(txt) => {
                        if (selectedLocation && txt !== selectedLocation.name) {
                            setSelectedLocation(null);
                            setState((s) => ({
                                ...s,
                                pob: txt,
                                latitude: null,
                                longitude: null,
                                timezoneName: '',
                            }));
                        } else {
                            update('pob', txt);
                        }
                    }}
                    confirmedLocation={selectedLocation}
                    required
                    error={errors.pob}
                    helperText="Pick from the dropdown so we have exact coordinates."
                />

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                        Notes <span className="text-on-surface-variant/65 normal-case">(optional)</span>
                    </label>
                    <textarea
                        value={state.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        rows={2}
                        placeholder="Anything you want to remember about them…"
                        className="w-full bg-surface border border-outline-variant/30 hover:border-secondary/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-all rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 text-sm text-primary placeholder:text-primary/40 resize-none"
                    />
                </div>

                {familyAvatars && familyAvatars.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                            Profile Icon
                        </label>
                        <div className="flex flex-wrap gap-3 p-3 rounded-[24px] border border-outline-variant/30 bg-surface-variant/10">
                            {familyAvatars.map((av) => {
                                const isSelected = state.avatarKey === av.key;
                                return (
                                    <button
                                        key={av.key}
                                        type="button"
                                        onClick={() => update('avatarKey', av.key)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                            isSelected
                                                ? 'scale-110 shadow-md border-opacity-100'
                                                : 'opacity-65 hover:opacity-100 hover:scale-105 border-transparent'
                                        }`}
                                        style={{
                                            color: av.accentColor || 'var(--secondary)',
                                            borderColor: isSelected 
                                                ? av.accentColor || 'var(--secondary)' 
                                                : 'transparent',
                                            backgroundColor: isSelected
                                                ? `${av.accentColor || 'var(--secondary)'}22`
                                                : `${av.accentColor || 'var(--secondary)'}08`
                                        }}
                                        title={av.label}
                                    >
                                        {React.createElement(getFamilyIcon(av.iconKey), { className: 'w-5 h-5' })}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!isEdit && (
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-outline-variant/30 hover:border-secondary/30 transition-colors">
                        <input
                            type="checkbox"
                            checked={state.consentAcknowledged}
                            onChange={(e) => update('consentAcknowledged', e.target.checked)}
                            className="mt-1 accent-secondary"
                        />
                        <span className="text-xs text-on-surface-variant/80 leading-relaxed">
                            I confirm that this person is 18 years of age or older and that I have obtained their explicit permission to store and process their birth details on Astra Navi for Vedic astrological chart generation, compatibility analysis, and AI-powered readings. Their data will be protected under India&apos;s{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-bold">
                                DPDP Act, 2023
                            </a>
                            {' '}and will not be shared without their consent.
                            {errors.consent && (
                                <span className="block mt-1 text-red-500 font-bold">{errors.consent}</span>
                            )}
                        </span>
                    </label>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSaving}>
                        {isEdit ? 'Save Changes' : 'Add Member'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

/* ====================================================================== */
/* DETAIL — chart + compatibility                                         */
/* ====================================================================== */

function FamilyMemberDetail({ member, onEdit, onBack }: { member: FamilyMember; onEdit: () => void; onBack: () => void }) {
    const { t } = useTranslation();
    const { data: chart, isLoading: chartLoading, error: chartError } = useFamilyChart(member);
    const chartRef = useRef<HTMLDivElement | null>(null);

    return (
        <div className="space-y-6">
            {/* Header — Back + Edit (the old CompatibilityReport used to host these). */}
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors"
                >
                    <ArrowUpRight className="w-3.5 h-3.5 rotate-[-135deg]" />
                    {t('family.backToList') || 'Back'}
                </button>
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/5 px-2.5 py-1.5 text-xs font-bold text-secondary hover:bg-secondary/10 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    {t('family.editMember') || 'Edit'}
                </button>
            </div>

            {/* ─────────────── Daily Bond Dashboard ─────────────── */}
            <BondDashboardBody member={member} />

            {/* ─────────────── Chart ─────────────── */}
            <div ref={chartRef} className="scroll-mt-24">
                <Card variant="default" padding="lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4 text-secondary" />
                        <h3 className="text-sm font-headline font-bold text-primary">
                            {t('family.chartTitle') || 'Birth Chart'}
                        </h3>
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                            {t('family.chartFreeBadge') || 'Free Snapshot'}
                        </span>
                    </div>
                    {chartLoading && (
                        <div className="text-secondary/60 text-sm flex items-center gap-2">
                            <Star className="w-4 h-4 animate-pulse" /> Loading chart…
                        </div>
                    )}
                    {chartError && (
                        <div className="text-sm text-red-500 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" /> {chartError}
                        </div>
                    )}
                    {chart && !chartLoading && !chartError && (
                        <FamilyChartView chart={chart.chart} />
                    )}
                </Card>
            </div>
        </div>
    );
}

/* ====================================================================== */
/* INVITE FORM (inline on /family)                                        */
/* ====================================================================== */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FamilyInviteForm({ onCancel, onSent }: { onCancel: () => void; onSent: () => void }) {
    const { t } = useTranslation();
    const { error: toastError } = useToast();

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [isSending, setIsSending] = useState(false);
    /** Set when the backend rejects a re-invite with DECLINE_COOLDOWN_ACTIVE. */
    const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
    const cooldown = useCountdown(cooldownUntil);

    const emailValid = EMAIL_REGEX.test(email.trim());
    const emailError = emailTouched && !emailValid ? (t('family.inviteEmailInvalid') || 'Enter a valid email') : undefined;
    const blockedByCooldown = !!cooldownUntil && !cooldown.expired;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailTouched(true);
        if (!emailValid || isSending || blockedByCooldown) return;
        setIsSending(true);
        const res = await sendInvite({
            email: email.trim(),
            ...(message.trim() ? { message: message.trim() } : {}),
        });
        setIsSending(false);
        if (res.ok) {
            setCooldownUntil(null);
            onSent();
            return;
        }
        const retryAfter = cooldownRetryAfter(res.raw);
        if (retryAfter) setCooldownUntil(retryAfter);
        toastError(parseInviteErrorByStatus(res.status, res.raw, t));
    };

    return (
        <Card variant="default" padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <h2 className="text-lg font-headline font-bold text-primary mb-1">
                        {t('family.inviteByEmail') || 'Invite by Email'}
                    </h2>
                    <p className="text-xs text-on-surface-variant/75">
                        {t('family.inviteFormDesc') ||
                            "Send a link to someone with an AstraNavi account. They'll see the invite next time they sign in."}
                    </p>
                </div>

                <Input
                    label={t('family.inviteEmailLabel') || 'Email'}
                    type="email"
                    icon={<Mail className="w-4 h-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder={t('family.inviteEmailPlaceholder') || 'name@example.com'}
                    required
                    error={emailError}
                />

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 block">
                        {t('family.inviteMessageLabel') || 'Add a note (optional)'}
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="Hey, let's stay connected on AstraNavi…"
                        className="w-full bg-surface border border-outline-variant/30 hover:border-secondary/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-all rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 text-sm text-primary placeholder:text-primary/40 resize-none"
                    />
                </div>

                <p className="text-[11px] text-on-surface-variant/55 ml-1">
                    {t('family.invitePlainHint') || 'You can mark them as family later, once you connect.'}
                </p>

                {blockedByCooldown && (
                    <div className="flex items-center gap-2 text-[12px] text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-2xl px-3 py-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {(t('family.inviteCooldownRetry') || 'Try again in {time}').replace('{time}', cooldown.label)}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSending}>
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSending}
                        leftIcon={<Send className="w-4 h-4" />}
                        disabled={!emailValid || blockedByCooldown}
                    >
                        {isSending
                            ? (t('family.inviteSending') || 'Sending…')
                            : (t('family.inviteSend') || 'Send invite')}
                    </Button>
                </div>
            </form>
        </Card>
    );
}

/* ====================================================================== */
/* CONNECTION DETAIL — sharing toggle, notes, avatar, disconnect           */
/* ====================================================================== */

function FamilyConnectionDetail({
    connection,
    onUpdated,
    onDisconnected,
    onBack,
}: {
    connection: FamilyConnection;
    onUpdated: (c: FamilyConnection) => void;
    onDisconnected: () => void;
    onBack: () => void;
}) {
    const { t } = useTranslation();
    const { success, error: toastError } = useToast();
    const { data: avatars } = useFamilyAvatars();

    const [notes, setNotes] = useState(connection.myNotes ?? '');
    const [savingNotes, setSavingNotes] = useState(false);
    const [togglingShare, setTogglingShare] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const accent = connection.avatar?.accentColor || 'var(--secondary)';
    /* Become-family flow (pick a label + enable sharing) and its cap dialog. */
    const [makeFamilyOpen, setMakeFamilyOpen] = useState(false);
    const [capDialog, setCapDialog] = useState<FamilyCapDetail | null>(null);

    const persist = async (payload: Parameters<typeof updateConnection>[1]) => {
        const res = await updateConnection(connection.connectionId, payload);
        if (!res.ok || !res.data) {
            const cap = familyCapDetail(res.raw);
            const peerCap = familyPeerTierCapDetail(res.raw);
            if (cap) { setCapDialog(cap); return false; }
            if (peerCap) {
                // Peer cap isn't an upgrade signal for this user; keep the toggle off.
                toastError(peerCap.message || "They can't be added as family right now — their list is full.");
                return false;
            }
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
            return false;
        }
        onUpdated(res.data);
        return true;
    };

    const toggleShare = async () => {
        // Enabling sharing for the first time needs a relationship label — open the
        // become-family flow so the user picks one (and we can offer a merge).
        if (!connection.sharingWithThem && !connection.iSeeThemAs) {
            setMakeFamilyOpen(true);
            return;
        }
        setTogglingShare(true);
        const ok = await persist({ sharingWithThem: !connection.sharingWithThem });
        setTogglingShare(false);
        if (ok) {
            success(!connection.sharingWithThem
                ? (t('family.connectionSharingOn') || 'Sharing on')
                : (t('family.connectionSharingOff') || 'Sharing off'));
        }
    };

    const saveNotes = async () => {
        setSavingNotes(true);
        const ok = await persist({ notes });
        setSavingNotes(false);
        if (ok) success(t('common.saved') || 'Saved');
    };

    const selectAvatar = async (key: string) => {
        if (savingAvatar || key === (connection.myAvatarKey ?? '')) return;
        setSavingAvatar(true);
        await persist({ avatarKey: key });
        setSavingAvatar(false);
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        const res = await deleteConnection(connection.connectionId);
        setIsDisconnecting(false);
        setConfirmDisconnect(false);
        if (!res.ok) {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
            return;
        }
        onDisconnected();
    };

    const notesDirty = (notes ?? '') !== (connection.myNotes ?? '');

    return (
        <div className="space-y-6">
            {/* Header — Back (the old CompatibilityReport used to host this). */}
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary transition-colors"
            >
                <ArrowUpRight className="w-3.5 h-3.5 rotate-[-135deg]" />
                {t('family.backToList') || 'Back'}
            </button>

            {/* ─────────────── Daily Bond Dashboard ─────────────── */}
            <BondDashboardBody member={memberFromConnection(connection)} />

            {/* Header card */}
            <Card variant="default" padding="lg">
                <div className="flex items-start gap-4">
                    {connection.avatar ? (
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
                            style={{
                                color: accent,
                                borderColor: `${accent}33`,
                                backgroundColor: `${accent}11`,
                            }}
                        >
                            {React.createElement(getFamilyIcon(connection.avatar.iconKey), { className: 'w-6 h-6' })}
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-lg font-bold shrink-0">
                            {connection.otherName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-headline font-bold text-primary">{connection.otherName}</h2>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                connection.isFamily
                                    ? 'bg-secondary/10 text-secondary border-secondary/30'
                                    : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                            }`}>
                                <Link2 className="w-3 h-3" />
                                {connection.isFamily
                                    ? (t('family.connectionKindFamily') || 'Family')
                                    : (t('family.connectionStatusConnected') || 'Connected')}
                            </span>
                        </div>
                        {connection.iSeeThemAs && (
                            <p className="text-[11px] uppercase tracking-wider text-secondary/80 font-bold mt-0.5">
                                {connection.iSeeThemAs}
                            </p>
                        )}
                        <div className="mt-3 space-y-1 text-[12px] text-on-surface-variant/70">
                            <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 opacity-50 shrink-0" />
                                <span className="truncate">{connection.otherEmail}</span>
                            </div>
                            {(connection.iSeeThemAs || connection.theySeeMeAs) && (
                                <p className="text-[11px] text-on-surface-variant/75">
                                    {connection.iSeeThemAs && (t('family.connectionISeeThemAs') || 'You see them as {label}').replace('{label}', connection.iSeeThemAs)}
                                    {connection.iSeeThemAs && connection.theySeeMeAs && ' · '}
                                    {connection.theySeeMeAs && (t('family.connectionTheySeeMeAs') || 'They see you as {label}').replace('{label}', connection.theySeeMeAs)}
                                </p>
                            )}
                        </div>
                        {!connection.disconnected && (
                            <div className="mt-3">
                                <OpenMessageButton connectionId={connection.connectionId} variant="secondary" />
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Sharing controls */}
            <Card variant="default" padding="lg">
                <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-secondary" />
                    <h3 className="text-sm font-headline font-bold text-primary">
                        {t('family.sharingTitle') || 'Sharing'}
                    </h3>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-outline-variant/20 bg-surface">
                        <div className="min-w-0">
                            <p className="text-[12px] font-bold text-primary">
                                {t('family.connectionSharingWith') || "I'm sharing with them"}
                            </p>
                            <p className="text-[11px] text-on-surface-variant/75 mt-0.5">
                                {connection.sharingWithThem
                                    ? (t('family.connectionSharingOn') || 'Sharing on')
                                    : (t('family.connectionSharingOff') || 'Sharing off')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleShare}
                            disabled={togglingShare}
                            aria-pressed={connection.sharingWithThem}
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${
                                connection.sharingWithThem
                                    ? 'bg-emerald-500/60 border-emerald-400'
                                    : 'bg-outline-variant/30 border-outline-variant/40'
                            } ${togglingShare ? 'opacity-60' : ''}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                    connection.sharingWithThem ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-outline-variant/15 bg-surface-variant/30">
                        <div className="min-w-0">
                            <p className="text-[12px] font-bold text-primary">
                                {t('family.connectionTheyShareWithMe') || "They're sharing with me"}
                            </p>
                            <p className="text-[11px] text-on-surface-variant/75 mt-0.5">
                                {connection.theyShareWithMe
                                    ? (t('family.connectionSharingOn') || 'Sharing on')
                                    : (t('family.connectionSharingOff') || 'Sharing off')}
                            </p>
                        </div>
                        <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                                connection.theyShareWithMe
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-outline-variant/15 text-on-surface-variant/70 border-outline-variant/30'
                            }`}
                        >
                            {connection.theyShareWithMe ? 'Yes' : 'Waiting'}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Avatar picker */}
            {avatars && avatars.length > 0 && (
                <Card variant="default" padding="lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-secondary" />
                        <h3 className="text-sm font-headline font-bold text-primary">
                            {t('family.avatarTitle') || 'Profile Icon'}
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-3 p-3 rounded-[24px] border border-outline-variant/30 bg-surface-variant/10">
                        {avatars.map((av) => {
                            const isSelected = (connection.myAvatarKey ?? '') === av.key;
                            return (
                                <button
                                    key={av.key}
                                    type="button"
                                    disabled={savingAvatar}
                                    onClick={() => selectAvatar(av.key)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                        isSelected
                                            ? 'scale-110 shadow-md border-opacity-100'
                                            : 'opacity-65 hover:opacity-100 hover:scale-105 border-transparent'
                                    } ${savingAvatar ? 'opacity-40 cursor-wait' : ''}`}
                                    style={{
                                        color: av.accentColor || 'var(--secondary)',
                                        borderColor: isSelected ? av.accentColor || 'var(--secondary)' : 'transparent',
                                        backgroundColor: isSelected
                                            ? `${av.accentColor || 'var(--secondary)'}22`
                                            : `${av.accentColor || 'var(--secondary)'}08`,
                                    }}
                                    title={av.label}
                                >
                                    {React.createElement(getFamilyIcon(av.iconKey), { className: 'w-5 h-5' })}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Notes */}
            <Card variant="default" padding="lg">
                <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-secondary" />
                    <h3 className="text-sm font-headline font-bold text-primary">
                        {t('family.notesTitle') || 'My Notes'}
                    </h3>
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Private — only you will see this."
                    className="w-full bg-surface border border-outline-variant/30 hover:border-secondary/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-all rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 text-sm text-primary placeholder:text-primary/40 resize-none"
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={saveNotes}
                        loading={savingNotes}
                        disabled={!notesDirty || savingNotes}
                    >
                        {t('common.save') || 'Save'}
                    </Button>
                </div>
            </Card>

            {/* Disconnect */}
            <Card variant="bordered" padding="md" className="border-red-500/30">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-red-400">
                            {t('family.connectionDisconnect') || 'Disconnect'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant/75 mt-0.5">
                            {t('family.connectionDisconnectBody') ||
                                "You'll lose linked compatibility access and the connection will be removed from both sides."}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDisconnect(true)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-red-400 hover:text-red-500 shrink-0"
                    >
                        {t('family.connectionDisconnect') || 'Disconnect'}
                    </Button>
                </div>
            </Card>

            <ConfirmDialog
                isOpen={confirmDisconnect}
                onClose={() => setConfirmDisconnect(false)}
                onConfirm={handleDisconnect}
                title={(t('family.connectionDisconnectTitle') || 'Disconnect from {name}?').replace('{name}', connection.otherName)}
                message={t('family.connectionDisconnectBody') ||
                    "You'll lose linked compatibility access and the connection will be removed from both sides."}
                confirmText={t('family.connectionDisconnectConfirm') || 'Disconnect'}
                cancelText={t('common.cancel') || 'Cancel'}
                variant="danger"
                isLoading={isDisconnecting}
            />

            {makeFamilyOpen && (
                <MakeFamilyDialog
                    open={true}
                    connection={connection}
                    onClose={() => setMakeFamilyOpen(false)}
                    onUpdated={(updated) => {
                        onUpdated(updated);
                    }}
                    onFreeTierCap={(detail) => setCapDialog(detail)}
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
}

