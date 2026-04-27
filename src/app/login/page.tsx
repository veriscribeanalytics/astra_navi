'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import {
    Mail, Lock, User, Calendar, MapPin,
    Clock, Smartphone, ArrowRight, Eye, EyeOff,
    Sparkles, ShieldCheck, Orbit, Compass,
    Star, Heart, MessageSquare, Globe
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

const LoginPage = () => {
    const router = useRouter();
    const { success, error, ToastContainer } = useToast();
    const { showLoading } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [tob, setTob] = useState('');
    const [pob, setPob] = useState('');
    const [phone, setPhone] = useState('');

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

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

    // Handle NextAuth errors from query params
    useEffect(() => {
        if (!searchParams) return;
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
                'CredentialsSignin': 'Invalid celestial credentials.',
                'SessionRequired': 'Please sign in to access this page.',
                'default': 'The stars are obscured. Please try again.'
            };

            const message = errorMessages[authError] || errorMessages.default;
            const timer = setTimeout(() => {
                error(message);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchParams, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isRegister) {
                if (password !== confirmPassword) {
                    throw new Error("The celestial keys (passwords) do not match.");
                }

                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email, password, name, dob, tob, pob, phoneNumber: phone
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "The stars are obscured. Registration failed.");

                success("Your celestial identity has been inscribed. You may now login.");
                setIsRegister(false);
            } else {
                const result = await signIn('credentials', {
                    redirect: false,
                    email,
                    password,
                });

                if (result?.error) {
                    throw new Error(result.error === 'CredentialsSignin'
                        ? "Invalid celestial credentials."
                        : result.error);
                }

                showLoading("Aligning your celestial path...", 1500);
                setTimeout(() => {
                    const callbackUrl = searchParams?.get('callbackUrl') || '/?login=success';
                    router.push(callbackUrl);
                }, 1500);
            }
        } catch (err: any) {
            error(err.message);
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
    }, []);

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
                                    Unlock your <span className="text-secondary italic">Celestial</span> Blueprint.
                                </h2>
                                <p className="text-base text-on-surface-variant max-w-sm leading-relaxed">
                                    Merging ancient Vedic Jyotish with Artificial Intelligence to illuminate your path.
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
                                    <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">Rashis</span>
                                </div>
                                <div className="w-[1px] bg-outline-variant/30" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-bold text-primary">27</span>
                                    <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">Nakshatras</span>
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
                            Celestial Portal
                        </h1>
                        <p className="text-[11px] sm:text-xs text-on-surface-variant/60 font-medium">
                            Align with your cosmic path and unlock ancient wisdom.
                        </p>
                    </div>

                    {/* Form Body - Only internal card changes */}
                    <div className="flex-1 p-4 sm:p-6 pt-0 overflow-hidden flex flex-col justify-center">
                        <div className="bg-surface/5 dark:bg-white/[0.01] backdrop-blur-md rounded-[28px] border border-outline-variant/20 dark:border-white/5 p-5 sm:p-7 shadow-2xl">
                            <form onSubmit={handleSubmit} className={isRegister ? "space-y-3" : "space-y-5"}>
                                <AnimatePresence mode="wait">
                                    {isRegister ? (
                                        <motion.div
                                            key="register-fields"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-3"
                                        >
                                            <Input placeholder="Full Name" icon={<User size={14} className="text-secondary" />} value={name} onChange={(e) => setName(e.target.value)} required />
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input type="date" icon={<Calendar size={14} className="text-secondary" />} value={dob} onChange={(e) => setDob(e.target.value)} required />
                                                <Input type="time" icon={<Clock size={14} className="text-secondary" />} value={tob} onChange={(e) => setTob(e.target.value)} required />
                                            </div>
                                            <Input placeholder="Place of Birth" icon={<MapPin size={14} className="text-secondary" />} value={pob} onChange={(e) => setPob(e.target.value)} required />
                                            <Input type="email" placeholder="Celestial Address (Email)" icon={<Mail size={14} className="text-secondary" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
                                            <div className="relative">
                                                <Input type={showPassword ? "text" : "password"} placeholder="Celestial Key" icon={<Lock size={14} className="text-secondary" />} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={14} /></button>
                                            </div>
                                            <div className="relative">
                                                <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Key" icon={<ShieldCheck size={14} className="text-secondary" />} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={14} /></button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="login-fields"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-5"
                                        >
                                            <Input type="email" placeholder="Celestial Address" icon={<Mail size={16} className="text-secondary" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
                                            <div className="relative">
                                                <Input type={showPassword ? "text" : "password"} placeholder="Celestial Key" icon={<Lock size={16} className="text-secondary" />} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={16} /></button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    type="submit"
                                    fullWidth
                                    size={isRegister ? "md" : "lg"}
                                    loading={isLoading}
                                    className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg mt-2"
                                >
                                    {isRegister ? "Inscribe Identity" : "Enter Ascendant"}
                                    {!isLoading && <ArrowRight size={14} />}
                                </Button>
                            </form>

                            <div className="flex items-center gap-4 py-3">
                                <div className="h-[1px] flex-1 bg-outline-variant/10" />
                                <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/20 font-bold">Divine Connection</span>
                                <div className="h-[1px] flex-1 bg-outline-variant/10" />
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                fullWidth
                                onClick={() => {
                                    const callbackUrl = searchParams?.get('callbackUrl') || '/';
                                    signIn('google', { callbackUrl });
                                }}
                                className="bg-surface/50 dark:bg-white/5 border border-outline-variant/20 dark:border-white/10 hover:bg-surface dark:hover:bg-white/10 !rounded-xl text-on-surface-variant/60 text-xs py-2 h-10"
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                                </svg>
                                Google
                            </Button>

                            <div className="text-center pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsRegister(!isRegister);
                                        setPassword('');
                                        setConfirmPassword('');
                                        setShowPassword(false);
                                        setShowConfirmPassword(false);
                                    }}
                                    className="text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/30 hover:text-secondary transition-colors"
                                >
                                    {isRegister ? (
                                        <>Already have an identity? <span className="text-secondary ml-1">Login</span></>
                                    ) : (
                                        <>No celestial records? <span className="text-secondary ml-1">Create Account</span></>
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

export default LoginPage;