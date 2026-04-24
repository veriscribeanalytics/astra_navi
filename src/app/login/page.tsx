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

                showLoading("Aligning your celestial path...", 2000);
                setTimeout(() => {
                    router.push('/');
                    router.refresh();
                    success("Welcome back, Seeker.");
                }, 2000);
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
        <div ref={containerRef} className="min-h-screen bg-[#0b071a] flex items-center justify-center relative overflow-hidden font-body">
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

            {/* Background elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/auth-bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b071a] via-transparent to-[#0b071a] opacity-80" />
                
                {/* Floating particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-secondary/30 rounded-full"
                        initial={{ 
                            x: Math.random() * 100 + "%", 
                            y: Math.random() * 100 + "%",
                            opacity: Math.random() * 0.5
                        }}
                        animate={{ 
                            y: [null, "-20%"],
                            opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{ 
                            duration: Math.random() * 10 + 10, 
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            <div className="container mx-auto max-w-6xl px-4 relative z-10 flex flex-col lg:flex-row items-stretch justify-center gap-0 overflow-hidden rounded-[40px] shadow-2xl border border-white/5">
                
                {/* Left Panel: Brand & Vision (Desktop) */}
                <div className="hidden lg:flex flex-1 bg-surface-variant/5 backdrop-blur-md p-12 flex-col justify-between relative overflow-hidden border-r border-white/5">
                    <div className="absolute inset-0 z-0 opacity-10">
                        <Orbit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] text-secondary animate-orbit" />
                        <Orbit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] text-secondary/50 animate-orbit-reverse" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <Image src="/icons/logo.jpeg" alt="AstraNavi" width={44} height={44} className="rounded-xl shadow-lg" />
                            <span className="text-2xl font-headline font-bold tracking-tight text-white">AstraNavi</span>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-4xl xl:text-5xl font-headline font-bold text-white leading-tight">
                                Unlock your <span className="text-secondary italic">Celestial</span> Blueprint.
                            </h2>
                            <p className="text-lg text-white/60 max-w-md leading-relaxed">
                                Merging the ancient precision of Vedic Jyotish with advanced Artificial Intelligence to illuminate your path.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="h-20 flex flex-col justify-end">
                            <AnimatePresence mode="wait">
                                <motion.p 
                                    key={quoteIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm font-medium italic text-secondary/80"
                                >
                                    &quot;{quotes[quoteIndex]}&quot;
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <div className="mt-8 flex gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-2xl font-bold text-white">12</span>
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Rashis</span>
                            </div>
                            <div className="w-[1px] bg-white/10" />
                            <div className="flex flex-col gap-1">
                                <span className="text-2xl font-bold text-white">27</span>
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Nakshatras</span>
                            </div>
                            <div className="w-[1px] bg-white/10" />
                            <div className="flex flex-col gap-1">
                                <span className="text-2xl font-bold text-white">36</span>
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Points Guna</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Auth Form */}
                <div className="w-full lg:w-[500px] bg-surface p-8 sm:p-12 flex flex-col">
                    <div className="lg:hidden flex justify-center mb-8">
                         <div className="flex flex-col items-center gap-3">
                            <Image src="/icons/logo.jpeg" alt="AstraNavi" width={48} height={48} className="rounded-xl" />
                            <h2 className="text-xl font-headline font-bold text-white">AstraNavi</h2>
                         </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-headline font-bold text-white mb-2">
                            {isRegister ? "Begin Journey" : "Return to Stars"}
                        </h1>
                        <p className="text-sm text-white/40 font-medium">
                            {isRegister ? "Join the circle of celestial seekers." : "Align with your cosmic path again."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        <AnimatePresence mode="popLayout">
                            {isRegister && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <Input
                                        label="Full Name"
                                        placeholder="Arjun Sharma"
                                        icon={<User size={18} className="text-secondary" />}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Date of Birth"
                                            type="date"
                                            icon={<Calendar size={18} className="text-secondary" />}
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            required
                                            className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                                        />
                                        <Input
                                            label="Time of Birth"
                                            type="time"
                                            icon={<Clock size={18} className="text-secondary" />}
                                            value={tob}
                                            onChange={(e) => setTob(e.target.value)}
                                            required
                                            className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                                        />
                                    </div>
                                    <Input
                                        label="Place of Birth"
                                        placeholder="City, Country"
                                        icon={<MapPin size={18} className="text-secondary" />}
                                        value={pob}
                                        onChange={(e) => setPob(e.target.value)}
                                        required
                                        className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Input
                            label="Celestial Address"
                            type="email"
                            placeholder="you@cosmic.com"
                            icon={<Mail size={18} className="text-secondary" />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                        />

                        <div className="relative">
                            <Input
                                label="Celestial Key"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                icon={<Lock size={18} className="text-secondary" />}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 bottom-3.5 text-white/30 hover:text-secondary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {isRegister && (
                            <div className="relative">
                                <Input
                                    label="Confirm Celestial Key"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    icon={<ShieldCheck size={18} className="text-secondary" />}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="!bg-white/5 !border-white/10 focus:!border-secondary/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 bottom-3.5 text-white/30 hover:text-secondary transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            loading={isLoading}
                            className="mt-6 !rounded-2xl font-bold text-[14px] uppercase tracking-widest gap-2 gold-gradient shadow-xl shadow-secondary/10"
                        >
                            {isRegister ? "Initiate Cycle" : "Enter Ascendant"}
                            {!isLoading && <ArrowRight size={18} />}
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-[1px] flex-1 bg-white/5" />
                            <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Divine Connection</span>
                            <div className="h-[1px] flex-1 bg-white/5" />
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            fullWidth
                            onClick={() => signIn('google', { callbackUrl: '/' })}
                            className="!bg-white/5 border border-white/10 hover:bg-white/10 !rounded-2xl text-white/70"
                        >
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setPassword('');
                                    setConfirmPassword('');
                                    setShowPassword(false);
                                    setShowConfirmPassword(false);
                                }}
                                className="text-xs font-bold uppercase tracking-[0.15em] text-white/30 hover:text-secondary transition-colors"
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

            {/* Bottom badging */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-8 opacity-20 pointer-events-none whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Advanced AI Models</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Vedic Authenticity</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                    <Star size={12} className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Personalized Insights</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
