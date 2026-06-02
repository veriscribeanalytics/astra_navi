'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast, useTranslation } from '@/hooks';
import Button from '@/components/ui/Button';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthShell, AuthHeader, AuthFormCard, AuthErrorBanner, PasswordField } from '@/components/auth';
import { ParsedAuthError, parseAuthError, getLocalizedErrorMessage } from '@/utils/authErrorParser';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { success, error: showError, ToastContainer } = useToast();
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [bannerError, setBannerError] = useState<ParsedAuthError | null>(null);

  useEffect(() => {
    if (!token) {
      showError(t('auth.errors.reset_token_invalid'));
    }
  }, [token, showError, t]);

  const validate = (): boolean => {
    const errors: { password?: string; confirm?: string } = {};
    if (newPassword.length < 10) {
      errors.password = t('auth.register.validation.passwordLength');
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.password = t('auth.register.validation.passwordUpper');
    } else if (!/[a-z]/.test(newPassword)) {
      errors.password = t('auth.register.validation.passwordLower');
    } else if (!/[0-9]/.test(newPassword)) {
      errors.password = t('auth.register.validation.passwordDigit');
    } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.password = t('auth.register.validation.passwordSpecial');
    }
    if (newPassword !== confirmPassword) {
      errors.confirm = t('auth.register.validation.passwordMismatch');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);
    setFieldErrors({});

    if (!token) {
      showError(t('auth.errors.reset_token_invalid'));
      return;
    }

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetchWithTimeout('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        const parsed = parseAuthError(data);
        if (parsed.field === 'password') {
          setFieldErrors({ password: getLocalizedErrorMessage(parsed, t) });
        } else {
          setBannerError(parsed);
        }
        return;
      }

      setIsSuccess(true);
      success(t('auth.resetPassword.success'));

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setBannerError(parseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {ToastContainer}
      <div className="w-full max-w-md flex flex-col">
        <AuthHeader
          title={isSuccess ? t('auth.resetPassword.successTitle') : t('auth.resetPassword.title')}
          subtitle={
            isSuccess
              ? t('auth.resetPassword.successSubtitle')
              : t('auth.resetPassword.subtitle')
          }
        />

        <div className="p-4 sm:p-6 pt-0">
          <AuthFormCard>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {bannerError && (
                  <AuthErrorBanner parsedError={bannerError} onDismiss={() => setBannerError(null)} />
                )}

                <PasswordField
                  label={t('auth.resetPassword.newPasswordLabel')}
                  placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
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
                  label={t('auth.resetPassword.confirmPasswordLabel')}
                  placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
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
                  {t('auth.resetPassword.submit')}
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
                  {t('auth.resetPassword.proceedToLogin')}
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