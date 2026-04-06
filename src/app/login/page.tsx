'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
    const { login, showLoading, isLoading, isLoggedIn, user } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPhoneLogin, setShowPhoneLogin] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Redirect if already logged in
    React.useEffect(() => {
        if (isLoggedIn) {
            // If user has profile details, go to home
            if (user?.name && user?.dob) {
                router.push('/');
            } else {
                // If user is logged in but missing profile, go to profile
                router.push('/profile');
            }
        }
    }, [isLoggedIn, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (isRegister && password !== confirmPassword) {
            setError("Celestial bodies are out of alignment! Passwords don't match.");
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
                    ...(isRegister ? { ...profileData, phoneNumber } : {}) // Send profile details + phone ONLY when registering
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
                
                // Smart redirect logic:
                // If user has name and dob, they've completed profile → go to home
                // If user is missing profile details → go to profile completion
                if (data.user?.name && data.user?.dob) {
                    router.push('/');
                } else {
                    router.push('/profile');
                }
            }, 500);

        } catch (err: any) {
            setError(err.message);
            // Hide loading if error occurs
            showLoading("", 0);
        }
    };

    const handleGoogleLogin = async () => {
        showLoading("Connecting to Google...", 2000);
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch (err: any) {
            setError("Google sign-in failed. Please try again.");
            showLoading("", 0);
        }
    };

    const handlePhoneLogin = () => {
        setShowPhoneLogin(true);
        setError('');
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // For now, just show a message that OTP will be sent
        // Later you'll integrate Twilio/MSG91 here
        showLoading("Sending OTP to your phone...", 2000);
        
        setTimeout(() => {
            setError("Phone OTP feature coming soon! Please use email/password or Google for now.");
            showLoading("", 0);
        }, 2000);
    };

    return (
        <main className="min-h-screen pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 flex flex-col items-center justify-center relative overflow-x-hidden">
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
                    
                    {error && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                             &times; {error}
                        </div>
                    )}
                </div>

                <Card padding="lg" className="cosmic-glow border-secondary/10 !p-5 sm:!p-8" hoverable={false}>
                    {showPhoneLogin ? (
                        /* Phone Login Form */
                        <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-6">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-headline font-bold text-primary">Login with Phone</h3>
                                <p className="text-xs text-on-surface-variant mt-1">We'll send you an OTP to verify</p>
                            </div>

                            <Input 
                                label="Phone Number" 
                                type="tel" 
                                icon="phone" 
                                placeholder="+91 98765 43210" 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required 
                            />

                            <Button 
                                type="submit" 
                                fullWidth 
                                size="lg" 
                                className="mt-3 sm:mt-4 shadow-lg shadow-secondary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                                        Sending OTP...
                                    </span>
                                ) : (
                                    "Send OTP"
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setShowPhoneLogin(false)}
                                className="w-full text-xs text-on-surface-variant hover:text-primary transition-colors mt-4"
                            >
                                ← Back to other options
                            </button>
                        </form>
                    ) : (
                        /* Email/Password Form */
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                {isRegister && (
                                    <Input 
                                        label="Phone Number (Optional)" 
                                        type="tel" 
                                        icon="phone" 
                                        placeholder="+91 98765 43210" 
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                )}
                                
                                <Input 
                                    label="Email Address" 
                                    type="email" 
                                    icon="mail" 
                                    placeholder="seeker@cosmos.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                        
                        <div className="space-y-2">
                            <Input 
                                label="Password" 
                                type="password" 
                                icon="lock" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            {!isRegister && (
                                <div className="flex justify-end">
                                    <span className="text-[10px] text-secondary hover:underline cursor-pointer font-bold tracking-wider uppercase">
                                        Forgot Password?
                                    </span>
                                </div>
                            )}
                        </div>

                        {isRegister && (
                            <Input 
                                label="Confirm Password" 
                                type="password" 
                                icon="verified_user" 
                                placeholder="••••••••" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required 
                            />
                        )}

                        <Button 
                            type="submit" 
                            fullWidth 
                            size="lg" 
                            className="mt-3 sm:mt-4 shadow-lg shadow-secondary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                                    {isRegister ? "Saving Journey..." : "Aligning Stars..."}
                                </span>
                            ) : (
                                isRegister ? "Create Identity" : "Enter the Ascendant"
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6 sm:my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-primary/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-3 text-on-surface-variant/60 font-bold tracking-widest">Or continue with</span>
                        </div>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3">
                        {/* Google Login Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-surface-variant border border-primary/20 rounded-xl font-body font-semibold text-sm text-primary hover:bg-primary/5 hover:border-secondary/30 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>

                        {/* Phone Login Button */}
                        <button
                            type="button"
                            onClick={handlePhoneLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-surface-variant border border-primary/20 rounded-xl font-body font-semibold text-sm text-primary hover:bg-primary/5 hover:border-secondary/30 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-secondary text-xl">phone_iphone</span>
                            Continue with Phone
                        </button>
                    </div>
                    </>
                    )}

                    <div className="mt-6 sm:mt-8 text-center text-xs font-body text-on-surface-variant">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}{' '}
                        <span 
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-primary font-bold hover:text-secondary cursor-pointer transition-colors"
                        >
                            {isRegister ? "Login here" : "Create one"}
                        </span>
                    </div>
                </Card>
            </div>
        </main>
    );
}
