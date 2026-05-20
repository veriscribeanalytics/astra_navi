'use client';

import React, { useMemo, useState } from 'react';
import {
    Users, Plus, Pencil, Trash2, Heart, BookOpen, Coins,
    Calendar, Clock, MapPin, ChevronRight, Star, AlertCircle, X,
    Crown,
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
} from '@/hooks/useFamily';
import {
    type FamilyMember,
    type FamilyRelationshipType,
    type FamilyGender,
    type CompatibilityLang,
    COMPATIBILITY_CREDIT_COST,
    FAMILY_FREE_TIER_LIMIT,
} from '@/types/family';
import { tzOffsetHoursAt } from '@/lib/tzOffset';

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

/* ====================================================================== */
/* MAIN CLIENT                                                            */
/* ====================================================================== */

export default function FamilyClient() {
    const { t } = useTranslation();
    const { tier } = usePaywallContext();
    const { success, error: toastError, info } = useToast();
    const { data: members, isLoading, error, refetch } = useFamilyMembers();

    const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
    const [editing, setEditing] = useState<FamilyMember | null>(null);
    const [detailMember, setDetailMember] = useState<FamilyMember | null>(null);
    const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFreeTier = !tier || tier === 'free';
    const memberCount = members?.length ?? 0;
    const atFreeCap = isFreeTier && memberCount >= FAMILY_FREE_TIER_LIMIT;

    const openAdd = () => {
        setEditing(null);
        setView('form');
    };

    const openEdit = (m: FamilyMember) => {
        setEditing(m);
        setView('form');
    };

    const openDetail = (m: FamilyMember) => {
        setDetailMember(m);
        setView('detail');
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
                        {view === 'list' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={openAdd}
                                leftIcon={<Plus className="w-4 h-4" />}
                                disabled={atFreeCap}
                            >
                                {t('family.addMember') || 'Add Member'}
                            </Button>
                        )}
                        {view !== 'list' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setView('list');
                                    setEditing(null);
                                    setDetailMember(null);
                                }}
                                leftIcon={<X className="w-4 h-4" />}
                            >
                                {t('common.back') || 'Back'}
                            </Button>
                        )}
                    </div>

                    {/* Free-tier counter */}
                    {isFreeTier && view === 'list' && (
                        <div className="mt-4 flex items-center gap-2 text-[11px] text-on-surface-variant/70">
                            <Crown className="w-3.5 h-3.5 text-secondary/70" />
                            <span>
                                {memberCount} / {FAMILY_FREE_TIER_LIMIT} {t('family.freeTierUsed') || 'members used on Free tier'}
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
                        isLoading={isLoading}
                        error={error}
                        onOpen={openDetail}
                        onEdit={openEdit}
                        onDelete={(m) => setDeletingMember(m)}
                        onAdd={openAdd}
                        atFreeCap={atFreeCap}
                    />
                )}

                {view === 'form' && (
                    <FamilyMemberForm
                        editing={editing}
                        onCancel={() => setView('list')}
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

                {view === 'detail' && detailMember && (
                    <FamilyMemberDetail member={detailMember} onEdit={() => openEdit(detailMember)} />
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
    isLoading: boolean;
    error: string | null;
    onOpen: (m: FamilyMember) => void;
    onEdit: (m: FamilyMember) => void;
    onDelete: (m: FamilyMember) => void;
    onAdd: () => void;
    atFreeCap: boolean;
}

function FamilyList({ members, isLoading, error, onOpen, onEdit, onDelete, onAdd, atFreeCap }: FamilyListProps) {
    const { t } = useTranslation();

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

    if (!members || members.length === 0) {
        return (
            <Card variant="default" padding="lg">
                <div className="text-center py-8">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-secondary/10 items-center justify-center text-secondary mb-4">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-headline font-bold text-primary mb-2">
                        {t('family.empty') || 'No family members yet'}
                    </h3>
                    <p className="text-sm text-on-surface-variant/60 mb-5 max-w-md mx-auto">
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
            {members.map((m) => (
                <Card key={m.id} variant="default" padding="md" hoverable>
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-sm font-bold shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                        </div>
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
                                    className="p-2 rounded-xl text-on-surface-variant/60 hover:text-secondary hover:bg-secondary/5 transition-colors"
                                    aria-label="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(m)}
                                    className="p-2 rounded-xl text-on-surface-variant/60 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                                    aria-label="Remove"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
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
                    <p className="text-xs text-on-surface-variant/60">
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
                            <p className="text-[10px] text-on-surface-variant/50 ml-1">
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
                        Notes <span className="text-on-surface-variant/40 normal-case">(optional)</span>
                    </label>
                    <textarea
                        value={state.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        rows={2}
                        placeholder="Anything you want to remember about them…"
                        className="w-full bg-surface border border-outline-variant/30 hover:border-secondary/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-all rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 text-sm text-primary placeholder:text-primary/40 resize-none"
                    />
                </div>

                {!isEdit && (
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-outline-variant/30 hover:border-secondary/30 transition-colors">
                        <input
                            type="checkbox"
                            checked={state.consentAcknowledged}
                            onChange={(e) => update('consentAcknowledged', e.target.checked)}
                            className="mt-1 accent-secondary"
                        />
                        <span className="text-xs text-on-surface-variant/80 leading-relaxed">
                            I confirm I have permission to store this person&apos;s birth details on AstraNavi, and I will not
                            share their chart without their consent.
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

    const creditCost = COMPATIBILITY_CREDIT_COST[member.relationshipType] ?? 5;

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
        if (res.status === 400) {
            toastError(
                res.error ||
                    'Your profile is missing birth date, time, coordinates, or timezone. Update your profile to enable compatibility.'
            );
            return;
        }
        if (res.status === 402) {
            toastError(`Insufficient credits. You need ${creditCost} credits to run this analysis.`);
            return;
        }
        toastError(res.error || 'Compatibility request failed.');
    };

    const startCompatibility = () => {
        if (alreadyPaidForLang) {
            // No-op — already shown
            return;
        }
        setConfirmingPurchase(true);
    };

    return (
        <div className="space-y-6">
            {/* Header card */}
            <Card variant="default" padding="lg">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-lg font-bold shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-headline font-bold text-primary">{member.name}</h2>
                        <p className="text-[11px] uppercase tracking-wider text-secondary/80 font-bold mt-0.5">
                            {member.relationshipType} · {member.gender}
                        </p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] text-on-surface-variant/70">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 opacity-50" /> {member.dob}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 opacity-50" /> {member.tob}
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3 h-3 opacity-50 shrink-0" />
                                <span className="truncate">{member.pob}</span>
                            </div>
                        </div>
                        {member.notes && (
                            <p className="mt-3 text-[12px] text-on-surface-variant/60 italic">
                                &ldquo;{member.notes}&rdquo;
                            </p>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<Pencil className="w-3.5 h-3.5" />}>
                        Edit
                    </Button>
                </div>
            </Card>

            {/* Chart */}
            <Card variant="default" padding="lg">
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-secondary" />
                    <h3 className="text-sm font-headline font-bold text-primary">
                        {t('family.chartTitle') || 'Birth Chart'}
                    </h3>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-secondary/70 font-bold">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                        <ChartStat label="Lagna" value={JSON.stringify(chart.chart.lagna) === '{}' ? 'Pending' : 'Available'} />
                        <ChartStat
                            label="Planets"
                            value={`${Object.keys(chart.chart.planets || {}).length} mapped`}
                        />
                        <ChartStat
                            label="Houses"
                            value={`${Object.keys(chart.chart.houses || {}).length} cusps`}
                        />
                    </div>
                )}
            </Card>

            {/* Compatibility */}
            <Card variant="default" padding="lg">
                <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-secondary" />
                    <h3 className="text-sm font-headline font-bold text-primary">
                        {t('family.compatibility') || 'Compatibility'}
                    </h3>
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary/80 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5">
                        <Coins className="w-3 h-3" /> {creditCost} credits
                    </span>
                </div>

                <p className="text-xs text-on-surface-variant/60 mb-4">
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

            <ConfirmDialog
                isOpen={confirmingPurchase}
                onClose={() => setConfirmingPurchase(false)}
                onConfirm={runCompatibility}
                title={`Use ${creditCost} credits?`}
                message={`This will charge ${creditCost} credits to generate the ${lang.toUpperCase()} compatibility analysis for ${member.name}. Repeating the same language later is free.`}
                confirmText={`Use ${creditCost} credits`}
                cancelText="Cancel"
                variant="warning"
                isLoading={compatLoading}
            />
        </div>
    );
}

function ChartStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-outline-variant/30 p-3">
            <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">{label}</p>
            <p className="text-sm font-bold text-primary mt-1">{value}</p>
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
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center">
                    <span className="text-2xl font-headline font-bold text-secondary">{result.score}</span>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-bold">
                        Band
                    </p>
                    <p className="text-lg font-headline font-bold text-primary">{result.band}</p>
                </div>
                {result.cached && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-secondary/70 bg-secondary/10 rounded-full px-2 py-0.5">
                        Cached
                    </span>
                )}
            </div>

            <p className="text-sm text-on-surface-variant/80 leading-relaxed whitespace-pre-line">
                {result.verdict}
            </p>

            {result.factors?.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-bold">
                        Factors
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.factors.map((f, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-outline-variant/30 p-3 text-[12px]"
                            >
                                <p className="font-bold text-primary">
                                    {f.label ?? f.key ?? `Factor ${i + 1}`}
                                </p>
                                {typeof f.score === 'number' && (
                                    <p className="text-secondary/80 mt-0.5">Score: {f.score}</p>
                                )}
                                {f.detail && (
                                    <p className="text-on-surface-variant/60 mt-1 leading-relaxed">
                                        {f.detail}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!alreadyPaid && (
                <Button variant="ghost" size="sm" onClick={onRerun}>
                    Re-run analysis
                </Button>
            )}
        </div>
    );
}
