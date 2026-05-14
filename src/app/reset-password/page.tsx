'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks';
import Button from '@/components/ui/Button';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthShell, AuthHeader, AuthFormCard, AuthErrorBanner, PasswordField } from '@/components/auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { success, error: showError, ToastContainer } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      showError('Invalid or missing reset token.');
    }
  }, [token, showError]);

  const validate = (): boolean => {
    const errors: { password?: string; confirm?: string } = {};
    if (newPassword.length < 10) errors.password = 'Password must be at least 10 characters.';
    if (newPassword !== confirmPassword) errors.confirm = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);

    if (!token) {
      showError('Invalid reset token. Please request a new link.');
      return;
    }

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.error || 'Failed to reset password');
        return;
      }

      setIsSuccess(true);
      success('Password has been reset successfully. You can now log in.');

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setBannerError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {ToastContainer}
      <div className="w-full max-w-md flex flex-col">
        <AuthHeader
          title={isSuccess ? 'Password Reset' : 'Create New Password'}
          subtitle={
            isSuccess
              ? 'Your password has been successfully reset.'
              : 'Please enter your new password below.'
          }
        />

        <div className="p-4 sm:p-6 pt-0">
          <AuthFormCard>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {bannerError && (
                  <AuthErrorBanner message={bannerError} onDismiss={() => setBannerError(null)} />
                )}

                <PasswordField
                  label="New Password"
                  placeholder="Enter new password"
                  icon={<Lock size={16} className="text-secondary" />}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  error={fieldErrors.password}
                  autoComplete="new-password"
                  required
                  disabled={!token}
                />

                <PasswordField
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  icon={<ShieldCheck size={16} className="text-secondary" />}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: undefined }));
                  }}
                  error={fieldErrors.confirm}
                  autoComplete="new-password"
                  required
                  disabled={!token}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  disabled={!token || !newPassword.trim() || !confirmPassword.trim()}
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
          </AuthFormCard>
        </div>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}