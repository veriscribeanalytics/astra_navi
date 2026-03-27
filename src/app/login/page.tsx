'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
    const { login, showLoading, isLoading } = useAuth();
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Trigger the premium celestial loader
        showLoading("Aligning your celestial path...", 2500);
        
        setTimeout(() => {
            login();
            router.push('/');
        }, 2500);
    };

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center relative">
            {/* Additional ambient glow specifically for login */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/10 blur-[80px] rounded-full z-0 pointer-events-none"></div>
            
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-variant/50 border border-secondary/20 mb-6 cosmic-glow">
                        <Image
                            src="/icons/logo.jpeg"
                            alt="Astra Navi"
                            width={40}
                            height={40}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl font-headline font-bold text-primary mb-3">Welcome Back</h1>
                    <p className="text-sm font-body text-on-surface-variant max-w-xs mx-auto">
                        Enter your celestial credentials to access your personalized Jyotish readings.
                    </p>
                </div>

                <Card padding="lg" className="cosmic-glow border-secondary/10 !bg-surface/60" hoverable={false}>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input 
                            label="Email Address" 
                            type="email" 
                            icon="mail" 
                            placeholder="seeker@cosmos.com" 
                            required 
                        />
                        
                        <div className="space-y-2">
                            <Input 
                                label="Password" 
                                type="password" 
                                icon="lock" 
                                placeholder="••••••••" 
                                required 
                            />
                            <div className="flex justify-end">
                                <span className="text-[10px] text-secondary hover:underline cursor-pointer font-bold tracking-wider uppercase">
                                    Forgot Password?
                                </span>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            fullWidth 
                            size="lg" 
                            className="mt-4 shadow-lg shadow-secondary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                                    Aligning Stars...
                                </span>
                            ) : (
                                "Enter the Ascendant"
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-xs font-body text-on-surface-variant">
                        Don't have an account?{' '}
                        <span className="text-primary font-bold hover:text-secondary cursor-pointer transition-colors">
                            Create one
                        </span>
                    </div>
                </Card>
            </div>
        </main>
    );
}
