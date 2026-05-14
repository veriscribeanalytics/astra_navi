'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, useTranslation } from '@/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthShell, AuthHeader, AuthFormCard } from '@/components/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { success, error: showError, ToastContainer } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(undefined);

    if (!email.trim() || !email.includes('@')) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setIsSent(true);
      success(t('login.resetLinkSent') || 'If an account exists, reset instructions have been sent.');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {ToastContainer}
      <div className="w-full max-w-md flex flex-col">
        <AuthHeader
          title={isSent ? 'Check Your Email' : 'Reset Password'}
          subtitle={
            isSent
              ? "If an account with that email exists, we've sent password reset instructions."
              : "Enter your email address and we'll send you a link to reset your password."
          }
        />

        <div className="p-4 sm:p-6 pt-0">
          <AuthFormCard>
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  icon={<Mail size={16} className="text-secondary" />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError(undefined);
                  }}
                  error={fieldError}
                  autoComplete="email"
                  required
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  disabled={!email.trim()}
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
          </AuthFormCard>
        </div>
      </div>
    </AuthShell>
  );
}