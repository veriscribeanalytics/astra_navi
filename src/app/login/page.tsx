'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/useToast';
import { 
    Mail, Lock, User, Calendar, MapPin, 
    Clock, Smartphone, ArrowRight, Eye, EyeOff,
    Sparkles, ShieldCheck
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

const LoginPage = () => {
    const router = useRouter();
    const { success, error, ToastContainer } = useToast();
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Handle NextAuth errors from query params
    React.useEffect(() => {
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
            // Use a slight delay to ensure toast container is ready
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
                        email,
                        password,
                        name,
                        dob,
                        tob,
                        pob,
                        phoneNumber: phone
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

                success("Welcome back, Seeker.");
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden">
            <ToastContainer />
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[100px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[460px] relative z-10"
            >
                <Card padding="lg" className="!rounded-[32px] sm:!rounded-[48px] border-outline-variant/20 bg-surface/80 backdrop-blur-xl shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-surface border border-outline-variant/20 mb-6 shadow-inner group">
                            <Image 
                                src="/icons/logo.jpeg" 
                                alt="AstraNavi" 
                                width={48} 
                                height={48} 
                                className="rounded-2xl group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">
                            {isRegister ? "Join the " : "Welcome to "}
                            <span className="text-secondary italic">AstraNavi</span>
                        </h1>
                        <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.2em] mt-2">
                            {isRegister ? "Inscribe your celestial identity" : "Align with your cosmic path"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                        icon={<User size={18} />}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Date of Birth"
                                            type="date"
                                            icon={<Calendar size={18} />}
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            required
                                        />
                                        <Input
                                            label="Time of Birth"
                                            type="time"
                                            icon={<Clock size={18} />}
                                            value={tob}
                                            onChange={(e) => setTob(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Place of Birth"
                                        placeholder="City, Country"
                                        icon={<MapPin size={18} />}
                                        value={pob}
                                        onChange={(e) => setPob(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Phone (Optional)"
                                        placeholder="+91 98765 43210"
                                        icon={<Smartphone size={18} />}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Input
                            label="Celestial Address (Email)"
                            type="email"
                            placeholder="you@cosmic.com"
                            icon={<Mail size={18} />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Celestial Key (Password)"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                icon={<Lock size={18} />}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 bottom-3.5 text-on-surface-variant/40 hover:text-secondary transition-colors"
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
                                    icon={<ShieldCheck size={18} />}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 bottom-3.5 text-on-surface-variant/40 hover:text-secondary transition-colors"
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
                            className="mt-6 !rounded-[18px] font-bold text-[14px] uppercase tracking-widest gap-2"
                        >
                            {isRegister ? "Register Identity" : "Access Destiny"}
                            {!isLoading && <ArrowRight size={18} />}
                        </Button>
                    </form>

                    <div className="mt-6 flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-outline-variant/20" />
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-bold">Or Connect Via</span>
                        <div className="h-[1px] flex-1 bg-outline-variant/20" />
                    </div>

                    <div className="mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            fullWidth
                            onClick={() => signIn('google', { callbackUrl: '/' })}
                            className="border border-outline-variant/20 hover:bg-surface-variant/30 !rounded-[18px]"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </Button>
                    </div>

                    <div className="mt-6 sm:mt-8 text-center text-xs font-body text-on-surface-variant">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setPassword('');
                                setConfirmPassword('');
                                setShowPassword(false);
                                setShowConfirmPassword(false);
                            }}
                            className="text-secondary font-bold hover:underline ml-1 uppercase tracking-widest transition-colors"
                        >
                            {isRegister ? "Login here" : "Create one"}
                        </button>
                    </div>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                   <div className="flex items-center gap-2">
                       <Sparkles size={12} className="text-secondary" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Ancient Wisdom</span>
                   </div>
                   <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
                   <div className="flex items-center gap-2">
                       <ShieldCheck size={12} className="text-emerald-500" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Secure Access</span>
                   </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
