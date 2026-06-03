'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Users, Plus, Pencil, Trash2, Heart, BookOpen, Coins,
    Calendar, Clock, MapPin, ChevronRight, Star, AlertCircle, X,
    Crown, TrendingUp, AlertTriangle, MessageCircle, Shield, ArrowRight,
    ChevronDown, ChevronUp, HandHeart, Sparkles, Compass, FileText,
    Sun, Moon, Flower, Activity, Mail, Send, Link2, Settings, RefreshCw,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationSearch, { LocationResult } from '@/components/ui/LocationSearch';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTranslation, useToast, usePaywallContext } from '@/hooks';
import {
    useFamilyMembers,
    useFamilyChart,
    useFamilyCompatibility,
    createFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    useFamilyAvatars,
    useFamilyCompatibilityPreflight,
    useFamilyConnectionCompatibilityPreflight,
    useFamilyReports,
    useFamilyConnections,
    useFamilyConnectionCompatibility,
    sendInvite,
    updateConnection,
    deleteConnection,
} from '@/hooks/useFamily';
import {
    type FamilyMember,
    type FamilyConnection,
    type FamilyRelationshipType,
    type FamilyGender,
    type CompatibilityLang,
    type FamilyCompatibilityPreflight,
    COMPATIBILITY_CREDIT_COST,
    FAMILY_FREE_TIER_LIMIT,
} from '@/types/family';
import { parseInviteErrorByStatus } from '@/lib/familyInviteErrors';
import { tzOffsetHoursAt } from '@/lib/tzOffset';
import { bandPalette } from '@/lib/familyStatus';
import FamilyChartView from '@/components/family/FamilyChartView';

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

const LANGS: { value: CompatibilityLang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'ko', label: '한국어' },
];

/**
 * Returns the *actual* script of the response when it doesn't match the
 * requested language (e.g. user asked for "hi" but the backend returned
 * Latin-script English). Returns null when the response matches expectation.
 */
function detectLanguageMismatch(
    requested: CompatibilityLang,
    data: { verdict?: string; lang?: string } | null | undefined
): CompatibilityLang | null {
    if (!data) return null;
    const text = `${data.verdict ?? ''}`.slice(0, 400);
    if (!text.trim()) return null;
    const hasDevanagari = /[ऀ-ॿ]/.test(text);
    const hasHangul = /[가-힯]/.test(text);
    const hasLatin = /[A-Za-z]/.test(text);

    let actual: CompatibilityLang | null = null;
    if (hasDevanagari) actual = 'hi';
    else if (hasHangul) actual = 'ko';
    else if (hasLatin) actual = 'en';

    if (!actual || actual === requested) return null;
    return actual;
}

/** Format an ISO date string safely. Returns null when the value is missing or unparseable. */
function formatReportDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDob(value: string | null | undefined): string {
    if (!value) return '—';
    // Backend yields YYYY-MM-DD. Parse as local date (avoid timezone shifts from `new Date('YYYY-MM-DD')` which is treated as UTC).
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    const [, y, m, day] = match;
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTob(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return value;
    const h24 = Number(match[1]);
    const min = match[2];
    if (Number.isNaN(h24)) return value;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2, '0')}:${min} ${period}`;
}

/** Derive which side is blocking a connection's compatibility purely from the
 *  client-side connection record. Used for instant feedback before the backend
 *  responds; backend response is authoritative when available. */
function deriveLocalBlockedBy(c: FamilyConnection): 'you' | 'them' | 'both' | null {
    if (!c.sharingWithThem && !c.theyShareWithMe) return 'both';
    if (!c.sharingWithThem) return 'you';
    if (!c.theyShareWithMe) return 'them';
    return null;
}

/* ====================================================================== */
/* MAIN CLIENT                                                            */
/* ====================================================================== */

export default function FamilyClient() {
    const { t } = useTranslation();
    const { tier } = usePaywallContext();
    const { success, error: toastError, info } = useToast();
    const { data: members, isLoading, error, refetch } = useFamilyMembers();
    const { data: connections, refetch: refetchConnections } = useFamilyConnections();

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
    const autoOpenedRef = useRef(false);

    useEffect(() => {
        if (autoOpenedRef.current) return;
        if (!memberIdParam || !members) return;
        const found = members.find(m => String(m.id) === memberIdParam);
        if (found) {
            setDetailMember(found);
            setView('detail');
            autoOpenedRef.current = true;
        }
    }, [memberIdParam, members]);

    const isFreeTier = !tier || tier === 'free';
    const manualCount = members?.length ?? 0;
    const linkedCount = connections?.length ?? 0;
    const totalCount = manualCount + linkedCount;
    const atFreeCap = isFreeTier && totalCount >= FAMILY_FREE_TIER_LIMIT;

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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">
                                {t('family.myFamily') || 'My Family'}
                            </h1>
                            <p className="text-xs sm:text-sm text-on-surface-variant/70 mt-0.5">
                                {t('family.subtitle') ||
                                    'Save birth details, view charts, and check compatibility with loved ones.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {view !== 'list' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={backToList}
                                    leftIcon={<X className="w-4 h-4" />}
                                >
                                    {t('common.back') || 'Back'}
                                </Button>
                            )}
                            {(view === 'list' || view === 'detail' || view === 'connectionDetail') && (
                                <>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={openAdd}
                                        leftIcon={<Plus className="w-4 h-4" />}
                                        disabled={atFreeCap}
                                    >
                                        {t('family.addFamilyMember') || 'Add Family Member'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={openInvite}
                                        leftIcon={<Mail className="w-4 h-4" />}
                                        disabled={atFreeCap}
                                    >
                                        {t('family.inviteByEmail') || 'Invite by Email'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Free-tier counter */}
                    {isFreeTier && view === 'list' && (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant/70">
                            <Crown className="w-3.5 h-3.5 text-secondary/70" />
                            <span>
                                {totalCount} / {FAMILY_FREE_TIER_LIMIT} {t('family.freeTierUsed') || 'members used on Free tier'}
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
                        onFreeTierCap={() => {
                            info(t('family.freeTierCapMessage') || `Free plan supports up to ${FAMILY_FREE_TIER_LIMIT} members. Upgrade to add more.`);
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
                    <FamilyMemberDetail member={detailMember} onEdit={() => openEdit(detailMember)} />
                )}

                {view === 'connectionDetail' && detailConnection && (
                    <FamilyConnectionDetail
                        connection={detailConnection}
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
        </div>
    );
}

/* ====================================================================== */
/* LIST                                                                   */
/* ====================================================================== */

interface FamilyListProps {
    members: FamilyMember[] | null;
    connections: FamilyConnection[] | null;
    isLoading: boolean;
    error: string | null;
    onOpen: (m: FamilyMember) => void;
    onOpenConnection: (c: FamilyConnection) => void;
    onEdit: (m: FamilyMember) => void;
    onDelete: (m: FamilyMember) => void;
    onAdd: () => void;
    atFreeCap: boolean;
}

function FamilyList({ members, connections, isLoading, error, onOpen, onOpenConnection, onEdit, onDelete, onAdd, atFreeCap }: FamilyListProps) {
    const { t } = useTranslation();

    const hasMembers = !!members && members.length > 0;
    const hasConnections = !!connections && connections.length > 0;
    const isEmpty = !hasMembers && !hasConnections;

    if (isLoading && !members) {
        return (
            <Card variant="default" padding="lg">
                <div className="flex items-center justify-center text-secondary/60">
                    <Star className="w-5 h-5 animate-pulse" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card variant="bordered" padding="md" className="border-red-500/30">
                <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            </Card>
        );
    }

    if (isEmpty) {
        return (
            <Card variant="default" padding="lg">
                <div className="text-center py-8">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-secondary/10 items-center justify-center text-secondary mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-headline font-bold text-primary mb-2">
                        {t('family.empty') || 'No family members yet'}
                    </h3>
                    <p className="text-sm text-on-surface-variant/75 mb-5 max-w-md mx-auto">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(members ?? []).map((m) => (
                <Card key={`m-${m.id}`} variant="default" padding="md" hoverable>
                    <div className="flex items-start gap-3">
                        {m.avatar ? (
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                                style={{
                                    color: m.avatar.accentColor || 'var(--secondary)',
                                    borderColor: `${m.avatar.accentColor || 'var(--secondary)'}33`,
                                    backgroundColor: `${m.avatar.accentColor || 'var(--secondary)'}11`
                                }}
                            >
                                {React.createElement(getFamilyIcon(m.avatar.iconKey), { className: 'w-5 h-5' })}
                            </div>
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-sm font-bold shrink-0">
                                {m.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-headline font-bold text-primary truncate">{m.name}</h3>
                            <p className="text-[11px] uppercase tracking-wider text-secondary/80 font-bold mt-0.5">
                                {m.relationshipType}
                            </p>
                            <div className="mt-3 space-y-1 text-[12px] text-on-surface-variant/70">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 opacity-50" /> {m.dob}
                                </div>
                                {m.tob && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 opacity-50" /> {m.tob}
                                    </div>
                                )}
                                {m.pob && (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <MapPin className="w-3 h-3 opacity-50 shrink-0" />
                                        <span className="truncate">{m.pob}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 mt-4">
                                <Button variant="primary" size="sm" onClick={() => onOpen(m)} rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                                    Open
                                </Button>
                                <button
                                    onClick={() => onEdit(m)}
                                    className="p-2 rounded-xl text-on-surface-variant/75 hover:text-secondary hover:bg-secondary/5 transition-colors"
                                    aria-label="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(m)}
                                    className="p-2 rounded-xl text-on-surface-variant/75 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                                    aria-label="Remove"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            {(connections ?? []).map((c) => (
                <ConnectionCard key={`c-${c.connectionId}`} connection={c} onManage={() => onOpenConnection(c)} />
            ))}
        </div>
    );
}

function ConnectionCard({ connection: c, onManage }: { connection: FamilyConnection; onManage: () => void }) {
    const { t } = useTranslation();
    const accent = c.avatar?.accentColor || 'var(--secondary)';
    return (
        <Card variant="default" padding="md" hoverable>
            <div className="flex items-start gap-3">
                {c.avatar ? (
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                            color: accent,
                            borderColor: `${accent}33`,
                            backgroundColor: `${accent}11`,
                        }}
                    >
                        {React.createElement(getFamilyIcon(c.avatar.iconKey), { className: 'w-5 h-5' })}
                    </div>
                ) : (
                    <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-sm font-bold shrink-0">
                        {c.otherName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-headline font-bold text-primary truncate">{c.otherName}</h3>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/30">
                            <Link2 className="w-2.5 h-2.5" />
                            {t('family.linkedBadge') || 'Linked'}
                        </span>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-secondary/80 font-bold mt-0.5">
                        {c.iSeeThemAs}
                    </p>
                    <div className="mt-3 space-y-1 text-[12px] text-on-surface-variant/70">
                        <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 opacity-50 shrink-0" />
                            <span className="truncate">{c.otherEmail}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Heart className={`w-3 h-3 ${c.sharingWithThem ? 'text-emerald-400' : 'opacity-40'}`} />
                            <span className={c.sharingWithThem ? 'text-emerald-400' : 'text-on-surface-variant/70'}>
                                {c.sharingWithThem
                                    ? (t('family.connectionSharingOn') || 'Sharing on')
                                    : (t('family.connectionSharingOff') || 'Sharing off')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4">
                        <Button variant="primary" size="sm" onClick={onManage} rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                            {t('family.manage') || 'Manage'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}

/* ====================================================================== */
/* FORM (create + edit)                                                   */
/* ====================================================================== */

interface FormProps {
    editing: FamilyMember | null;
    onSaved: (m: FamilyMember, isNew: boolean) => void;
    onCancel: () => void;
    onFreeTierCap: () => void;
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
                name: editing.pob,
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
                if (res.status === 402 && res.raw?.code === 'FAMILY_FREE_TIER_CAP') {
                    onFreeTierCap();
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
                            I confirm that I have obtained explicit permission from this person to store and process their birth details on Astra Navi for Vedic astrological chart generation, compatibility analysis, and AI-powered readings. Their data will be protected under India&apos;s{' '}
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

function FamilyMemberDetail({ member, onEdit }: { member: FamilyMember; onEdit: () => void }) {
    const { t } = useTranslation();
    const { totalCredits } = usePaywallContext();
    const { success, error: toastError, info, warning } = useToast();
    const { data: chart, isLoading: chartLoading, error: chartError } = useFamilyChart(member.id);
    const { data: compat, isLoading: compatLoading, fetchCompatibility } = useFamilyCompatibility(member.id);

    const [lang, setLang] = useState<CompatibilityLang>('en');
    const [confirmingPurchase, setConfirmingPurchase] = useState(false);
    const { data: reports } = useFamilyReports(member.id);
    const { fetchPreflight } = useFamilyCompatibilityPreflight(member.id);
    const [preflightData, setPreflightData] = useState<FamilyCompatibilityPreflight | null>(null);
    const compatRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);
    const reportsRef = useRef<HTMLDivElement | null>(null);

    const creditCost = COMPATIBILITY_CREDIT_COST[member.relationshipType] ?? 5;

    // Once compat lands (cached or fresh), refresh preflight in the background so
    // we know whether the cached result is stale and whether a refresh CTA applies.
    useEffect(() => {
        if (!compat) return;
        let cancelled = false;
        fetchPreflight().then((pf) => {
            if (!cancelled) setPreflightData(pf);
        });
        return () => { cancelled = true; };
    }, [compat, fetchPreflight]);

    const scrollTo = (el: HTMLElement | null) => {
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const scrollToCompat = () => scrollTo(compatRef.current);
    const scrollToChart = () => scrollTo(chartRef.current);
    const scrollToReports = () => scrollTo(reportsRef.current);

    const alreadyPaidForLang = useMemo(
        () => compat?.lang === lang && compat?.member_id === member.id,
        [compat, lang, member.id]
    );

    const runCompatibility = async () => {
        setConfirmingPurchase(false);
        const res = await fetchCompatibility(lang);
        if (res.ok) {
            const data = res.data;
            const mismatch = detectLanguageMismatch(lang, data);
            if (data?.cached) {
                if (mismatch) {
                    warning(
                        `Showing the previously generated ${mismatch.toUpperCase()} analysis — a ${lang.toUpperCase()} translation isn't available yet.`
                    );
                } else {
                    info(`Showing cached ${lang.toUpperCase()} result — no credits charged.`);
                }
            } else {
                if (mismatch) {
                    warning(
                        `Charged ${creditCost} credits, but the response came back in ${mismatch.toUpperCase()} instead of ${lang.toUpperCase()}.`
                    );
                } else {
                    success(`${creditCost} credits used for compatibility analysis.`);
                }
            }
            return;
        }
        // Error cases
        if (res.status === 400 && res.missingBirthFields && res.missingBirthFields.length > 0) {
            const fieldLabels: Record<string, string> = {
                dob: 'date of birth',
                tob: 'time of birth',
                pob: 'place of birth',
                latitude: 'birth coordinates',
                longitude: 'birth coordinates',
                timezone_offset: 'timezone',
                timezoneOffset: 'timezone',
            };
            const missing = Array.from(new Set(res.missingBirthFields.map((f) => fieldLabels[f] ?? f)));
            toastError(
                `Complete your profile first — missing ${missing.join(', ')}. Open Profile to add them.`
            );
            return;
        }
        if (res.status === 400) {
            toastError(
                res.error ||
                    'Your profile is missing birth date, time, coordinates, or timezone. Update your profile to enable compatibility.'
            );
            return;
        }
        if (res.status === 409 && res.stillComputing) {
            info('Still computing your compatibility — please try again in a few seconds.');
            return;
        }
        if (res.status === 402) {
            toastError(`Insufficient credits. You need ${creditCost} credits to run this analysis.`);
            return;
        }
        toastError(res.error || 'Compatibility request failed.');
    };

    const startCompatibility = async () => {
        if (alreadyPaidForLang) {
            // No-op — already shown
            return;
        }
        const preflight = await fetchPreflight();
        if (preflight) {
            if (preflight.cachedResultAvailable) {
                // Free/cached available! Skip warning and run directly!
                await runCompatibility();
            } else {
                setPreflightData(preflight);
                setConfirmingPurchase(true);
            }
        } else {
            setPreflightData(null);
            setConfirmingPurchase(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact profile card */}
            <Card variant="default" padding="lg">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {member.avatar ? (
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
                            style={{
                                color: member.avatar.accentColor || 'var(--secondary)',
                                borderColor: `${member.avatar.accentColor || 'var(--secondary)'}33`,
                                backgroundColor: `${member.avatar.accentColor || 'var(--secondary)'}11`
                            }}
                        >
                            {React.createElement(getFamilyIcon(member.avatar.iconKey), { className: 'w-6 h-6' })}
                        </div>
                    ) : (
                        <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-lg font-bold shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div className="min-w-0">
                        <h2 className="text-xl font-headline font-bold text-primary">{member.name}</h2>
                        <p className="text-[11px] uppercase tracking-wider text-secondary/80 font-bold mt-0.5">
                            {member.relationshipType} · {member.gender}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-on-surface-variant/85 md:ml-2 md:pl-4 md:border-l md:border-outline-variant/20">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-secondary/70" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/70 font-bold">DOB</span>
                                <span className="font-bold text-primary">{formatDob(member.dob)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-secondary/70" />
                            <div className="flex flex-col leading-tight">
                                <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/70 font-bold">Time</span>
                                <span className="font-bold text-primary">{formatTob(member.tob)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-secondary/70 shrink-0" />
                            <div className="flex flex-col leading-tight min-w-0">
                                <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/70 font-bold">Place</span>
                                <span className="font-bold text-primary truncate max-w-[180px]">{member.pob}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 md:ml-auto md:w-64 md:shrink-0">
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<Pencil className="w-3.5 h-3.5" />} fullWidth>
                                Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={scrollToChart} leftIcon={<BookOpen className="w-3.5 h-3.5" />} fullWidth>
                                View Chart
                            </Button>
                        </div>
                        <Button variant="primary" size="sm" onClick={scrollToCompat} leftIcon={<Heart className="w-3.5 h-3.5" />} fullWidth>
                            {compat ? 'View Compatibility' : 'Compare Compatibility'}
                        </Button>
                    </div>
                </div>
                {member.notes && (
                    <p className="mt-4 pt-4 border-t border-outline-variant/15 text-[12px] text-on-surface-variant/80 italic">
                        &ldquo;{member.notes}&rdquo;
                    </p>
                )}
            </Card>

            {/* ─────────────── Compatibility hero ─────────────── */}
            <div ref={compatRef} className="scroll-mt-24">
            {compat ? (
                <Card variant="default" padding="lg">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex justify-center lg:justify-start lg:shrink-0">
                            <ScoreRing score={compat.score} band={compat.band} size={200} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant/75 font-bold">
                                {t('family.compatibilityWith') || 'Compatibility with'}
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-headline font-bold text-secondary leading-tight">
                                {member.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`text-lg font-headline font-bold ${bandPalette(compat.band).text}`}>
                                    {compat.band}
                                </span>
                                {compat.confidence && (
                                    <>
                                        <span className="text-on-surface-variant/65">|</span>
                                        <span
                                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${confidencePalette(compat.confidence.level).bg} ${confidencePalette(compat.confidence.level).text} ${confidencePalette(compat.confidence.level).border}`}
                                        >
                                            <Shield className="w-3 h-3" />
                                            {compat.confidence.label}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="mt-3 text-sm text-on-surface-variant/85 leading-relaxed whitespace-pre-line">
                                {compat.verdict}
                            </p>
                            {compat.confidence?.note && (
                                <p className="mt-2 text-[11px] text-on-surface-variant/70 italic leading-relaxed border-l-2 border-outline-variant/30 pl-3">
                                    {compat.confidence.note}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 lg:w-56 shrink-0">
                            <div className="flex items-center gap-1.5 flex-wrap lg:justify-end">
                                {compat.cached && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                                        Cached
                                    </span>
                                )}
                                {alreadyPaidForLang && !compat.cached && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                                        Free re-run
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary/85 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5">
                                    <Coins className="w-3 h-3" /> {creditCost} credits
                                </span>
                            </div>
                            {preflightData?.staleDataWarning && preflightData?.refresh?.available && (
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
                                    <p className="text-[11px] text-amber-300 leading-snug mb-2">
                                        {t('family.compatibilityStaleHint') ||
                                            'Birth details changed since this reading. Refresh for an updated analysis.'}
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={runCompatibility}
                                        loading={compatLoading}
                                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                                        fullWidth
                                    >
                                        {(t('family.compatibilityRefreshCta') || 'Refresh for {n} credits')
                                            .replace('{n}', String(preflightData.refresh.creditCost ?? creditCost))}
                                    </Button>
                                </div>
                            )}
                            <Button
                                variant="primary"
                                onClick={scrollToReports}
                                leftIcon={<FileText className="w-4 h-4" />}
                            >
                                View Full Report
                            </Button>
                            <Link href="/chat" className="block">
                                <Button
                                    variant="secondary"
                                    leftIcon={<MessageCircle className="w-4 h-4" />}
                                    fullWidth
                                >
                                    Ask Navi
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {compat.relationship_actions && (
                        <div className="mt-6 pt-6 border-t border-outline-variant/15 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Today', text: compat.relationship_actions.today, icon: <Sun className="w-3.5 h-3.5" />, accent: 'text-emerald-400' },
                                { label: 'This Week', text: compat.relationship_actions.this_week, icon: <Calendar className="w-3.5 h-3.5" />, accent: 'text-sky-400' },
                                { label: 'Long Term', text: compat.relationship_actions.long_term, icon: <Compass className="w-3.5 h-3.5" />, accent: 'text-secondary' },
                            ].filter((it) => it.text?.trim()).map((it) => (
                                <div key={it.label} className="rounded-2xl border border-outline-variant/30 p-4 bg-surface">
                                    <div className={`flex items-center gap-1.5 mb-1.5 ${it.accent}`}>
                                        {it.icon}
                                        <p className="text-[10px] font-bold uppercase tracking-widest">{it.label}</p>
                                    </div>
                                    <p className="text-[12px] text-on-surface-variant/85 leading-relaxed">{it.text}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[11px] text-on-surface-variant/70">
                            {(t('family.compatibilityLangNote') || 'Reading in {lang}. Other languages charge {n} credits.')
                                .replace('{lang}', lang.toUpperCase()).replace('{n}', String(creditCost))}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {LANGS.map((l) => (
                                <button
                                    key={l.value}
                                    onClick={() => setLang(l.value)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                                        lang === l.value
                                            ? 'bg-secondary text-white border-secondary'
                                            : 'bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10'
                                    }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                            {!alreadyPaidForLang && (
                                <Button variant="ghost" size="sm" onClick={startCompatibility}>
                                    Re-run · {creditCost}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ) : (
                <Card variant="default" padding="lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-secondary" />
                        <h3 className="text-sm font-headline font-bold text-primary">
                            {t('family.compatibility') || 'Compatibility'}
                        </h3>
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary/85 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5">
                            <Coins className="w-3 h-3" /> {creditCost} credits
                        </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/75 mb-4">
                        {t('family.compatibilityDesc') ||
                            'First read charges credits. Repeating the same language is free.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {LANGS.map((l) => (
                            <button
                                key={l.value}
                                onClick={() => setLang(l.value)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors border ${
                                    lang === l.value
                                        ? 'bg-secondary text-white border-secondary'
                                        : 'bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10'
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                    {!compatLoading && (
                        <Button variant="primary" onClick={startCompatibility} leftIcon={<Heart className="w-4 h-4" />}>
                            Check Compatibility · {creditCost} credits
                        </Button>
                    )}
                    {compatLoading && (
                        <div className="text-secondary/60 text-sm flex items-center gap-2">
                            <Star className="w-4 h-4 animate-pulse" /> Analyzing synastry…
                        </div>
                    )}
                    {totalCredits != null && totalCredits < creditCost && (
                        <div className="mt-3 text-[11px] text-amber-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            You have {totalCredits} credits — {creditCost - totalCredits} short.{' '}
                            <a href="/plans" className="font-bold underline">Top up</a>
                        </div>
                    )}
                </Card>
            )}
            </div>

            {/* ─────────────── Strengths (left) + Tensions/Guidance (right) ─────────────── */}
            {compat && (
                (compat.strengths && compat.strengths.length > 0) ||
                (compat.tension_points && compat.tension_points.length > 0) ||
                compat.advice
            ) && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Left column: Top Strengths */}
                    {compat.strengths && compat.strengths.length > 0 && (
                        <div className="md:col-span-3">
                            <Card variant="default" padding="lg">
                                <HighlightList
                                    title="Top Strengths"
                                    items={compat.strengths}
                                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                                    variant="strength"
                                />
                            </Card>
                        </div>
                    )}

                    {/* Right column: Tensions stacked above Guidance */}
                    <div className="md:col-span-2 space-y-4">
                        {compat.tension_points && compat.tension_points.length > 0 && (
                            <Card variant="default" padding="lg">
                                <HighlightList
                                    title="Tension Points"
                                    items={compat.tension_points}
                                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                                    variant="tension"
                                />
                            </Card>
                        )}
                        {compat.advice && (
                            <Card variant="default" padding="lg">
                                <div className="flex items-center gap-2 mb-4">
                                    <HandHeart className="w-4 h-4 text-secondary" />
                                    <h3 className="text-sm font-headline font-bold text-primary">
                                        {t('family.guidance') || 'Guidance'}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <AdviceCard
                                        icon={<MessageCircle className="w-3 h-3" />}
                                        label="Communication"
                                        text={compat.advice.communication_style}
                                        accent="text-sky-400"
                                    />
                                    <AdviceCard
                                        icon={<HandHeart className="w-3 h-3" />}
                                        label="Best Support"
                                        text={compat.advice.best_support_method}
                                        accent="text-emerald-400"
                                    />
                                    <AdviceCard
                                        icon={<Shield className="w-3 h-3" />}
                                        label="Boundaries"
                                        text={compat.advice.boundaries_or_cautions}
                                        accent="text-amber-400"
                                    />
                                    <AdviceCard
                                        icon={<ArrowRight className="w-3 h-3" />}
                                        label="Next Step"
                                        text={compat.advice.next_step}
                                        accent="text-secondary"
                                    />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Factor Breakdown (collapsible) */}
            {compat?.factors && compat.factors.length > 0 && (
                <Card variant="default" padding="lg">
                    <FactorsBreakdown factors={compat.factors} />
                </Card>
            )}

            {/* ─────────────── Chart ─────────────── */}
            <div ref={chartRef} className="scroll-mt-24">
                <Card variant="default" padding="lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4 text-secondary" />
                        <h3 className="text-sm font-headline font-bold text-primary">
                            {t('family.chartTitle') || 'Birth Chart'}
                        </h3>
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                            Free
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

            {/* ─────────────── Reports ─────────────── */}
            {reports && reports.length > 0 && (
                <div ref={reportsRef} className="scroll-mt-24">
                    <Card variant="default" padding="lg">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-secondary" />
                            <h3 className="text-sm font-headline font-bold text-primary">
                                Saved Reports
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {reports.map((report) => (
                                <div key={report.id} className="flex items-center justify-between p-3 rounded-2xl border border-outline-variant/15 bg-secondary/5 hover:bg-secondary/10 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="w-4 h-4 text-secondary shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-primary truncate">{report.title}</p>
                                            <p className="text-[10px] text-on-surface-variant/70">
                                                {formatReportDate(report.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`/api/family/reports/${report.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold uppercase tracking-wider text-secondary hover:underline shrink-0"
                                    >
                                        Download
                                    </a>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmingPurchase}
                onClose={() => setConfirmingPurchase(false)}
                onConfirm={runCompatibility}
                title={preflightData?.staleDataWarning ? 'Re-run compatibility analysis?' : `Use ${preflightData?.creditCost ?? creditCost} credits?`}
                message={
                    preflightData?.staleDataWarning
                        ? `Birth details for ${member.name} or your profile have changed since the last analysis. Re-running the compatibility check will generate a new analysis and cost ${preflightData?.creditCost ?? creditCost} credits.`
                        : `This will charge ${preflightData?.creditCost ?? creditCost} credits to generate the ${lang.toUpperCase()} compatibility analysis for ${member.name}. Repeating the same language later is free.`
                }
                confirmText={preflightData?.staleDataWarning ? 'Re-run analysis' : `Use ${preflightData?.creditCost ?? creditCost} credits`}
                cancelText="Cancel"
                variant="warning"
                isLoading={compatLoading}
            />
        </div>
    );
}

/* ---------- Compatibility helpers ---------- */

function statusPalette(status: string): { text: string; bg: string; border: string; bar: string } {
    switch (status) {
        case 'strength':
            return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-400' };
        case 'tension':
            return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', bar: 'bg-orange-400' };
        case 'balanced':
        default:
            return { text: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', bar: 'bg-indigo-400' };
    }
}

function confidencePalette(level: string): { text: string; bg: string; border: string } {
    switch (level) {
        case 'high':
            return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        case 'low':
            return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
        case 'medium':
        default:
            return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    }
}

function ScoreRing({ score, band, size = 88 }: { score: number; band: string; size?: number }) {
    const clamped = Math.max(0, Math.min(100, score));
    const stroke = 6;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - clamped / 100);
    const palette = bandPalette(band);
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    className="text-outline-variant/30"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    className={`${palette.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-xl sm:text-2xl font-headline font-bold text-primary">{score}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/65 mt-0.5">
                    /100
                </span>
            </div>
        </div>
    );
}

function HighlightList({
    title,
    items,
    icon,
    variant,
}: {
    title: string;
    items: { factor: string; score: number; text: string }[];
    icon: React.ReactNode;
    variant: 'strength' | 'tension';
}) {
    const palette = statusPalette(variant);
    return (
        <div>
            <div className={`flex items-center gap-1.5 mb-2 ${palette.text}`}>
                {icon}
                <p className="text-[11px] font-bold uppercase tracking-widest">{title}</p>
            </div>
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div
                        key={i}
                        className={`rounded-2xl p-3 border ${palette.bg} ${palette.border}`}
                    >
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                            <p className={`text-[12px] font-bold ${palette.text}`}>{it.factor}</p>
                            <span className="text-[10px] font-bold text-on-surface-variant/70 shrink-0">
                                {Math.round(it.score)}
                            </span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant/80 leading-relaxed">{it.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AdviceCard({
    icon,
    label,
    text,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    text: string;
    accent: string;
}) {
    if (!text?.trim()) return null;
    return (
        <div className="rounded-2xl border border-outline-variant/30 p-3 bg-surface">
            <div className={`flex items-center gap-1.5 mb-1.5 ${accent}`}>
                {icon}
                <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-[12px] text-on-surface-variant/80 leading-relaxed">{text}</p>
        </div>
    );
}

function FactorsBreakdown({ factors }: { factors: NonNullable<ReturnType<typeof useFamilyCompatibility>['data']>['factors'] }) {
    const [expanded, setExpanded] = useState(false);
    if (!factors?.length) return null;
    return (
        <div className="rounded-2xl border border-outline-variant/30 overflow-hidden">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-secondary/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                        Factor Breakdown
                    </p>
                    <span className="text-[10px] text-on-surface-variant/65 font-bold">
                        {factors.length}
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-on-surface-variant/65" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-on-surface-variant/65" />
                )}
            </button>
            {expanded && (
                <div className="border-t border-outline-variant/20 p-3 space-y-3">
                    {factors.map((f, i) => {
                        const palette = statusPalette(f.status);
                        const pct = Math.max(0, Math.min(100, f.score_percent ?? 0));
                        return (
                            <div key={f.name ?? f.key ?? i} className="space-y-1.5">
                                <div className="flex items-baseline justify-between gap-2">
                                    <p className="text-[12px] font-bold text-primary">
                                        {f.label || f.name || f.key || `Factor ${i + 1}`}
                                    </p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span
                                            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${palette.bg} ${palette.text} ${palette.border}`}
                                        >
                                            {f.status}
                                        </span>
                                        <span className="text-[11px] font-bold text-on-surface-variant/75 tabular-nums">
                                            {Math.round(pct)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-outline-variant/20 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${palette.bar} transition-[width] duration-700 ease-out`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                {(f.summary || f.detail) && (
                                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                                        {f.summary || f.detail}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function RelationshipActions({ actions }: { actions: NonNullable<NonNullable<ReturnType<typeof useFamilyCompatibility>['data']>['relationship_actions']> }) {
    const items: { label: string; text: string; icon: React.ReactNode; accent: string }[] = [
        { label: 'Today', text: actions.today, icon: <Clock className="w-3 h-3" />, accent: 'text-emerald-400' },
        { label: 'This Week', text: actions.this_week, icon: <Calendar className="w-3 h-3" />, accent: 'text-sky-400' },
        { label: 'Long Term', text: actions.long_term, icon: <Compass className="w-3 h-3" />, accent: 'text-secondary' },
    ].filter((it) => it.text?.trim());

    if (items.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-1.5 mb-2 text-secondary">
                <ArrowRight className="w-3.5 h-3.5" />
                <p className="text-[11px] font-bold uppercase tracking-widest">What To Do</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {items.map((it) => (
                    <div
                        key={it.label}
                        className="rounded-2xl border border-outline-variant/30 p-3 bg-surface"
                    >
                        <div className={`flex items-center gap-1.5 mb-1.5 ${it.accent}`}>
                            {it.icon}
                            <p className="text-[10px] font-bold uppercase tracking-widest">{it.label}</p>
                        </div>
                        <p className="text-[12px] text-on-surface-variant/80 leading-relaxed">{it.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CompatibilityResult({
    result,
    onRerun,
    alreadyPaid,
}: {
    result: NonNullable<ReturnType<typeof useFamilyCompatibility>['data']>;
    onRerun: () => void;
    alreadyPaid: boolean;
}) {
    const palette = bandPalette(result.band);
    const confPalette = result.confidence ? confidencePalette(result.confidence.level) : null;

    return (
        <div className="space-y-5">
            {/* Top summary */}
            <div className="flex items-center gap-4 flex-wrap">
                <ScoreRing score={result.score} band={result.band} />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/75 font-bold">
                        Band
                    </p>
                    <p className={`text-xl font-headline font-bold ${palette.text}`}>{result.band}</p>
                    {result.confidence && confPalette && (
                        <span
                            className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${confPalette.bg} ${confPalette.text} ${confPalette.border}`}
                        >
                            <Shield className="w-3 h-3" />
                            {result.confidence.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Verdict */}
            <p className="text-sm text-on-surface-variant/80 leading-relaxed whitespace-pre-line">
                {result.verdict}
            </p>

            {/* Confidence note */}
            {result.confidence?.note && (
                <p className="text-[11px] text-on-surface-variant/70 italic leading-relaxed border-l-2 border-outline-variant/30 pl-3">
                    {result.confidence.note}
                </p>
            )}

            {/* What to do — Today / This Week / Long Term */}
            {result.relationship_actions && (
                <RelationshipActions actions={result.relationship_actions} />
            )}

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
                <HighlightList
                    title="Top Strengths"
                    items={result.strengths}
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    variant="strength"
                />
            )}

            {/* Tension points */}
            {result.tension_points && result.tension_points.length > 0 && (
                <HighlightList
                    title="Tension Points"
                    items={result.tension_points}
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                    variant="tension"
                />
            )}

            {/* Advice */}
            {result.advice && (
                <div>
                    <div className="flex items-center gap-1.5 mb-2 text-secondary">
                        <HandHeart className="w-3.5 h-3.5" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">Guidance</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <AdviceCard
                            icon={<MessageCircle className="w-3 h-3" />}
                            label="Communication"
                            text={result.advice.communication_style}
                            accent="text-sky-400"
                        />
                        <AdviceCard
                            icon={<HandHeart className="w-3 h-3" />}
                            label="Best Support"
                            text={result.advice.best_support_method}
                            accent="text-emerald-400"
                        />
                        <AdviceCard
                            icon={<Shield className="w-3 h-3" />}
                            label="Boundaries"
                            text={result.advice.boundaries_or_cautions}
                            accent="text-amber-400"
                        />
                        <AdviceCard
                            icon={<ArrowRight className="w-3 h-3" />}
                            label="Next Step"
                            text={result.advice.next_step}
                            accent="text-secondary"
                        />
                    </div>
                </div>
            )}

            {/* Factor breakdown */}
            <FactorsBreakdown factors={result.factors} />

            {!alreadyPaid && (
                <Button variant="ghost" size="sm" onClick={onRerun}>
                    Re-run analysis
                </Button>
            )}
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
    const [relationship, setRelationship] = useState<FamilyRelationshipType>('friend');
    const [message, setMessage] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const emailValid = EMAIL_REGEX.test(email.trim());
    const emailError = emailTouched && !emailValid ? (t('family.inviteEmailInvalid') || 'Enter a valid email') : undefined;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailTouched(true);
        if (!emailValid || isSending) return;
        setIsSending(true);
        const res = await sendInvite({
            email: email.trim(),
            relationshipType: relationship,
            message: message.trim() || undefined,
        });
        setIsSending(false);
        if (res.ok) {
            onSent();
            return;
        }
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
                        {t('family.inviteRelationshipLabel') || 'Relationship'}
                        <span className="text-secondary ml-1">*</span>
                    </label>
                    <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value as FamilyRelationshipType)}
                        className="w-full bg-surface border border-outline-variant/30 rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary"
                    >
                        {RELATIONSHIP_TYPES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>

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

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSending}>
                        {t('common.cancel') || 'Cancel'}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSending}
                        leftIcon={<Send className="w-4 h-4" />}
                        disabled={!emailValid}
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
}: {
    connection: FamilyConnection;
    onUpdated: (c: FamilyConnection) => void;
    onDisconnected: () => void;
}) {
    const { t } = useTranslation();
    const { success, error: toastError, info, warning } = useToast();
    const { totalCredits } = usePaywallContext();
    const { data: avatars } = useFamilyAvatars();
    const { data: compat, isLoading: compatLoading, fetchCompatibility } = useFamilyConnectionCompatibility(connection.connectionId);
    const { fetchPreflight: fetchConnectionPreflight } = useFamilyConnectionCompatibilityPreflight(connection.connectionId);
    const [preflightData, setPreflightData] = useState<FamilyCompatibilityPreflight | null>(null);

    const [notes, setNotes] = useState(connection.myNotes ?? '');
    const [savingNotes, setSavingNotes] = useState(false);
    const [togglingShare, setTogglingShare] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [lang, setLang] = useState<CompatibilityLang>('en');
    const [confirmingPurchase, setConfirmingPurchase] = useState(false);
    /** Replaces the previous sharingRequired boolean — captures who's blocking
     *  and (optionally) the email to nudge when blocked by them. */
    const [sharingBlocked, setSharingBlocked] = useState<
        { blockedBy: 'you' | 'them' | 'both'; nudgeEmail?: string } | null
    >(null);

    const accent = connection.avatar?.accentColor || 'var(--secondary)';
    const creditCost = COMPATIBILITY_CREDIT_COST[connection.iSeeThemAs] ?? 5;
    const alreadyPaidForLang = useMemo(
        () => compat?.lang === lang,
        [compat, lang]
    );

    // Pull preflight in the background once compat lands so we can show the
    // refresh CTA when the cached result is stale.
    useEffect(() => {
        if (!compat) return;
        let cancelled = false;
        fetchConnectionPreflight().then((pf) => {
            if (!cancelled) setPreflightData(pf);
        });
        return () => { cancelled = true; };
    }, [compat, fetchConnectionPreflight]);

    const persist = async (payload: Parameters<typeof updateConnection>[1]) => {
        const res = await updateConnection(connection.connectionId, payload);
        if (!res.ok || !res.data) {
            toastError(parseInviteErrorByStatus(res.status, res.raw, t));
            return false;
        }
        onUpdated(res.data);
        return true;
    };

    const toggleShare = async () => {
        setTogglingShare(true);
        const ok = await persist({ sharingWithThem: !connection.sharingWithThem });
        setTogglingShare(false);
        if (ok) {
            success(!connection.sharingWithThem
                ? (t('family.connectionSharingOn') || 'Sharing on')
                : (t('family.connectionSharingOff') || 'Sharing off'));
            // Clear inline gating so user can retry compat now.
            if (!connection.sharingWithThem) setSharingBlocked(null);
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

    const runCompatibility = async () => {
        setConfirmingPurchase(false);
        setSharingBlocked(null);
        const res = await fetchCompatibility(lang);
        if (res.ok) {
            if (res.data?.cached) {
                info(`Showing cached ${lang.toUpperCase()} result — no credits charged.`);
            } else {
                success(`${creditCost} credits used for compatibility analysis.`);
            }
            return;
        }
        if (res.sharingRequired) {
            setSharingBlocked({
                blockedBy: res.blockedBy ?? deriveLocalBlockedBy(connection) ?? 'both',
                nudgeEmail: res.nudgeAction?.target_email ?? connection.otherEmail,
            });
            warning(t('family.sharingRequired') || 'Sharing required on both sides before compatibility can be computed.');
            return;
        }
        if (res.status === 402) {
            toastError(`Insufficient credits. You need ${creditCost} credits to run this analysis.`);
            return;
        }
        if (res.status === 409 && res.stillComputing) {
            info('Still computing — please try again in a few seconds.');
            return;
        }
        toastError(res.error || 'Compatibility request failed.');
    };

    const startCompatibility = () => {
        if (alreadyPaidForLang) return;
        // Pre-check sharing locally; backend will enforce too but this gives instant feedback.
        const local = deriveLocalBlockedBy(connection);
        if (local) {
            setSharingBlocked({ blockedBy: local, nudgeEmail: connection.otherEmail });
            return;
        }
        setConfirmingPurchase(true);
    };

    const notesDirty = (notes ?? '') !== (connection.myNotes ?? '');

    return (
        <div className="space-y-6">
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
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/30">
                                <Link2 className="w-3 h-3" />
                                {t('family.linkedBadge') || 'Linked'}
                            </span>
                        </div>
                        <p className="text-[11px] uppercase tracking-wider text-secondary/80 font-bold mt-0.5">
                            {connection.iSeeThemAs}
                        </p>
                        <div className="mt-3 space-y-1 text-[12px] text-on-surface-variant/70">
                            <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 opacity-50 shrink-0" />
                                <span className="truncate">{connection.otherEmail}</span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant/75">
                                {(t('family.connectionISeeThemAs') || 'You see them as {label}').replace('{label}', connection.iSeeThemAs)}
                                {' · '}
                                {(t('family.connectionTheySeeMeAs') || 'They see you as {label}').replace('{label}', connection.theySeeMeAs)}
                            </p>
                        </div>
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

            {/* Compatibility */}
            <Card variant="default" padding="lg">
                <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-secondary" />
                    <h3 className="text-sm font-headline font-bold text-primary">
                        {t('family.compatibility') || 'Compatibility'}
                    </h3>
                    <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
                        {compat?.cached && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                                Cached
                            </span>
                        )}
                        {alreadyPaidForLang && !compat?.cached && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                                Free re-run
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary/80 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5">
                            <Coins className="w-3 h-3" /> {creditCost} credits
                        </span>
                    </div>
                </div>

                <p className="text-xs text-on-surface-variant/75 mb-4">
                    {t('family.compatibilityDesc') ||
                        'First read charges credits. Repeating the same language is free.'}
                </p>

                {/* Language picker */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {LANGS.map((l) => (
                        <button
                            key={l.value}
                            onClick={() => setLang(l.value)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors border ${
                                lang === l.value
                                    ? 'bg-secondary text-white border-secondary'
                                    : 'bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10'
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>

                {/* SHARING_REQUIRED inline gate — branches on which side is blocking */}
                {sharingBlocked && !compat && (
                    <div className="mb-4 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-amber-300">
                                    {sharingBlocked.blockedBy === 'you'
                                        ? (t('family.sharingBlockedYou') || 'Enable sharing to unlock compatibility.')
                                        : sharingBlocked.blockedBy === 'them'
                                            ? (t('family.sharingBlockedThem') || 'Waiting for {name} to enable sharing.')
                                                .replace('{name}', connection.otherName)
                                            : (t('family.sharingBlockedBoth') || 'Both of you need to enable sharing before compatibility can be computed.')}
                                </p>
                                {sharingBlocked.blockedBy === 'you' && (
                                    <div className="mt-3">
                                        <p className="text-[11px] text-on-surface-variant/75 mb-2">
                                            {(t('family.sharingBlockedYouHint') ||
                                                'Turn on sharing with {name} below to compute synastry.')
                                                .replace('{name}', connection.otherName)}
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={toggleShare}
                                            loading={togglingShare}
                                            leftIcon={<Heart className="w-3.5 h-3.5" />}
                                        >
                                            {t('family.sharingEnable') || 'Enable sharing'}
                                        </Button>
                                    </div>
                                )}
                                {sharingBlocked.blockedBy === 'them' && (
                                    <div className="mt-3 text-[11px] text-on-surface-variant/80 leading-relaxed">
                                        {(t('family.sharingBlockedThemHint') ||
                                            'Ask them to enable sharing in their family settings. You can reach them at {email}.')
                                            .replace('{email}', sharingBlocked.nudgeEmail ?? connection.otherEmail)}
                                    </div>
                                )}
                                {sharingBlocked.blockedBy === 'both' && (
                                    <div className="mt-3">
                                        <p className="text-[11px] text-on-surface-variant/75 mb-2">
                                            {t('family.sharingBlockedBothHint') ||
                                                'Start by turning on your side, then ask them to enable sharing too.'}
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={toggleShare}
                                            loading={togglingShare}
                                            leftIcon={<Heart className="w-3.5 h-3.5" />}
                                        >
                                            {t('family.sharingEnableMine') || 'Enable my side'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stale-data refresh CTA — shown when preflight reports the cached
                    result is stale and refresh is available. */}
                {compat && preflightData?.staleDataWarning && preflightData?.refresh?.available && (
                    <div className="mb-4 p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-[12px] text-amber-300">
                                {t('family.compatibilityStaleHint') ||
                                    'Birth details changed since this reading. Refresh for an updated analysis.'}
                            </p>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={runCompatibility}
                                loading={compatLoading}
                                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            >
                                {(t('family.compatibilityRefreshCta') || 'Refresh for {n} credits')
                                    .replace('{n}', String(preflightData.refresh.creditCost ?? creditCost))}
                            </Button>
                        </div>
                    </div>
                )}

                {!compat && !compatLoading && (
                    <Button variant="primary" onClick={startCompatibility} leftIcon={<Heart className="w-4 h-4" />}>
                        Check Compatibility · {creditCost} credits
                    </Button>
                )}

                {compatLoading && (
                    <div className="text-secondary/60 text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 animate-pulse" /> Analyzing synastry…
                    </div>
                )}

                {compat && (
                    <CompatibilityResult result={compat} onRerun={startCompatibility} alreadyPaid={!!alreadyPaidForLang} />
                )}

                {totalCredits != null && totalCredits < creditCost && !compat && (
                    <div className="mt-3 text-[11px] text-amber-500 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        You have {totalCredits} credits — {creditCost - totalCredits} short.{' '}
                        <a href="/plans" className="font-bold underline">
                            Top up
                        </a>
                    </div>
                )}
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

            <ConfirmDialog
                isOpen={confirmingPurchase}
                onClose={() => setConfirmingPurchase(false)}
                onConfirm={runCompatibility}
                title={`Use ${creditCost} credits?`}
                message={`This will charge ${creditCost} credits to generate the ${lang.toUpperCase()} compatibility analysis with ${connection.otherName}. Repeating the same language later is free.`}
                confirmText={`Use ${creditCost} credits`}
                cancelText={t('common.cancel') || 'Cancel'}
                variant="warning"
                isLoading={compatLoading}
            />
        </div>
    );
}

const FAMILY_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    heart: Heart,
    star: Star,
    smile: Sparkles,
    sparkles: Sparkles,
    user: Users,
    users: Users,
    sun: Sun,
    moon: Moon,
    compass: Compass,
    flower: Flower,
    coins: Coins,
    activity: Activity,
};

export function getFamilyIcon(iconKey?: string | null): React.FC<{ className?: string }> {
    if (!iconKey) return Users;
    return FAMILY_ICON_MAP[iconKey.toLowerCase()] || Users;
}

