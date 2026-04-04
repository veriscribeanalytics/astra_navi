'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
                    console.error("Error parsing pending birth details", e);
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

    return (
        <main className="min-h-screen pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 flex flex-col items-center justify-center relative">
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
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
