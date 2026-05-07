'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast, useTranslation } from '@/hooks';
import { LanguageCode } from '@/locales';
import { useAuth } from '@/context/AuthContext';
import {
    Mail, Lock, ArrowRight, Eye,
    Sparkles, ShieldCheck, Orbit,
    User as UserIcon, Calendar, Clock, MapPin, 
    Bell, ArrowLeft, Phone
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const LoginContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { success, error: showError, ToastContainer } = useToast();
    const { showLoading } = useAuth();
    const { t, language: currentLanguage, setLanguage, availableLanguages } = useTranslation();
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [lockedRemaining, setLockedRemaining] = useState<number>(0);

    // Registration Steps State
    const [registerStep, setRegisterStep] = useState(0); // 0: Account, 1: Personal, 2: Birth, 3: Preferences
    const [registerData, setRegisterData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        gender: '',
        phoneNumber: '',
        maritalStatus: '',
        occupation: '',
        dob: '',
        tob: '',
        pob: '',
        language: currentLanguage || 'en',
        preferences: { horoscope: true, notifications: false },
    });

    // Login states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Update registerData language when context language changes
    useEffect(() => {
        setRegisterData(prev => ({ ...prev, language: currentLanguage }));
    }, [currentLanguage]);

    // Handle Lockout Countdown
    useEffect(() => {
        if (!lockedUntil) return;
        
        const interval = setInterval(() => {
            const now = Date.now();
            if (now >= lockedUntil) {
                setLockedUntil(null);
                setLockedRemaining(0);
                clearInterval(interval);
            } else {
                setLockedRemaining(Math.ceil((lockedUntil - now) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lockedUntil]);

    // Handle NextAuth errors from query params
    useEffect(() => {
        const authError = searchParams.get('error');
        if (authError) {
            const errorMessages: Record<string, string> = {
                'Signin': 'Try signing in with a different account.',
                'OAuthSignin': 'Try signing in with a different account.',
                'OAuthCallback': 'Try signing in with a different account.',
                'OAuthCreateAccount': 'Try signing in with a different account.',
                'EmailCreateAccount': 'Try signing in with a different account.',
                'Callback': 'Try signing in with a different account.',
                'OAuthAccountNotLinked': 'To confirm your identity, please sign in with the same account you used originally.',
                'EmailSignin': 'Check your email address.',
                'CredentialsSignin': t('login.invalidCredentials'),
                'Configuration': t('login.networkError'),
                'SessionRequired': 'Please sign in to access this page.',
                'SessionExpired': 'Your session has expired. Please sign in again.',
                'default': 'An error occurred. Please try again.'
            };

            const message = errorMessages[authError] || authError;
            const timer = setTimeout(() => {
                showError(message);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchParams, showError, t]);

    const validateRegisterStep = () => {
        if (registerStep === 0) {
            if (!registerData.email.includes('@')) return "Invalid email address.";
            if (registerData.password.length < 10) return "Password must be at least 10 characters.";
            if (registerData.password !== registerData.confirmPassword) return "Passwords do not match.";
            // Password complexity check
            if (!/[A-Z]/.test(registerData.password)) return "Must contain at least one uppercase letter.";
            if (!/[a-z]/.test(registerData.password)) return "Must contain at least one lowercase letter.";
            if (!/[0-9]/.test(registerData.password)) return "Must contain at least one number.";
            if (!/[^A-Za-z0-9]/.test(registerData.password)) return "Must contain at least one special character.";
        } else if (registerStep === 1) {
            if (registerData.name && registerData.name.length < 2) return "Name must be at least 2 characters.";
        } else if (registerStep === 2) {
            if (registerData.dob) {
                const dob = new Date(registerData.dob);
                if (dob > new Date()) return "Date of birth cannot be in the future.";
            }
            if (registerData.tob && !/^\d{2}:\d{2}$/.test(registerData.tob)) {
                return "Time format must be HH:MM.";
            }
            if (registerData.pob && registerData.pob.length < 2) return "Place name must be at least 2 characters.";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isRegister && registerStep < 3) {
            const error = validateRegisterStep();
            if (error) {
                showError(error);
                return;
            }
            setRegisterStep(prev => prev + 1);
            return;
        }

        setIsLoading(true);

        try {
            if (isRegister) {
                const { confirmPassword: _confirmPassword, ...submitData } = registerData;
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                });

                const data = await res.json();
                if (!res.ok) {
                    const errorMsg = data.error || data.detail || t('login.registrationFailed');
                    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
                }

                success(t('login.accountCreated'));
                
                // If preferences are changed from default, save them via profile API
                if (submitData.preferences) {
                    try {
                        await fetch('/api/user/profile', {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${data.accessToken}` 
                            },
                            body: JSON.stringify({ preferences: submitData.preferences })
                        });
                    } catch (e) {
                        console.error("Failed to save preferences:", e);
                    }
                }
                
                // Auto-login after registration using returned tokens
                const result = await signIn('credentials', {
                    redirect: false,
                    isRegistration: "true",
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    expiresIn: data.expiresIn,
                });

                if (result?.error) throw new Error(result.error);

                showLoading(t('login.signingYouIn'), 1500);
                setTimeout(() => {
                    router.push(data.profileComplete ? '/?login=success' : '/profile?onboarding=true');
                }, 1500);
            } else {
                const result = await signIn('credentials', {
                    redirect: false,
                    email,
                    password,
                });

                if (result?.error) {
                    if (result.error.toLowerCase().includes('locked')) {
                        throw new Error('ACCOUNT_LOCKED');
                    }
                    const errorMsg = result.error === 'CredentialsSignin'
                        ? t('login.invalidCredentials')
                        : result.error === 'Configuration'
                            ? t('login.networkError')
                            : result.error;
                    throw new Error(errorMsg);
                }

                showLoading(t('login.signingYouIn'), 1500);
                setTimeout(() => {
                    let callbackUrl = searchParams.get('callbackUrl') || '/?login=success';
                    
                    // Bug 2 Fix: Strip callbackUrl from the destination if it exists
                    if (callbackUrl.includes('callbackUrl=')) {
                        try {
                            const url = new URL(callbackUrl, window.location.origin);
                            url.searchParams.delete('callbackUrl');
                            callbackUrl = url.pathname + url.search + url.hash;
                        } catch (_) {
                            // Fallback if URL parsing fails
                            callbackUrl = callbackUrl.split('?')[0];
                        }
                    }
                    
                    router.push(callbackUrl);
                }, 1500);
            }
        } catch (err: unknown) {
            console.error("Auth error:", err);
            const message = err instanceof Error ? err.message : String(err);
            if (message === 'ACCOUNT_LOCKED') {
                const lockoutEndTime = Date.now() + 15 * 60 * 1000;
                setLockedUntil(lockoutEndTime);
                setLockedRemaining(15 * 60);
                showError("Account locked due to too many failed attempts.");
            } else {
                showError(message || "An unexpected cosmic error occurred.");
            }
            setIsLoading(false);
        }
    };

    const quotes = [
        "The stars do not pull us, they guide us.",
        "Your destiny is a map, let Navi be your compass.",
        "Align with the cosmic frequency of your true self.",
        "In the silence of the heavens, your story is written."
    ];
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [quotes.length]);

    const stepTitles = [
        t('login.stepAccount') || "Create Your Account",
        t('login.stepPersonal') || "Tell Us About Yourself",
        t('login.stepBirth') || "Your Cosmic Blueprint",
        t('login.stepPreferences') || "Personalize Your Experience"
    ];

    return (
        <div ref={containerRef} className="min-h-[calc(100dvh-var(--navbar-height,64px))] w-full flex items-center justify-center relative overflow-hidden font-body bg-transparent">
            {ToastContainer}

            {/* Interactive Mouse Glow */}
            <div
                className="pointer-events-none absolute z-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle, var(--secondary) 0%, transparent 70%)`,
                    left: mousePos.x - 300,
                    top: mousePos.y - 300,
                }}
            />

            <div className="w-full h-full relative z-10 flex flex-col lg:flex-row items-stretch">

                {/* Left Panel: Brand & Vision (Desktop) */}
                <div className="hidden lg:flex flex-1 p-12 xl:p-20 flex-col relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-10">
                        <Orbit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-secondary animate-orbit" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        {/* Static Top: Logo */}
                        <div className="flex items-center gap-3 mb-auto">
                            <Image src="/icons/logo.jpeg" alt="AstraNavi" width={36} height={36} style={{ width: "auto", height: "auto" }} className="rounded-lg shadow-lg" />
                            <span className="text-xl font-headline font-bold tracking-tight text-primary">AstraNavi</span>
                        </div>

                        {/* Static Center: Brand Promise */}
                        <div className="flex-1 flex flex-col justify-center py-12">
                            <div className="space-y-4">
                                <h2 className="text-3xl xl:text-4xl font-headline font-bold text-primary leading-tight">
                                    {t('login.blueprintTitle').split(' ').map((word, i) => (
                                        word === 'Personal' ? <span key={i} className="text-secondary italic"> {word} </span> : i === 0 ? word : ` ${word}`
                                    ))}
                                </h2>
                                <p className="text-base text-on-surface-variant max-w-sm leading-relaxed">
                                    {t('login.blueprintDesc')}
                                </p>
                            </div>
                        </div>

                        {/* Static Bottom: Stats & Quotes */}
                        <div className="mt-auto pt-8">
                            <div className="h-16 flex flex-col justify-end">
                                <AnimatePresence mode="wait">
                                    <motion.p 
                                        key={quoteIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-[13px] font-medium italic text-secondary"
                                    >
                                        &quot;{quotes[quoteIndex]}&quot;
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                            <div className="mt-6 flex gap-6">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-bold text-primary">12</span>
                                    <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">{t('login.statRashis')}</span>
                                </div>
                                <div className="w-[1px] bg-outline-variant/30" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-bold text-primary">27</span>
                                    <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">{t('login.statNakshatras')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Auth Form */}
                <div className="w-full lg:w-[550px] xl:w-[650px] flex flex-col h-full overflow-hidden relative">
                    {/* STATIC Header */}
                    <div className="p-4 sm:p-6 pb-2 shrink-0">
                        <div className="lg:hidden flex justify-center mb-4">
                            <div className="flex flex-col items-center gap-1">
                                <Image src="/icons/logo.jpeg" alt="AstraNavi" width={32} height={32} style={{ width: "auto", height: "auto" }} className="rounded-lg" />
                                <h2 className="text-base font-headline font-bold text-primary">AstraNavi</h2>
                            </div>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary mb-0.5">
                            {isRegister ? stepTitles[registerStep] : t('login.signIn')}
                        </h1>
                        <p className="text-[11px] sm:text-xs text-on-surface-variant/60 font-medium">
                            {isRegister ? t('login.joinCelestialJourney') : t('login.welcomeBack')}
                        </p>
                        
                        {isRegister && (
                            <div className="flex gap-1.5 mt-4">
                                {[0, 1, 2, 3].map((s) => (
                                    <div 
                                        key={s} 
                                        className={`h-1 rounded-full transition-all duration-300 ${s === registerStep ? 'w-8 bg-secondary' : 'w-2 bg-outline-variant/30'}`} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Body - Only internal card changes */}
                    <div className="flex-1 p-4 sm:p-6 pt-0 overflow-hidden flex flex-col justify-center">
                        <div className="bg-surface/5 dark:bg-white/[0.01] backdrop-blur-md rounded-[28px] border border-outline-variant/20 dark:border-white/5 p-5 sm:p-7 shadow-2xl">
                            <form onSubmit={handleSubmit} className={isRegister ? "space-y-4" : "space-y-5"}>
                                <AnimatePresence mode="wait">
                                    {isRegister ? (
                                        <motion.div
                                            key={`register-step-${registerStep}`}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="space-y-4"
                                        >
                                            {registerStep === 0 && (
                                                <>
                                                    <Input 
                                                        type="email" 
                                                        placeholder={t('login.email')} 
                                                        icon={<Mail size={14} className="text-secondary" />} 
                                                        value={registerData.email} 
                                                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})} 
                                                        required 
                                                    />
                                                    <div className="relative">
                                                        <Input 
                                                            type={showPassword ? "text" : "password"} 
                                                            placeholder={t('login.password')} 
                                                            icon={<Lock size={14} className="text-secondary" />} 
                                                            value={registerData.password} 
                                                            onChange={(e) => setRegisterData({...registerData, password: e.target.value})} 
                                                            required 
                                                        />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={14} /></button>
                                                    </div>
                                                    <div className="relative">
                                                        <Input 
                                                            type={showConfirmPassword ? "text" : "password"} 
                                                            placeholder={t('login.confirmPassword')} 
                                                            icon={<ShieldCheck size={14} className="text-secondary" />} 
                                                            value={registerData.confirmPassword} 
                                                            onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})} 
                                                            required 
                                                        />
                                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={14} /></button>
                                                    </div>
                                                </>
                                            )}

                                            {registerStep === 1 && (
                                                <>
                                                    <Input 
                                                        placeholder={t('login.fullName') || "Full Name"} 
                                                        icon={<UserIcon size={14} className="text-secondary" />} 
                                                        value={registerData.name} 
                                                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})} 
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">Gender</label>
                                                            <select 
                                                                className="w-full h-11 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                                                value={registerData.gender}
                                                                onChange={(e) => setRegisterData({...registerData, gender: e.target.value})}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                                <option value="other">Other</option>
                                                                <option value="Not Specified">Not Specified</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">Status</label>
                                                            <select 
                                                                className="w-full h-11 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                                                value={registerData.maritalStatus}
                                                                onChange={(e) => setRegisterData({...registerData, maritalStatus: e.target.value})}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="single">Single</option>
                                                                <option value="married">Married</option>
                                                                <option value="divorced">Divorced</option>
                                                                <option value="unmarried">Unmarried</option>
                                                                <option value="not married">Not Married</option>
                                                                <option value="wed">Wed</option>
                                                                <option value="separated">Separated</option>
                                                                <option value="widowed">Widowed</option>
                                                                <option value="widow">Widow</option>
                                                                <option value="widower">Widower</option>
                                                                <option value="engaged">Engaged</option>
                                                                <option value="relationship">Relationship</option>
                                                                <option value="in relationship">In Relationship</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <Input 
                                                        placeholder="Phone Number" 
                                                        icon={<Phone size={14} className="text-secondary" />} 
                                                        value={registerData.phoneNumber} 
                                                        onChange={(e) => setRegisterData({...registerData, phoneNumber: e.target.value})} 
                                                    />
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">Occupation</label>
                                                        <select 
                                                            className="w-full h-11 bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-4 text-sm text-on-surface focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                                                            value={registerData.occupation}
                                                            onChange={(e) => setRegisterData({...registerData, occupation: e.target.value})}
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="student">Student</option>
                                                            <option value="studying">Studying</option>
                                                            <option value="business">Business</option>
                                                            <option value="employed">Employed</option>
                                                            <option value="homemaker">Homemaker</option>
                                                            <option value="retired">Retired</option>
                                                            <option value="jobseeker">Job Seeker</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {registerStep === 2 && (
                                                <>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">{t('login.dob') || "Date of Birth"}</label>
                                                        <Input 
                                                            type="date" 
                                                            icon={<Calendar size={14} className="text-secondary" />} 
                                                            value={registerData.dob} 
                                                            onChange={(e) => setRegisterData({...registerData, dob: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">{t('login.tob') || "Time of Birth"}</label>
                                                        <Input 
                                                            type="time" 
                                                            icon={<Clock size={14} className="text-secondary" />} 
                                                            value={registerData.tob} 
                                                            onChange={(e) => setRegisterData({...registerData, tob: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">{t('login.pob') || "Place of Birth"}</label>
                                                        <Input 
                                                            placeholder="City, Country" 
                                                            icon={<MapPin size={14} className="text-secondary" />} 
                                                            value={registerData.pob} 
                                                            onChange={(e) => setRegisterData({...registerData, pob: e.target.value})} 
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {registerStep === 3 && (
                                                <div className="space-y-6 py-2">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">{t('login.preferredLanguage') || "Preferred Language"}</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {availableLanguages.map((lang) => (
                                                                <button
                                                                    key={lang.code}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setLanguage(lang.code as LanguageCode);
                                                                        setRegisterData({...registerData, language: lang.code});
                                                                    }}
                                                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all ${
                                                                        registerData.language === lang.code 
                                                                            ? 'bg-secondary/10 border-secondary text-secondary' 
                                                                            : 'bg-surface-variant/20 border-outline-variant/10 text-primary/40 hover:bg-surface-variant/40'
                                                                    }`}
                                                                >
                                                                    {lang.nativeName}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 px-1">Preferences</label>
                                                        <div className="space-y-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setRegisterData({
                                                                    ...registerData, 
                                                                    preferences: { ...registerData.preferences, horoscope: !registerData.preferences.horoscope }
                                                                })}
                                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-1.5 rounded-lg ${registerData.preferences.horoscope ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-primary/40'}`}>
                                                                        <Sparkles size={14} />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-primary/70">{t('login.receiveHoroscope') || "Receive daily horoscope"}</span>
                                                                </div>
                                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${registerData.preferences.horoscope ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${registerData.preferences.horoscope ? 'left-5' : 'left-1'}`} />
                                                                </div>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setRegisterData({
                                                                    ...registerData, 
                                                                    preferences: { ...registerData.preferences, notifications: !registerData.preferences.notifications }
                                                                })}
                                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10 hover:bg-surface-variant/40 transition-all"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-1.5 rounded-lg ${registerData.preferences.notifications ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-primary/40'}`}>
                                                                        <Bell size={14} />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-primary/70">{t('login.enableNotifications') || "Enable notifications"}</span>
                                                                </div>
                                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${registerData.preferences.notifications ? 'bg-secondary' : 'bg-on-surface-variant/20'}`}>
                                                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${registerData.preferences.notifications ? 'left-5' : 'left-1'}`} />
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="login-fields"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-5"
                                        >
                                            <Input 
                                                type="email" 
                                                placeholder={t('login.email')} 
                                                icon={<Mail size={16} className="text-secondary" />} 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                required 
                                            />
                                            <div className="relative">
                                                <Input 
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder={t('login.password')} 
                                                    icon={<Lock size={16} className="text-secondary" />} 
                                                    value={password} 
                                                    onChange={(e) => setPassword(e.target.value)} 
                                                    required 
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={16} /></button>
                                            </div>
                                            <div className="flex justify-end">
                                                <button 
                                                    type="button" 
                                                    onClick={() => router.push('/forgot-password')} 
                                                    className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors"
                                                >
                                                    Forgot Password?
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex gap-3">
                                    {isRegister && registerStep > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setRegisterStep(prev => prev - 1)}
                                            className="!rounded-xl px-4 border border-outline-variant/20"
                                        >
                                            <ArrowLeft size={16} />
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        fullWidth
                                        size={isRegister ? "md" : "lg"}
                                        loading={isLoading}
                                        disabled={!!lockedUntil}
                                        className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
                                    >
                                        {!!lockedUntil 
                                            ? `Locked (${Math.floor(lockedRemaining / 60)}:${(lockedRemaining % 60).toString().padStart(2, '0')})`
                                            : isRegister 
                                                ? (registerStep === 3 ? t('login.createAccount') : t('login.next') || "Continue") 
                                                : t('login.accessDashboard')
                                        }
                                        {!isLoading && !lockedUntil && <ArrowRight size={14} />}
                                    </Button>
                                </div>
                            </form>

                            <div className="flex items-center gap-4 py-3">
                                <div className="h-[1px] flex-1 bg-outline-variant/10" />
                                <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/20 font-bold">{t('login.secureConnection')}</span>
                                <div className="h-[1px] flex-1 bg-outline-variant/10" />
                            </div>



                            <div className="text-center pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegister(!isRegister);
                                        setRegisterStep(0);
                                        setEmail('');
                                        setPassword('');
                                        setShowPassword(false);
                                        setShowConfirmPassword(false);
                                    }}
                                    className="text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/30 hover:text-secondary transition-colors"
                                >
                                    {isRegister ? (
                                        <>{t('login.alreadyHaveAccount')} <span className="text-secondary ml-1">{t('login.signIn')}</span></>
                                    ) : (
                                        <>{t('login.dontHaveAccount')} <span className="text-secondary ml-1">{t('login.createAccount')}</span></>
                                    )}
                                </button>
                        </div>
                    </div>
                </div>
            </div>

                {/* Bottom badging (Minimal) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-20 pointer-events-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={10} className="text-secondary" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-primary">AI x Jyotish</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={10} className="text-secondary" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoginPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
};

export default LoginPage;