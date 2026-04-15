'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';

export default function LoginPage() {
    const { login, showLoading, isLoading, isLoggedIn, user } = useAuth();
    const { showToast, ToastContainer, success, error } = useToast();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl');

    // Redirect if already logged in
    React.useEffect(() => {
        if (isLoggedIn) {
            // Respect callbackUrl if it exists and isn't an auth page, otherwise default to status-based redirect
            const decodedUrl = callbackUrl ? decodeURIComponent(callbackUrl) : null;
            const isAuthPage = decodedUrl?.includes('/login') || decodedUrl?.includes('/register');

            if (decodedUrl && !isAuthPage) {
                router.push(decodedUrl);
                return;
            }

            // If user has profile details, go to home
            if (user?.name && user?.dob) {
                router.push('/');
            } else {
                // If user is logged in but missing profile, go to profile
                router.push('/profile');
            }
        }
    }, [isLoggedIn, user, router, callbackUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isRegister && password !== confirmPassword) {
            error("Celestial bodies are out of alignment! Passwords don't match.");
            return;
        }

        if (password.length < 6) {
            error("Password must be at least 6 characters long");
            return;
        }

        // Trigger the premium celestial loader
        const loadingMessage = isRegister ? "Inscribing your celestial coordinates..." : "Aligning your celestial path...";
        showLoading(loadingMessage, 3000);
        
        try {
            const endpoint = isRegister ? '/api/register' : '/api/login';
            
            // Check if there are pending birth details from the Hero section
            const pendingDataStr = localStorage.getItem('astranavi_pending_birth_details');
            let profileData = {};
            
            if (pendingDataStr) {
                try {
                    profileData = JSON.parse(pendingDataStr);
                } catch (e) {
                    // Silently ignore invalid JSON
                }
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password,
                    ...(isRegister ? profileData : {}) // Send profile details ONLY when registering
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "The stars are obscured. Please try again.");
            }

            // Successful Auth
            setTimeout(() => {
                // Remove the pending data as it's now officially Claimed by the DB
                localStorage.removeItem('astranavi_pending_birth_details');
                
                // data.user now contains name, dob, tob, pob from the DB record!
                login(email, data.user);
                
                success(isRegister ? 'Account created successfully!' : 'Welcome back!');
                
                // Smart redirect logic:
                // 1. If callbackUrl exists and isn't an auth page, go there
                // 2. Otherwise, check if profile is complete
                const decodedUrl = callbackUrl ? decodeURIComponent(callbackUrl) : null;
                const isAuthPage = decodedUrl?.includes('/login') || decodedUrl?.includes('/register');
                
                if (decodedUrl && !isAuthPage) {
                    router.push(decodedUrl);
                } else if (data.user?.name && data.user?.dob) {
                    router.push('/');
                } else {
                    router.push('/profile');
                }
            }, 500);

        } catch (err: any) {
            error(err.message);
            // Hide loading if error occurs
            showLoading("", 0);
        }
    };

    const handleGoogleLogin = async () => {
        showLoading("Connecting to Google...", 2000);
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch (err: any) {
            error("Google sign-in failed. Please try again.");
            showLoading("", 0);
        }
    };

    return (
        <main className="min-h-screen pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 flex flex-col items-center justify-center relative overflow-x-hidden">
            <ToastContainer />
            {/* Additional ambient glow specifically for login */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-secondary/10 blur-[60px] sm:blur-[80px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-6 sm:mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-4 sm:mb-6 cosmic-glow">
                        <Image
                            src="/icons/logo.jpeg"
                            alt="Astra Navi"
                            width={36}
                            height={36}
                            className="object-contain sm:w-10 sm:h-10"
                            priority
                        />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary mb-2 sm:mb-3">
                        {isRegister ? "Begin Your Journey" : "Welcome Back"}
                    </h1>
                    <p className="text-xs sm:text-sm font-body text-on-surface-variant max-w-xs mx-auto">
                        {isRegister 
                          ? "Create your celestial identity to access personalized cosmic guidance." 
                          : "Enter your celestial credentials to access your personalized Jyotish readings."
                        }
                    </p>
                </div>

                <Card padding="lg" className="cosmic-glow border-secondary/10 !p-5 sm:!p-8" hoverable={false}>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <Input 
                            label="Email Address" 
                            type="email" 
                            icon="mail" 
                            placeholder="seeker@cosmos.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            helperText="We'll never share your email"
                            required 
                        />
                
                        <div className="space-y-2">
                            <div className="relative">
                                <Input 
                                    label="Password" 
                                    type={showPassword ? "text" : "password"}
                                    icon="lock" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    helperText={isRegister ? "Minimum 6 characters" : undefined}
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-[38px] text-on-surface-variant/60 hover:text-secondary transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            {!isRegister && (
                                <div className="flex justify-end">
                                    <span className="text-[10px] text-secondary hover:underline cursor-pointer font-bold tracking-wider uppercase">
                                        Forgot Password?
                                    </span>
                                </div>
                            )}
                        </div>

                        {isRegister && (
                            <div className="relative">
                                <Input 
                                    label="Confirm Password" 
                                    type={showConfirmPassword ? "text" : "password"}
                                    icon="verified_user" 
                                    placeholder="••••••••" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={confirmPassword && password !== confirmPassword ? "Passwords don't match" : ''}
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-[38px] text-on-surface-variant/60 hover:text-secondary transition-colors"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                    </span>
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
                        </Button>
                    </form>

                    {/* Divider - Temporarily hidden for beta testing */}
                    {/* <div className="relative my-6 sm:my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-primary/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-3 text-on-surface-variant/60 font-bold tracking-widest">Or continue with</span>
                        </div>
                    </div> */}

                    {/* Social Login Buttons */}
                    {/* Temporarily disabled for beta testing */}
                    {/* <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-surface-variant border border-primary/20 rounded-xl font-body font-semibold text-sm text-primary hover:bg-primary/5 hover:border-secondary/30 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                    </div> */}

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
                            className="text-primary font-bold hover:text-secondary cursor-pointer transition-colors"
                        >
                            {isRegister ? "Login here" : "Create one"}
                        </button>
                    </div>
                </Card>
            </div>
        </main>
    );
}
