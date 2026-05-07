'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, useTranslation } from '@/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { success, error, ToastContainer } = useToast();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to send reset link");
            }

            setIsSent(true);
            success("Password reset instructions sent to your email (or check response for dev token).");
            
            // In dev mode, the backend returns the token in the response. We should log it.
            if (data.token) {
                console.log("DEV MODE: Reset token is", data.token);
            }
        } catch (err: unknown) {
            error(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] w-full flex items-center justify-center relative overflow-hidden font-body bg-transparent px-4">
            {ToastContainer}
            
            <div className="w-full max-w-md relative z-10 flex flex-col h-full overflow-hidden">
                <div className="p-6 pb-2 shrink-0">
                    <div className="flex justify-center mb-6">
                        <div className="flex flex-col items-center gap-2">
                            <Image src="/icons/logo.jpeg" alt="AstraNavi" width={48} height={48} style={{ width: "auto", height: "auto" }} className="rounded-xl shadow-lg" />
                            <h2 className="text-xl font-headline font-bold text-primary">AstraNavi</h2>
                        </div>
                    </div>

                    <h1 className="text-2xl font-headline font-bold text-primary mb-1 text-center">
                        {isSent ? "Check Your Email" : "Reset Password"}
                    </h1>
                    <p className="text-xs text-on-surface-variant/80 font-medium text-center">
                        {isSent 
                            ? "We've sent password reset instructions to your email." 
                            : "Enter your email address and we'll send you a link to reset your password."}
                    </p>
                </div>

                <div className="p-6 pt-4">
                    <div className="bg-surface/5 dark:bg-white/[0.01] backdrop-blur-md rounded-[28px] border border-outline-variant/20 dark:border-white/5 p-6 sm:p-8 shadow-2xl">
                        {!isSent ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input 
                                    type="email" 
                                    placeholder={t('login.email') || "Email Address"} 
                                    icon={<Mail size={16} className="text-secondary" />} 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    loading={isLoading}
                                    className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
                                >
                                    Send Reset Link
                                    {!isLoading && <ArrowRight size={14} />}
                                </Button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-secondary" />
                                </div>
                                <Button
                                    type="button"
                                    fullWidth
                                    size="lg"
                                    onClick={() => router.push('/login')}
                                    className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2"
                                >
                                    Return to Login
                                </Button>
                            </div>
                        )}

                        <div className="text-center pt-6">
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/50 hover:text-secondary transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={12} />
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
