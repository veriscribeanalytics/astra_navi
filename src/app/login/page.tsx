'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Sparkles, User, Lock, Eye, EyeOff, 
    ArrowRight, UserPlus, LogIn, Mail,
    Verified
} from 'lucide-react';

export default function LoginPage() {
    const { isLoggedIn, showLoading } = useAuth();
    const { success, error, ToastContainer } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl');

    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    // Redirect if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            const decodedUrl = callbackUrl ? decodeURIComponent(callbackUrl) : null;
            const isAuthPage = decodedUrl?.includes('/login') || decodedUrl?.includes('/register');
            
            if (decodedUrl && !isAuthPage) {
                router.push(decodedUrl);
            } else {
                router.push('/chat');
            }
        }
    }, [isLoggedIn, callbackUrl, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isRegister && password !== confirmPassword) {
            error("Celestial bodies are out of alignment! Passwords don't match.");
            return;
        }

        if (password.length < 8) {
            error("Password must be at least 8 characters long");
            return;
        }

        // Trigger the premium celestial loader
        const loadingMessage = isRegister ? "Inscribing your celestial coordinates..." : "Aligning your celestial path...";
        showLoading(loadingMessage, 3000);
        setIsLoading(true);
        
        try {
            if (isRegister) {
                // Check if there are pending birth details from the Hero section
                const pendingDataStr = typeof window !== 'undefined' ? localStorage.getItem('astranavi_pending_birth_details') : null;
                let profileData = {};
                
                if (pendingDataStr) {
                    try {
                        profileData = JSON.parse(pendingDataStr);
                    } catch (e) {
                        // Silently ignore invalid JSON
                    }
                }

                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email, 
                        password,
                        ...profileData
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "The stars are obscured. Please try again.");
                }

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('astranavi_pending_birth_details');
                }
            }

            // Perform NextAuth sign in
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error === 'CredentialsSignin' ? "Invalid celestial credentials." : result.error);
            }

            success(isRegister ? 'Account created successfully!' : 'Welcome back!');
            
        } catch (err: any) {
            error(err.message);
            // Hide loading if error occurs
            showLoading("", 0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl: callbackUrl || '/chat' });
    };

    return (
        <main className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 bg-[var(--bg)]">
            <ToastContainer />
            <div className="w-full max-w-md relative">
                {/* Background Cosmic Glows */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />

                <Card className="glass-panel p-8 sm:p-10 relative z-10 border-outline-variant/10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-6 cosmic-glow">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isRegister ? 'register' : 'login'}
                                    initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {isRegister ? (
                                        <UserPlus className="w-8 h-8 text-secondary" />
                                    ) : (
                                        <LogIn className="w-8 h-8 text-secondary" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <h2 className="text-3xl font-headline font-bold text-primary mb-2">
                            {isRegister ? "Join AstraNavi" : "Welcome Back"}
                        </h2>
                        <p className="text-sm text-on-surface-variant/60 font-body">
                            {isRegister ? "Begin your personalized celestial journey." : "Realign your path with the stars."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <Input 
                                label="Celestial Email" 
                                type="email" 
                                placeholder="seeker@cosmos.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                icon={<Mail className="w-4 h-4" />}
                            />
                            
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <Input 
                                        label="Access Key" 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                        icon={<Lock className="w-4 h-4" />}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-[38px] text-on-surface-variant/60 hover:text-secondary transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {!isRegister && (
                                    <div className="flex justify-end">
                                        <span 
                                            onClick={() => success("Password recovery is currently offline. Please contact support@astranavi.com")}
                                            className="text-[10px] text-secondary hover:underline cursor-help font-bold tracking-wider uppercase"
                                        >
                                            Access Problems?
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isRegister && (
                            <div className="relative">
                                <Input 
                                    label="Confirm Access Key" 
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={confirmPassword && password !== confirmPassword ? "Passwords don't match" : ''}
                                    required 
                                    icon={<Verified className="w-4 h-4" />}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-[38px] text-on-surface-variant/60 hover:text-secondary transition-colors"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            fullWidth 
                            size="lg" 
                            className="mt-3 sm:mt-4 shadow-lg shadow-secondary/20"
                            disabled={isLoading}
                            loading={isLoading}
                        >
                            {isRegister ? "Create Identity" : "Enter the Ascendant"}
                            {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
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
                            onClick={handleGoogleLogin}
                            className="border border-outline-variant/20 hover:bg-surface-variant/30"
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
            </div>
        </main>
    );
}
