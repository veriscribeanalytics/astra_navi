'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Lock, Eye, ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { success, error, ToastContainer } = useToast();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            error("Invalid or missing reset token.");
        }
    }, [token, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            error("Invalid reset token. Please request a new link.");
            return;
        }

        if (newPassword.length < 10) {
            error("Password must be at least 10 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            error("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            }

            setIsSuccess(true);
            success("Password has been reset successfully. You can now log in.");
            
            setTimeout(() => {
                router.push('/login');
            }, 3000);
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
                        {isSuccess ? "Password Reset" : "Create New Password"}
                    </h1>
                    <p className="text-xs text-on-surface-variant/80 font-medium text-center">
                        {isSuccess 
                            ? "Your password has been successfully reset." 
                            : "Please enter your new password below."}
                    </p>
                </div>

                <div className="p-6 pt-4">
                    <div className="bg-surface/5 dark:bg-white/[0.01] backdrop-blur-md rounded-[28px] border border-outline-variant/20 dark:border-white/5 p-6 sm:p-8 shadow-2xl">
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="New Password" 
                                            icon={<Lock size={16} className="text-secondary" />} 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={16} /></button>
                                    </div>
                                    <div className="relative">
                                        <Input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            placeholder="Confirm Password" 
                                            icon={<ShieldCheck size={16} className="text-secondary" />} 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary"><Eye size={16} /></button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    loading={isLoading}
                                    disabled={!token}
                                    className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
                                >
                                    Reset Password
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
                                    Proceed to Login
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
