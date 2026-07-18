'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LocationSearch, { LocationResult } from '@/components/ui/LocationSearch';
import DstConflictDialog from '@/components/ui/DstConflictDialog';
import ProfileDiscoverySettings from './ProfileDiscoverySettings';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { useToast, useTranslation } from '@/hooks';
import ProfileImageUpload from '@/components/profile/ProfileImageUpload';
import { LanguageCode } from '@/locales';
import { clientFetch } from '@/lib/apiClient';
import {
    User, Calendar, Clock,
    Save, ArrowLeft, RotateCcw, Sparkles,
    Globe, Bell, Phone, Mail, CheckCircle2,
    ArrowRight, Wallet
} from 'lucide-react';

const VALID_GENDERS = new Set(["male", "female", "other", "Not Specified"]);
const VALID_MARITAL_STATUSES = new Set(["single", "married", "divorced", "widowed", "separated", "Not Specified"]);
const VALID_OCCUPATIONS = new Set(["student", "business", "employed", "homemaker", "retired", "unemployed", "Not Specified"]);

const safeEnum = (value: string | undefined | null, validSet: Set<string>): string =>
    value != null && validSet.has(value) ? value : "";

const nullToUndef = <T,>(val: T | null | undefined): T | undefined =>
    val === null ? undefined : val;

export default function ProfileSettingsPage() {
    const { user, login, showLoading, isLoading, refreshProfile } = useAuth();
    // next-auth session updater — used to refresh the JWT `profileComplete`
    // hint once onboarding is done, so the server-side gate (app/page.tsx)
    // stops redirecting the user back here.
    const { update: updateAuthSession } = useSession();
    const { tier, totalCredits, isLoaded: paywallLoaded } = usePaywallContext();
    const { language: contextLanguage, setLanguage, availableLanguages, t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams?.get('onboarding') === 'true';
    const { ToastContainer, success, error } = useToast();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        tob: '',
        pob: '',
        birthPlaceName: '',
        birthLatitude: undefined as number | undefined,
        birthLongitude: undefined as number | undefined,
        birthTimezoneName: '',
        birthTimezoneOffsetAtBirth: undefined as number | undefined,
        phoneNumber: '',
        gender: '',
        maritalStatus: '',
        occupation: '',
        language: '',
        preferences: { horoscope: true, notifications: false }
    });
    const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
    const [showDstDialog, setShowDstDialog] = useState(false);
    const [dstConflictMessage, setDstConflictMessage] = useState('');
    const [dstRetryData, setDstRetryData] = useState<Partial<typeof formData> | null>(null);
    const saveAttemptRef = useRef(0);
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        tob: '',
        pob: '',
        phoneNumber: ''
    });
    const [touched, setTouched] = useState({
        firstName: false,
        lastName: false,
        dob: false,
        tob: false,
        pob: false,
        phoneNumber: false
    });
    const [hasChanges, setHasChanges] = useState(false);


    const updateFormData = (updates: Partial<typeof formData> | ((current: typeof formData) => typeof formData)) => {
        setHasChanges(true);
        setFormData(current => typeof updates === 'function' ? updates(current) : { ...current, ...updates });
    };

    useEffect(() => {
        if (!user || hasChanges) return;

        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            dob: user.dob || '',
            tob: user.tob || '',
            pob: user.pob || '',
            birthPlaceName: user.birthPlaceName || '',
            birthLatitude: nullToUndef(user.birthLatitude),
            birthLongitude: nullToUndef(user.birthLongitude),
            birthTimezoneName: user.birthTimezoneName || '',
            birthTimezoneOffsetAtBirth: nullToUndef(user.birthTimezoneOffsetAtBirth),
            phoneNumber: user.phoneNumber || '',
            gender: safeEnum(user.gender, VALID_GENDERS),
            maritalStatus: safeEnum(user.maritalStatus, VALID_MARITAL_STATUSES),
            occupation: safeEnum(user.occupation, VALID_OCCUPATIONS),
            language: user.language || contextLanguage || 'en',
            preferences: {
                horoscope: user.preferences?.horoscope ?? true,
                notifications: user.preferences?.notifications ?? false
            }
        });

        if (typeof user.birthLatitude === 'number' && typeof user.birthLongitude === 'number' && user.birthTimezoneName) {
            setSelectedLocation({
                name: user.birthPlaceName || user.pob || '',
                lat: user.birthLatitude,
                lon: user.birthLongitude,
                timezone: user.birthTimezoneName,
            });
        } else {
            setSelectedLocation(null);
        }

        setErrors({ firstName: '', lastName: '', dob: '', tob: '', pob: '', phoneNumber: '' });
        setTouched({ firstName: false, lastName: false, dob: false, tob: false, pob: false, phoneNumber: false });
    }, [user, contextLanguage, hasChanges]);

    // --- Compute onboarding steps: all 4 with per-step status for visual checklist ---
    const onboardingSteps = useMemo(() => {
        const hasLocation = !!user?.pob && typeof user?.birthLatitude === 'number' && typeof user?.birthLongitude === 'number' && !!user?.birthTimezoneName;
        return [
            { id: 'name' as const,   label: t('profile.onboarding.steps.name.label'),               hint: t('profile.onboarding.steps.name.hint'),                     complete: !!(user?.firstName && user?.lastName) },
            { id: 'dob'  as const,   label: t('profile.onboarding.steps.dob.label'),           hint: t('profile.onboarding.steps.dob.hint'),       complete: !!user?.dob },
            { id: 'tob'  as const,   label: t('profile.onboarding.steps.tob.label'),           hint: t('profile.onboarding.steps.tob.hint'),      complete: !!user?.tob },
            { id: 'pob'  as const,   label: t('profile.onboarding.steps.pob.label'), hint: t('profile.onboarding.steps.pob.hint'), complete: hasLocation },
        ];
    }, [user, t]);
    const profileProgress = useMemo(() => {
        const complete = onboardingSteps.filter(s => s.complete).length;
        return { complete, total: onboardingSteps.length };
    }, [onboardingSteps]);
    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';

        switch (field) {
            case 'firstName':
                if (!value.trim()) {
                    break;
                }
                if (value.trim().length < 2) {
                    error = t('profile.fields.errors.firstNameTooShort');
                } else if (value.trim().length > 50) {
                    error = t('profile.fields.errors.firstNameTooLong');
                }
                break;
            case 'lastName':
                if (!value.trim()) {
                    break;
                }
                if (value.trim().length < 2) {
                    error = t('profile.fields.errors.lastNameTooShort');
                } else if (value.trim().length > 50) {
                    error = t('profile.fields.errors.lastNameTooLong');
                }
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    const today = new Date();
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 150);

                    if (dob > today) {
                        error = t('profile.fields.errors.dobInFuture');
                    } else if (dob < hundredYearsAgo) {
                        error = t('profile.fields.errors.dobInvalid');
                    }
                }
                break;
            case 'pob':
                if (!value.trim()) {
                    break;
                }
                if (value.trim().length < 2) {
                    error = t('profile.fields.errors.pobInvalid');
                } else if (value.trim().length > 100) {
                    error = t('profile.fields.errors.pobTooLong');
                }
                break;
        }

        return error;
    };

    const validateForm = () => {
        const newErrors = {
            firstName: validateField('firstName', formData.firstName),
            lastName: validateField('lastName', formData.lastName),
            dob: validateField('dob', formData.dob),
            tob: '',
            pob: validateField('pob', formData.pob),
            phoneNumber: ''
        };

        // First and last name are always required to save a complete profile.
        if (!formData.firstName.trim()) newErrors.firstName = t('profile.fields.errors.firstNameRequired');
        if (!formData.lastName.trim()) newErrors.lastName = t('profile.fields.errors.lastNameRequired');

        // In onboarding mode, dob/tob/pob are also required,
        // and structured birth location (latitude/longitude/timezone) is also required
        if (isOnboarding) {
            if (!formData.dob) newErrors.dob = t('profile.fields.errors.dobRequired');
            if (!formData.tob) newErrors.tob = t('profile.fields.errors.tobRequired');
            if (!formData.pob.trim()) newErrors.pob = t('profile.fields.errors.pobRequired');
            // Structured birth location validation
            if (!selectedLocation && (formData.birthLatitude === undefined || formData.birthLongitude === undefined || !formData.birthTimezoneName)) {
                newErrors.pob = t('profile.fields.errors.pobSelectRequired');
            }
        } else if (formData.pob.trim() && (formData.birthLatitude === undefined || formData.birthLongitude === undefined || !formData.birthTimezoneName)) {
            newErrors.pob = t('profile.fields.errors.pobSelectRequired');
        }

        setErrors(newErrors);
        setTouched({ firstName: true, lastName: true, dob: true, tob: true, pob: true, phoneNumber: true });
        return !Object.values(newErrors).some(e => e !== '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            error(t('profile.page.errors.fixErrors'));
            return;
        }

        if (!user?.email) {
            error(t('profile.page.errors.noEmailSession'));
            return;
        }

        // --- DIAGNOSTIC LOG: entry point ---
        console.log('[ProfileClient.handleSubmit] === SAVE ATTEMPT START ===');
        console.log('[ProfileClient.handleSubmit] hasChanges:', hasChanges);
        console.log('[ProfileClient.handleSubmit] isOnboarding:', isOnboarding);
        console.log('[ProfileClient.handleSubmit] formData keys present:', {
            firstName: !!formData.firstName, dob: !!formData.dob, tob: !!formData.tob, pob: !!formData.pob,
            birthLatitude: formData.birthLatitude, birthLongitude: formData.birthLongitude,
            birthTimezoneName: !!formData.birthTimezoneName,
            birthTimezoneOffsetAtBirth: formData.birthTimezoneOffsetAtBirth,
        });
        console.log('[ProfileClient.handleSubmit] selectedLocation:', selectedLocation ? { name: selectedLocation.name, lat: selectedLocation.lat, lon: selectedLocation.lon, tz: selectedLocation.timezone } : null);

            showLoading("Updating your profile...", 2000);
            saveAttemptRef.current++;

            try {
                // Build payload including structured birth location
                const payload = Object.fromEntries(Object.entries({
                    ...formData,
                    pob: formData.pob || formData.birthPlaceName,
                    birthPlaceName: formData.birthPlaceName || formData.pob,
                    birthLatitude: formData.birthLatitude,
                    birthLongitude: formData.birthLongitude,
                    birthTimezoneName: formData.birthTimezoneName,
                }).filter(([, value]) => value !== undefined && value !== '')) as Partial<typeof formData>;

                // --- DIAGNOSTIC LOG: pre-API call ---
                console.log('[ProfileClient.handleSubmit] Payload keys:', Object.keys(payload).filter(k => payload[k as keyof typeof payload] !== undefined && payload[k as keyof typeof payload] !== '').join(', '));
                console.log('[ProfileClient.handleSubmit] Payload birth fields:', {
                    dob: payload.dob, tob: payload.tob, pob: payload.pob,
                    birthLatitude: payload.birthLatitude, birthLongitude: payload.birthLongitude,
                    birthTimezoneName: payload.birthTimezoneName,
                    birthTimezoneOffsetAtBirth: payload.birthTimezoneOffsetAtBirth,
                });

                const response = await clientFetch('/api/user/profile', {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                // --- DIAGNOSTIC LOG: post-API call ---
                console.log('[ProfileClient.handleSubmit] API response - status:', response.status, 'ok:', response.ok);
                console.log('[ProfileClient.handleSubmit] API response - profileComplete:', data.profileComplete, 'requiresReanalysis:', data.requiresReanalysis);
                console.log('[ProfileClient.handleSubmit] API response - full keys:', Object.keys(data || {}).join(', '));

                if (!response.ok) {
                    // Handle DST conflict (409)
                    if (response.status === 409 && (data.dst_conflict || data.error?.includes('DST') || data.error?.includes('ambiguous'))) {
                        setDstConflictMessage(data.message || data.error || t('profile.page.errors.dstConflict'));
                        setDstRetryData(payload);
                        setShowDstDialog(true);
                        showLoading("", 0);
                        return;
                    }
                    // DPDP §9 age gate — backend rejects under-18 DOB (403). The
                    // code lives at data.detail.code (FastAPI) or data.code (flat),
                    // so check both. Surface it against the dob field, not a toast.
                    const ageCode = (data.detail?.code ?? data.code);
                    if (response.status === 403 && ageCode === 'underage_registration_blocked') {
                        const msg = data.detail?.error ?? data.error
                            ?? t('login.mustBe18') ?? 'You must be 18 or older to use Astra Mitra.';
                        setErrors((prev) => ({ ...prev, dob: msg }));
                        setTouched((prev) => ({ ...prev, dob: true }));
                        showLoading("", 0);
                        return;
                    }
                    throw new Error(data.error || t('profile.page.errors.updateFailed'));
                }

                // Update local context
                login(user?.email || '', formData);
                if (formData.language !== contextLanguage) {
                    setLanguage(formData.language as LanguageCode);
                }
                success(t('profile.page.messages.profileUpdated'));
            setHasChanges(false);
            
            // Refetch profile from backend to refresh auth state
            await refreshProfile();

            // Refresh the NextAuth `profileComplete` hint on the JWT so the
            // server-side onboarding gate (app/page.tsx) recognises this user
            // as complete and stops redirecting them back here. Onboarding
            // submits are validated to include all required birth fields, so
            // reaching here in onboarding mode means the profile is complete.
            if (data.profileComplete === true || isOnboarding) {
                try {
                    await updateAuthSession({ profileComplete: true });
                } catch (updateErr) {
                    console.warn('[ProfileClient.handleSubmit] session profileComplete update failed:', updateErr);
                }
            }

            // --- DIAGNOSTIC LOG: post-refresh ---
            console.log('[ProfileClient.handleSubmit] refreshProfile() completed');
            // The AuthContext will have updated profileComplete internally.
            // We log here to know we've reached this point successfully.

            // Trigger sign calculation if birth details are complete.
            // NOTE: The backend `sync-astrology` endpoint does NOT extract/save signs.
            // Signs (moonSign, sunSign, lagnaSign) are only persisted by `analyze-full`.
            // After analyze-full completes, the backend auto-saves signs to the DB.
            // We then re-fetch the profile to get the updated sign data.
            const hasBirthDetails = formData.dob && formData.tob && formData.pob;
            if (hasBirthDetails && data.requiresReanalysis) {
                clientFetch('/api/analyze-full', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ force_refresh: true })
                }).then(async (res) => {
                    if (res.ok) {
                        // Re-fetch profile to get the newly-calculated signs
                        await refreshProfile();
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        console.warn('Sign calculation (analyze-full) failed:', errData.error || errData.detail || 'Unknown error');
                    }
                }).catch(err => {
                    console.warn('Sign calculation (analyze-full) failed:', err);
                });
            }

            setTimeout(() => {
                showLoading("", 0);
                if (isOnboarding) {
                    const returnUrl = searchParams?.get('return') || '/';
                    // --- DIAGNOSTIC LOG: pre-redirect ---
                    console.log('[ProfileClient.handleSubmit] Redirecting to:', returnUrl);
                    console.log('[ProfileClient.handleSubmit] === SAVE ATTEMPT COMPLETE (redirecting) ===');
                    router.push(returnUrl);
                } else {
                    console.log('[ProfileClient.handleSubmit] === SAVE ATTEMPT COMPLETE (non-onboarding, no redirect) ===');
                }
            }, 500);

        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
            showLoading("", 0);
        }
    };

    const handleDstResolution = async (birthTimeFold: number) => {
        setShowDstDialog(false);
        if (!dstRetryData || !user?.email) return;

        showLoading("Updating your profile...", 2000);

        try {
            const payload = { ...dstRetryData, birthTimeFold };
            const response = await clientFetch('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Profile update failed after DST resolution.");
            }

            login(user?.email || '', dstRetryData);
            if (dstRetryData.language !== contextLanguage) {
                setLanguage(dstRetryData.language as LanguageCode);
            }
            success('Profile updated successfully!');
            setHasChanges(false);
            setDstRetryData(null);

            // Refetch profile to refresh auth state
            await refreshProfile();

            // Keep the JWT onboarding hint in sync (see handleSubmit note).
            if (data.profileComplete === true || isOnboarding) {
                try {
                    await updateAuthSession({ profileComplete: true });
                } catch (updateErr) {
                    console.warn('[ProfileClient.handleDstResolution] session profileComplete update failed:', updateErr);
                }
            }

            // Trigger sign calculation if needed
            const hasBirthDetails = dstRetryData.dob && dstRetryData.tob && dstRetryData.pob;
            if (hasBirthDetails && data.requiresReanalysis) {
                clientFetch('/api/analyze-full', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ force_refresh: true })
                }).then(async (res) => {
                    if (res.ok) {
                        await refreshProfile();
                    }
                }).catch(err => {
                    console.warn('Sign calculation after DST resolution failed:', err);
                });
            }

            setTimeout(() => {
                showLoading("", 0);
                if (isOnboarding) {
                    const returnUrl = searchParams?.get('return') || '/';
                    router.push(returnUrl);
                }
            }, 500);
        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
            showLoading("", 0);
        }
    };

    const handleReset = () => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                dob: user.dob || '',
                tob: user.tob || '',
                pob: user.pob || '',
                birthPlaceName: user.birthPlaceName || '',
                birthLatitude: nullToUndef(user.birthLatitude),
                birthLongitude: nullToUndef(user.birthLongitude),
                birthTimezoneName: user.birthTimezoneName || '',
                birthTimezoneOffsetAtBirth: nullToUndef(user.birthTimezoneOffsetAtBirth),
                phoneNumber: user.phoneNumber || '',
                gender: safeEnum(user.gender, VALID_GENDERS),
                maritalStatus: safeEnum(user.maritalStatus, VALID_MARITAL_STATUSES),
                occupation: safeEnum(user.occupation, VALID_OCCUPATIONS),
                language: user.language || contextLanguage || 'en',
                preferences: {
                    horoscope: user.preferences?.horoscope ?? true,
                    notifications: user.preferences?.notifications ?? false
                }
            });
            // Reset selected location
            if (typeof user.birthLatitude === 'number' && typeof user.birthLongitude === 'number' && user.birthTimezoneName) {
                setSelectedLocation({
                    name: user.birthPlaceName || user.pob || '',
                    lat: user.birthLatitude,
                    lon: user.birthLongitude,
                    timezone: user.birthTimezoneName,
                });
            } else {
                setSelectedLocation(null);
            }
            setErrors({ firstName: '', lastName: '', dob: '', tob: '', pob: '', phoneNumber: '' });
            setTouched({ firstName: false, lastName: false, dob: false, tob: false, pob: false, phoneNumber: false });
            setHasChanges(false);
        }
    };

    return (
        <main className={`min-h-[calc(100dvh-var(--navbar-height,64px))] px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start relative overflow-x-hidden bg-[var(--bg)] ${isOnboarding ? 'py-4 sm:py-6 lg:py-4' : 'py-6 sm:py-10 lg:py-6'}`}>
            {ToastContainer}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-secondary/5 blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none"></div>

            {/* Centered page header (only when NOT onboarding) */}
            {!isOnboarding && (
                <div className="w-full max-w-7xl mx-auto text-center mb-6 mt-2 relative z-10">
                    <div className="inline-flex items-center justify-center rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 cosmic-glow w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-5">
                        <ProfileImageUpload size={56} />
                    </div>
                    <h1 className="font-headline font-bold text-primary text-3xl sm:text-4xl mb-2">{t('profile.page.title')}</h1>
                    <p className="font-body text-on-surface-variant max-w-md mx-auto text-sm">
                        {t('profile.page.description')}
                    </p>
                    {/* Credit Balance */}
                    {paywallLoaded && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <a href="/plans" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/15 hover:bg-secondary/15 hover:border-secondary/25 transition-all">
                                <Wallet className="w-4 h-4 text-secondary" />
                                <span className="text-[11px] font-bold text-secondary tabular-nums">{totalCredits ?? 0} {t('plans.naviCredits')}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                                  (tier || '').toLowerCase() === 'premium'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    : (tier || '').toLowerCase() === 'pro'
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border-slate-500/25'
                                }`}>{tier?.toUpperCase() || 'FREE'}</span>
                                <ArrowRight className="w-3 h-3 text-secondary/40" />
                            </a>
                        </div>
                    )}
                </div>
            )}

            <div className={`w-full mx-auto relative z-10 ${isOnboarding ? 'max-w-6xl flex flex-col lg:flex-row gap-6 lg:gap-10 items-start' : 'max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-6 xl:gap-8 items-start'}`}>
                {isOnboarding && (
                    <aside className="hidden lg:block w-full lg:w-[360px] lg:sticky lg:top-24 shrink-0">
                    <div className="text-left p-5 sm:p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 rounded-[28px] animate-in fade-in slide-in-from-left-4 duration-500 space-y-5">
                        {/* ========= DESKTOP FULL SIDEBAR ========= */}
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
                                        {t('profile.onboarding.sidebar.title')}
                                    </h2>
                                    <p className="text-[12px] sm:text-sm text-on-surface-variant/80 mt-1 leading-relaxed">
                                        {t('profile.onboarding.sidebar.description')}
                                    </p>
                                </div>
                            </div>

                            {/* Visual checklist: all 4 steps */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary/70">
                                    {t('profile.onboarding.sidebar.checklistLabel')}
                                </p>
                                <div className="space-y-1.5">
                                    {onboardingSteps.map((step, i) => (
                                        <div
                                            key={step.id}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10 animate-in fade-in slide-in-from-left-2 duration-300"
                                            style={{ animationDelay: `${i * 80}ms` }}
                                        >
                                            {step.complete ? (
                                                <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <span className={`text-[13px] font-semibold ${step.complete ? 'text-on-surface-variant/50 line-through' : 'text-primary'}`}>
                                                    {step.label}
                                                </span>
                                                {!step.complete && (
                                                    <span className="text-[11px] text-on-surface-variant/50 block">
                                                        — {step.hint}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* All complete — celebratory state */}
                            {profileProgress.complete === profileProgress.total && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <p className="text-[12px] font-medium text-green-300">
                                        {t('profile.onboarding.sidebar.completeMessage')}
                                    </p>
                                </div>
                            )}

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/50">
                                        {t('profile.onboarding.sidebar.progressLabel')}
                                    </span>
                                    <span className="text-[10px] font-bold text-secondary tabular-nums">
                                        {profileProgress.complete} of {profileProgress.total}
                                    </span>
                                </div>
                                <div className="h-2 bg-surface-variant/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-secondary/60 to-secondary rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${(profileProgress.complete / profileProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    </aside>
                )}

                <div className={isOnboarding ? 'flex-1 min-w-0' : 'min-w-0'}>
                {isOnboarding && (
                    <div className="text-center mb-4 xl:mb-5">
                        <div className="inline-flex items-center justify-center rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 cosmic-glow w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4">
                            <ProfileImageUpload size={64} className="[&_div]:border-0" />
                        </div>
                        <h1 className="font-headline font-bold text-primary text-2xl sm:text-3xl mb-1">{t('profile.page.title')}</h1>
                        <p className="font-body text-on-surface-variant max-w-md mx-auto text-xs sm:text-sm">
                            {t('profile.page.description')}
                        </p>
                    </div>
                )}

                <Card padding="md" className={`!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20 ${isOnboarding ? '!p-4 sm:!p-5 xl:!p-6' : ''}`} hoverable={false}>
                    <form onSubmit={handleSubmit} className={isOnboarding ? "space-y-4 xl:space-y-3" : "space-y-6 xl:space-y-5"}>
                        <div className={`grid grid-cols-1 xl:grid-cols-2 ${isOnboarding ? 'gap-4 xl:gap-3' : 'gap-6 xl:gap-4'}`}>
                            <Input
                                label={t('profile.fields.email')}
                                type="email"
                                icon={<Mail className="w-4 h-4" />}
                                value={user?.email || ''}
                                readOnly
                                disabled
                                helperText={t('profile.fields.emailHelper')}
                            />
                            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isOnboarding ? 'gap-4 xl:gap-3' : 'gap-6 xl:gap-4'}`}>
                                <Input
                                    label={t('profile.fields.firstName')}
                                    placeholder={t('profile.fields.firstNamePlaceholder')}
                                    type="text"
                                    icon={<User className="w-4 h-4" />}
                                    value={formData.firstName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        updateFormData({ firstName: value });
                                        if (touched.firstName) {
                                            setErrors({...errors, firstName: validateField('firstName', value)});
                                        }
                                    }}
                                    onBlur={() => {
                                        setTouched({...touched, firstName: true});
                                        setErrors({...errors, firstName: validateField('firstName', formData.firstName)});
                                    }}
                                    error={touched.firstName ? errors.firstName : ''}
                                    helperText={t('profile.fields.firstNameHelper')}
                                    required
                                />
                                <Input
                                    label={t('profile.fields.lastName')}
                                    placeholder={t('profile.fields.lastNamePlaceholder')}
                                    type="text"
                                    icon={<User className="w-4 h-4" />}
                                    value={formData.lastName}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        updateFormData({ lastName: value });
                                        if (touched.lastName) {
                                            setErrors({...errors, lastName: validateField('lastName', value)});
                                        }
                                    }}
                                    onBlur={() => {
                                        setTouched({...touched, lastName: true});
                                        setErrors({...errors, lastName: validateField('lastName', formData.lastName)});
                                    }}
                                    error={touched.lastName ? errors.lastName : ''}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isOnboarding ? 'gap-4 xl:gap-3' : 'gap-6 xl:gap-4'}`}>
                            <Input
                                label={t('profile.fields.dateOfBirth')}
                                type="date"
                                icon={<Calendar className="w-4 h-4" />}
                                value={formData.dob}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateFormData({ dob: value });
                                    if (touched.dob) {
                                        setErrors({...errors, dob: validateField('dob', value)});
                                    }
                                }}
                                onBlur={() => {
                                    setTouched({...touched, dob: true});
                                    setErrors({...errors, dob: validateField('dob', formData.dob)});
                                }}
                                error={touched.dob ? errors.dob : ''}
                                helperText={t('profile.fields.dateOfBirthHelper')}
                                required
                            />
                            <Input
                                label={t('profile.fields.timeOfBirth')}
                                type="time"
                                icon={<Clock className="w-4 h-4" />}
                                value={formData.tob}
                                onChange={(e) => updateFormData({ tob: e.target.value })}
                                helperText={t('profile.fields.timeOfBirthHelper')}
                                required
                            />
                        </div>

                        <div className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)] ${isOnboarding ? 'gap-4 xl:gap-3' : 'gap-6 xl:gap-4'}`}>
                            <LocationSearch
                                label={t('profile.fields.placeOfBirth')}
                                placeholder={t('profile.fields.placeOfBirthPlaceholder')}
                                value={formData.pob || formData.birthPlaceName}
                                required
                                confirmedLocation={selectedLocation}
                                onSelect={(location: LocationResult) => {
                                    updateFormData({
                                        pob: location.name,
                                        birthPlaceName: location.name,
                                        birthLatitude: location.lat,
                                        birthLongitude: location.lon,
                                        birthTimezoneName: location.timezone,
                                    });
                                    setSelectedLocation(location);
                                    if (touched.pob) {
                                        setErrors({...errors, pob: ''});
                                    }
                                }}
                                onChange={(text: string) => {
                                    updateFormData({
                                        pob: text,
                                        // Clear structured data when user changes text without selecting
                                        birthPlaceName: selectedLocation?.name === text ? selectedLocation.name : '',
                                        birthLatitude: selectedLocation?.name === text ? selectedLocation.lat : undefined,
                                        birthLongitude: selectedLocation?.name === text ? selectedLocation.lon : undefined,
                                        birthTimezoneName: selectedLocation?.name === text ? selectedLocation.timezone : '',
                                    });
                                    if (!selectedLocation || selectedLocation.name !== text) {
                                        setSelectedLocation(null);
                                    }
                                    if (touched.pob) {
                                        setErrors({...errors, pob: validateField('pob', text)});
                                    }
                                }}
                                error={touched.pob ? errors.pob : ''}
                                helperText={t('profile.fields.placeOfBirthHelper')}
                            />

                            <Input
                                label={t('profile.fields.phoneNumber')}
                                placeholder={t('profile.fields.phoneNumberPlaceholder')}
                                type="tel"
                                icon={<Phone className="w-4 h-4" />}
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateFormData({ phoneNumber: value });
                                }}
                                helperText={t('profile.fields.phoneNumberHelper')}
                            />
                        </div>

                        <div className={`grid grid-cols-1 sm:grid-cols-3 ${isOnboarding ? 'gap-4 xl:gap-3' : 'gap-6 xl:gap-4'}`}>
                            <div className="space-y-1">
                                <label htmlFor="gender" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    {t('profile.fields.gender')}
                                </label>
                                <select
                                    id="gender"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.gender}
                                    onChange={(e) => updateFormData({ gender: e.target.value })}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">{t('profile.fields.genderPlaceholder')}</option>
                                    <option value="male" className="bg-surface text-on-surface">{t('profile.fields.genderOptions.male')}</option>
                                    <option value="female" className="bg-surface text-on-surface">{t('profile.fields.genderOptions.female')}</option>
                                    <option value="other" className="bg-surface text-on-surface">{t('profile.fields.genderOptions.other')}</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">{t('profile.fields.genderOptions.notSpecified')}</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="maritalStatus" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    {t('profile.fields.maritalStatus')}
                                </label>
                                <select
                                    id="maritalStatus"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.maritalStatus}
                                    onChange={(e) => updateFormData({ maritalStatus: e.target.value })}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">{t('profile.fields.maritalStatusPlaceholder')}</option>
                                    <option value="single" className="bg-surface text-on-surface">{t('profile.fields.maritalOptions.single')}</option>
                                    <option value="married" className="bg-surface text-on-surface">{t('profile.fields.maritalOptions.married')}</option>
                                    <option value="divorced" className="bg-surface text-on-surface">{t('profile.fields.maritalOptions.divorced')}</option>
                                    <option value="widowed" className="bg-surface text-on-surface">{t('profile.fields.maritalOptions.widowed')}</option>
                                    <option value="separated" className="bg-surface text-on-surface">{t('profile.fields.maritalOptions.separated')}</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">{t('profile.fields.maritalOptions.notSpecified')}</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="occupation" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    {t('profile.fields.occupation')}
                                </label>
                                <select
                                    id="occupation"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.occupation}
                                    onChange={(e) => updateFormData({ occupation: e.target.value })}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">{t('profile.fields.occupationPlaceholder')}</option>
                                    <option value="student" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.student')}</option>
                                    <option value="business" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.business')}</option>
                                    <option value="employed" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.employed')}</option>
                                    <option value="homemaker" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.homemaker')}</option>
                                    <option value="retired" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.retired')}</option>
                                    <option value="unemployed" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.unemployed')}</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">{t('profile.fields.occupationOptions.notSpecified')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Language & Preferences Section */}
                        <div className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] ${isOnboarding ? 'gap-4 xl:gap-3' : 'gap-6 xl:gap-4'} pt-4 border-t border-outline-variant/10`}>
                            <div className={isOnboarding ? 'space-y-2' : 'space-y-4'}>
                                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-secondary" /> {t('profile.preferences.language')}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-3 gap-2">
                                    {availableLanguages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            type="button"
                                            onClick={() => {
                                                updateFormData({ language: lang.code });
                                            }}
                                            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all gap-1 ${
                                                formData.language === lang.code 
                                                    ? 'bg-secondary/10 border-secondary text-secondary' 
                                                    : 'bg-surface-variant/20 border-outline-variant/10 text-primary/40 hover:bg-surface-variant/40'
                                            }`}
                                        >
                                            <span className="text-[12px] normal-case">{lang.nativeName}</span>
                                            <span className="opacity-50 text-[8px]">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={isOnboarding ? 'space-y-2' : 'space-y-4'}>
                                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-secondary" /> {t('profile.preferences.cosmicPreferences')}
                                </label>
                                <div className={`grid grid-cols-1 ${isOnboarding ? 'gap-2 xl:gap-1.5' : 'gap-3 xl:gap-2'}`}>
                                    <button
                                        type="button"
                                        onClick={() => updateFormData(current => ({
                                            ...current,
                                            preferences: { ...current.preferences, horoscope: !current.preferences.horoscope }
                                        }))}
                                        className={`flex items-center justify-between rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all group ${isOnboarding ? 'p-3 xl:p-2.5' : 'p-4'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${formData.preferences.horoscope ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                                <Sparkles size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-primary">{t('profile.preferences.horoscopeTitle')}</p>
                                                <p className="text-[10px] text-on-surface-variant/60">{t('profile.preferences.horoscopeDescription')}</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.preferences.horoscope ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.preferences.horoscope ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updateFormData(current => ({
                                            ...current,
                                            preferences: { ...current.preferences, notifications: !current.preferences.notifications }
                                        }))}
                                        className={`flex items-center justify-between rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all group ${isOnboarding ? 'p-3 xl:p-2.5' : 'p-4'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${formData.preferences.notifications ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                                <Bell size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-primary">{t('profile.preferences.notificationsTitle')}</p>
                                                <p className="text-[10px] text-on-surface-variant/60">{t('profile.preferences.notificationsDescription')}</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.preferences.notifications ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.preferences.notifications ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* DPDP Consent Reaffirmation */}
                        <div className={`border-t border-outline-variant/12 ${isOnboarding ? 'pt-3' : 'pt-4'}`}>
                          <p className="text-[10px] sm:text-xs text-primary/50 leading-relaxed mb-2">
                            By saving, you reaffirm your consent for Astra Mitra to process your personal data — including birth details — for Vedic astrological computations, AI-powered readings, and personalized insights as described in our{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-bold">
                              Privacy Policy
                            </a>
                            {' '}(DPDP Act, 2023). You may withdraw consent at any time via{' '}
                            <a href="/profile/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-bold">
                              Privacy Settings
                            </a>.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                className={isOnboarding
                                    ? 'bg-primary text-secondary hover:bg-primary/90 hover:-translate-y-0.5 shadow-xl shadow-secondary/20 border border-secondary/20'
                                    : 'shadow-xl shadow-secondary/20'
                                }
                                disabled={isLoading || (!hasChanges && !isOnboarding)}
                                loading={isLoading}
                                leftIcon={!isLoading ? <Save className="w-4 h-4" /> : undefined}
                                rightIcon={!isLoading && isOnboarding ? <ArrowRight className="w-4 h-4" /> : undefined}
                            >
                                {isLoading ? t('profile.page.buttons.updating') : (isOnboarding ? t('profile.page.buttons.saveAndContinue') : t('profile.page.buttons.saveChanges'))}
                            </Button>
                            {hasChanges && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    fullWidth
                                    size="lg"
                                    onClick={handleReset}
                                    disabled={isLoading}
                                    leftIcon={<RotateCcw className="w-4 h-4" />}
                                >
                                    {t('profile.page.buttons.reset')}
                                </Button>
                            )}
                            {!hasChanges && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    fullWidth
                                    size="lg"
                                    onClick={() => router.push('/')}
                                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                                >
                                    {t('profile.page.buttons.backToHome')}
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>
                </div>

                {!isOnboarding && (
                    <aside className="w-full xl:sticky xl:top-24 shrink-0 space-y-6">
                        {/* Security Section Card */}
                        <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-xl font-headline font-bold text-primary mb-2">{t('profile.page.securitySection.title')}</h3>
                                    <p className="text-sm text-on-surface-variant">{t('profile.page.securitySection.description')}</p>
                                </div>

                                <div className="pt-4 border-t border-outline-variant/10 space-y-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        fullWidth
                                        onClick={() => router.push('/profile/security')}
                                    >
                                        {t('profile.page.securitySection.button')}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Discovery Settings Card */}
                        <ProfileDiscoverySettings />
                    </aside>
                )}
            </div>        

            {/* DST Conflict Dialog */}
            {showDstDialog && (
                <DstConflictDialog
                    message={dstConflictMessage}
                    onSelectFirst={() => handleDstResolution(0)}
                    onSelectSecond={() => handleDstResolution(1)}
                    onCancel={() => {
                        setShowDstDialog(false);
                        setDstRetryData(null);
                    }}
                />
            )}
        </main>
    );
}
