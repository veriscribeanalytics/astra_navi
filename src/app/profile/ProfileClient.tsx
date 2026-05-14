'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LocationSearch, { LocationResult } from '@/components/ui/LocationSearch';
import DstConflictDialog from '@/components/ui/DstConflictDialog';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { useToast, useTranslation } from '@/hooks';
import { LanguageCode } from '@/locales';
import { clientFetch } from '@/lib/apiClient';
import { 
    User, Calendar, Clock,
    Save, ArrowLeft, RotateCcw, Sparkles,
    Globe, Bell, Phone, Mail, CheckCircle2,
    ArrowRight, ChevronDown, Circle, Wallet
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
    const { tier, totalCredits, isLoaded: paywallLoaded } = usePaywallContext();
    const { language: contextLanguage, setLanguage, availableLanguages, t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams?.get('onboarding') === 'true';
    const { ToastContainer, success, error } = useToast();

    const [formData, setFormData] = useState({
        name: '',
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
        name: '',
        dob: '',
        tob: '',
        pob: '',
        phoneNumber: ''
    });
    const [touched, setTouched] = useState({
        name: false,
        dob: false,
        tob: false,
        pob: false,
        phoneNumber: false
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false); // mobile expand/collapse

    const updateFormData = (updates: Partial<typeof formData> | ((current: typeof formData) => typeof formData)) => {
        setHasChanges(true);
        setFormData(current => typeof updates === 'function' ? updates(current) : { ...current, ...updates });
    };

    useEffect(() => {
        if (!user || hasChanges) return;

        setFormData({
            name: user.name || '',
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

        setErrors({ name: '', dob: '', tob: '', pob: '', phoneNumber: '' });
        setTouched({ name: false, dob: false, tob: false, pob: false, phoneNumber: false });
    }, [user, contextLanguage, hasChanges]);

    // --- Compute onboarding steps: all 4 with per-step status for visual checklist ---
    const onboardingSteps = useMemo(() => {
        const hasLocation = !!user?.pob && typeof user?.birthLatitude === 'number' && typeof user?.birthLongitude === 'number' && !!user?.birthTimezoneName;
        return [
            { id: 'name' as const,   label: 'Full Name',               hint: 'Your name as per birth certificate',                     complete: !!user?.name },
            { id: 'dob'  as const,   label: 'Date of Birth',           hint: 'Determines your planetary positions (Nakshatra)',       complete: !!user?.dob },
            { id: 'tob'  as const,   label: 'Time of Birth',           hint: 'Pinpoints your ascendant (Lagna) and house cusps',      complete: !!user?.tob },
            { id: 'pob'  as const,   label: 'Accurate Birth Location', hint: 'Search your city & select from the dropdown for precise coordinates', complete: hasLocation },
        ];
    }, [user]);
    const profileProgress = useMemo(() => {
        const complete = onboardingSteps.filter(s => s.complete).length;
        return { complete, total: onboardingSteps.length };
    }, [onboardingSteps]);
    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';
        
        switch (field) {
            case 'name':
                if (!value.trim()) {
                    break;
                }
                if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                } else if (value.trim().length > 100) {
                    error = 'Name is too long';
                }
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    const today = new Date();
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 150);

                    if (dob > today) {
                        error = 'Birth date cannot be in the future';
                    } else if (dob < hundredYearsAgo) {
                        error = 'Please enter a valid birth date';
                    }
                }
                break;
            case 'pob':
                if (!value.trim()) {
                    break;
                }
                if (value.trim().length < 2) {
                    error = 'Please enter a valid place';
                } else if (value.trim().length > 100) {
                    error = 'Place name is too long';
                }
                break;
        }
        
        return error;
    };

    const validateForm = () => {
        const newErrors = {
            name: validateField('name', formData.name),
            dob: validateField('dob', formData.dob),
            tob: '',
            pob: validateField('pob', formData.pob),
            phoneNumber: ''
        };

        // In onboarding mode, name/dob/tob/pob are all required,
        // and structured birth location (latitude/longitude/timezone) is also required
        if (isOnboarding) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.dob) newErrors.dob = 'Date of birth is required';
            if (!formData.tob) newErrors.tob = 'Time of birth is required';
            if (!formData.pob.trim()) newErrors.pob = 'Place of birth is required';
            // Structured birth location validation
            if (!selectedLocation && (formData.birthLatitude === undefined || formData.birthLongitude === undefined || !formData.birthTimezoneName)) {
                newErrors.pob = 'Please select your exact birth location from the search results';
            }
        } else if (formData.pob.trim() && (formData.birthLatitude === undefined || formData.birthLongitude === undefined || !formData.birthTimezoneName)) {
            newErrors.pob = 'Please select your exact birth location from the search results';
        }

        setErrors(newErrors);
        setTouched({ name: true, dob: true, tob: true, pob: true, phoneNumber: true });
        return !Object.values(newErrors).some(e => e !== '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            error('Please fix the errors before saving');
            return;
        }

        if (!user?.email) {
            error('No email found in session. Please logout and login again.');
            return;
        }

        // --- DIAGNOSTIC LOG: entry point ---
        console.log('[ProfileClient.handleSubmit] === SAVE ATTEMPT START ===');
        console.log('[ProfileClient.handleSubmit] hasChanges:', hasChanges);
        console.log('[ProfileClient.handleSubmit] isOnboarding:', isOnboarding);
        console.log('[ProfileClient.handleSubmit] formData keys present:', {
            name: !!formData.name, dob: !!formData.dob, tob: !!formData.tob, pob: !!formData.pob,
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
                    setDstConflictMessage(data.message || data.error || 'Your birth time falls during a DST transition. Please select which occurrence was your actual birth time.');
                    setDstRetryData(payload);
                    setShowDstDialog(true);
                    showLoading("", 0);
                    return;
                }
                throw new Error(data.error || "Update failed. Please try again.");
            }

            // Update local context
            login(user?.email || '', formData);
            if (formData.language !== contextLanguage) {
                setLanguage(formData.language as LanguageCode);
            }
            success('Profile updated successfully!');
            setHasChanges(false);
            
            // Refetch profile from backend to refresh auth state
            await refreshProfile();

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
                name: user.name || '',
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
            setErrors({ name: '', dob: '', tob: '', pob: '', phoneNumber: '' });
            setTouched({ name: false, dob: false, tob: false, pob: false, phoneNumber: false });
            setHasChanges(false);
        }
    };

    return (
        <main className="min-h-[calc(100dvh-var(--navbar-height,64px))] py-6 sm:py-10 px-4 flex flex-col items-center justify-start relative overflow-x-hidden bg-[var(--bg)]">
            {ToastContainer}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-secondary/5 blur-[60px] sm:blur-[100px] rounded-full z-0 pointer-events-none"></div>
            
            <div className={`w-full mx-auto relative z-10 ${isOnboarding ? 'max-w-6xl flex flex-col lg:flex-row gap-6 lg:gap-10 items-start' : 'max-w-xl'}`}>
                {isOnboarding && (
                    <aside className="w-full lg:w-[360px] lg:sticky lg:top-24 shrink-0">
                    <div className="text-left p-5 sm:p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 rounded-[28px] animate-in fade-in slide-in-from-left-4 duration-500 space-y-5">
                        {/* ========= MOBILE COMPACT BANNER (hidden on desktop) ========= */}
                        <div className="lg:hidden">
                            {/* Compact status strip — always visible */}
                            <button
                                type="button"
                                onClick={() => setShowChecklist(v => !v)}
                                className="w-full flex items-center gap-3 text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/25 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-primary truncate">
                                        {profileProgress.complete === profileProgress.total
                                            ? 'All set! Your celestial profile is complete ✨'
                                            : `${profileProgress.total - profileProgress.complete} step${profileProgress.total - profileProgress.complete !== 1 ? 's' : ''} remaining`}
                                    </p>
                                    <p className="text-[10px] text-on-surface-variant/60">
                                        {profileProgress.complete === profileProgress.total
                                            ? 'Press Save & Continue to return'
                                            : 'Tap to see what\'s needed'}
                                    </p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-secondary/60 transition-transform duration-200 ${showChecklist ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Expandable checklist drawer */}
                            <div className={`grid transition-all duration-300 ease-out ${showChecklist ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="space-y-2">
                                        {onboardingSteps.map((step, i) => (
                                            <div
                                                key={step.id}
                                                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-variant/20 border border-outline-variant/10 animate-in fade-in slide-in-from-top-2 duration-300"
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                {step.complete ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                                                ) : (
                                                    <Circle className="w-3.5 h-3.5 text-secondary/40 mt-0.5 shrink-0 animate-pulse" />
                                                )}
                                                <div className="min-w-0">
                                                    <span className={`text-[12px] font-semibold ${step.complete ? 'text-on-surface-variant/50 line-through' : 'text-primary'}`}>
                                                        {step.label}
                                                    </span>
                                                    {!step.complete && (
                                                        <span className="text-[10px] text-on-surface-variant/50 block truncate">
                                                            {step.hint}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Mini progress bar inside expanded drawer */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex-1 h-1.5 bg-surface-variant/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-secondary/60 to-secondary rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${(profileProgress.complete / profileProgress.total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-secondary tabular-nums shrink-0">
                                            {profileProgress.complete}/{profileProgress.total}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========= DESKTOP FULL SIDEBAR (hidden on mobile) ========= */}
                        <div className="hidden lg:block space-y-5">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
                                        Complete Your Celestial Identity
                                    </h2>
                                    <p className="text-[12px] sm:text-sm text-on-surface-variant/80 mt-1 leading-relaxed">
                                        Your birth details are the foundation of every cosmic insight — 
                                        they unlock personalized horoscopes, kundli analysis, and 
                                        AI-powered Vedic readings.
                                    </p>
                                </div>
                            </div>

                            {/* Visual checklist: all 4 steps */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-secondary/70">
                                    Profile Checklist
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
                                        All set! Your celestial profile is complete. Press Save &amp; Continue to return to the dashboard.
                                    </p>
                                </div>
                            )}

                            {/* Progress bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/50">
                                        Profile Completion
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

                <div className={isOnboarding ? 'flex-1 min-w-0' : ''}>
                <div className={`text-center ${isOnboarding ? 'mb-6 mt-2' : 'mb-10 mt-8'}`}>
                    <div className={`inline-flex items-center justify-center rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 cosmic-glow ${isOnboarding ? 'w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4' : 'w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6'}`}>
                        <User className={`text-secondary ${isOnboarding ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-7 h-7 sm:w-8 sm:h-8'}`} />
                    </div>
                    <h1 className={`font-headline font-bold text-primary ${isOnboarding ? 'text-2xl sm:text-3xl mb-2' : 'text-3xl sm:text-4xl mb-3'}`}>User Profile</h1>
                    <p className={`font-body text-on-surface-variant max-w-md mx-auto ${isOnboarding ? 'text-xs sm:text-sm' : 'text-sm'}`}>
                        Manage your birth details to ensure your personalized readings are always accurate.
                    </p>
                    {/* Credit Balance — only shown when NOT in onboarding */}
                    {!isOnboarding && paywallLoaded && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <a href="/plans" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/15 hover:bg-secondary/15 hover:border-secondary/25 transition-all">
                                <Wallet className="w-4 h-4 text-secondary" />
                                <span className="text-[11px] font-bold text-secondary tabular-nums">{totalCredits ?? 0} {t('plans.naviCredits')}</span>
                                <span className="text-[8px] font-bold text-secondary/50 uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/15">{tier?.toUpperCase() || 'FREE'}</span>
                                <ArrowRight className="w-3 h-3 text-secondary/40" />
                            </a>
                        </div>
                    )}
                </div>

                <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20" hoverable={false}>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 gap-6">
                            <Input 
                                label="Email Address"
                                type="email"
                                icon={<Mail className="w-4 h-4" />}
                                value={user?.email || ''}
                                readOnly
                                disabled
                                helperText="Your email cannot be changed"
                            />
                            <Input 
                                label="Full Name"
                                placeholder="Enter your full name" 
                                type="text"
                                icon={<User className="w-4 h-4" />}
                                value={formData.name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateFormData({ name: value });
                                    if (touched.name) {
                                        setErrors({...errors, name: validateField('name', value)});
                                    }
                                }}
                                onBlur={() => {
                                    setTouched({...touched, name: true});
                                    setErrors({...errors, name: validateField('name', formData.name)});
                                }}
                                error={touched.name ? errors.name : ''}
                                helperText="Your full name as per birth certificate"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input 
                                label="Date of Birth"
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
                                helperText="Your birth date"
                                required
                            />
                            <Input 
                                label="Time of Birth"
                                type="time"
                                icon={<Clock className="w-4 h-4" />}
                                value={formData.tob}
                                onChange={(e) => updateFormData({ tob: e.target.value })}
                                helperText="Exact time for precision"
                                required
                            />
                        </div>
                        
                        <LocationSearch 
                            label="Place of Birth"
                            placeholder="Search city, e.g. Delhi" 
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
                            helperText="Search and select your exact birth location"
                        />

                        <Input 
                            label="Phone Number"
                            placeholder="+1234567890" 
                            type="tel"
                            icon={<Phone className="w-4 h-4" />} 
                            value={formData.phoneNumber}
                            onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({ phoneNumber: value });
                            }}
                            helperText="Optional phone number"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label htmlFor="gender" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    Gender
                                </label>
                                <select 
                                    id="gender"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.gender}
                                    onChange={(e) => updateFormData({ gender: e.target.value })}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">Select Gender</option>
                                    <option value="male" className="bg-surface text-on-surface">Male</option>
                                    <option value="female" className="bg-surface text-on-surface">Female</option>
                                    <option value="other" className="bg-surface text-on-surface">Other</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">Not Specified</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="maritalStatus" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    Marital Status
                                </label>
                                <select 
                                    id="maritalStatus"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.maritalStatus}
                                    onChange={(e) => updateFormData({ maritalStatus: e.target.value })}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">Select Status</option>
                                    <option value="single" className="bg-surface text-on-surface">Single</option>
                                    <option value="married" className="bg-surface text-on-surface">Married</option>
                                    <option value="divorced" className="bg-surface text-on-surface">Divorced</option>
                                    <option value="widowed" className="bg-surface text-on-surface">Widowed</option>
                                    <option value="separated" className="bg-surface text-on-surface">Separated</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">Prefer not to say</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="occupation" className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-2 block px-1">
                                    Occupation
                                </label>
                                <select 
                                    id="occupation"
                                    className="w-full h-12 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                    value={formData.occupation}
                                    onChange={(e) => updateFormData({ occupation: e.target.value })}
                                >
                                    <option value="" disabled className="bg-surface text-on-surface">Select Occupation</option>
                                    <option value="student" className="bg-surface text-on-surface">Student</option>
                                    <option value="business" className="bg-surface text-on-surface">Business Owner</option>
                                    <option value="employed" className="bg-surface text-on-surface">Employed / Salaried</option>
                                    <option value="homemaker" className="bg-surface text-on-surface">Homemaker</option>
                                    <option value="retired" className="bg-surface text-on-surface">Retired</option>
                                    <option value="unemployed" className="bg-surface text-on-surface">Unemployed</option>
                                    <option value="Not Specified" className="bg-surface text-on-surface">Prefer not to say</option>
                                </select>
                            </div>
                        </div>

                        {/* Language & Preferences Section */}
                        <div className="space-y-8 pt-4 border-t border-outline-variant/10">
                            <div className="space-y-4">
                                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-secondary" /> Preferred Language
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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

                            <div className="space-y-4">
                                <label className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant/70 block px-1 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-secondary" /> Cosmic Preferences
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => updateFormData(current => ({
                                            ...current,
                                            preferences: { ...current.preferences, horoscope: !current.preferences.horoscope }
                                        }))}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${formData.preferences.horoscope ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                                <Sparkles size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-primary">Daily Horoscope</p>
                                                <p className="text-[10px] text-on-surface-variant/60">Receive daily cosmic insights</p>
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
                                        className="flex items-center justify-between p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${formData.preferences.notifications ? 'bg-secondary/20 text-secondary' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>
                                                <Bell size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-primary">Notifications</p>
                                                <p className="text-[10px] text-on-surface-variant/60">Alerts for planetary transits</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.preferences.notifications ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${formData.preferences.notifications ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
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
                                {isLoading ? 'Updating...' : (isOnboarding ? 'Save & Continue to Dashboard' : 'Save Changes')}
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
                                    Reset
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
                                    Back to Home
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {!isOnboarding && (
                    <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20 mt-8" hoverable={false}>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-headline font-bold text-primary mb-2">Security Settings</h3>
                                <p className="text-sm text-on-surface-variant">Manage your password and active sessions.</p>
                            </div>
                            
                            <div className="pt-4 border-t border-outline-variant/10 space-y-4">
                                <Button 
                                    type="button" 
                                    variant="ghost"
                                    fullWidth
                                    onClick={() => router.push('/profile/security')}
                                >
                                    Manage Security Settings
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
                </div>
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
