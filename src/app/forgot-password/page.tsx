'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, useTranslation } from '@/hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';
import { AuthShell, AuthHeader, AuthFormCard, PasswordField } from '@/components/auth';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { ParsedAuthError, parseAuthError } from '@/utils/authErrorParser';

/** Steps of the password reset OTP flow. */
type ResetStep = 'email' | 'otp' | 'password' | 'success';

/** Structured errors keyed by step for granular display. */
interface StepErrors {
  email?: string;
  otp?: string;
  password?: string;
  confirm?: string;
}

/** Error codes from the backend that the UI should handle. */
const OTP_ERROR_CODES: Record<string, string> = {
  reset_otp_expired: 'auth.passwordReset.otpExpired',
  reset_otp_incorrect: 'auth.passwordReset.otpIncorrect',
  reset_otp_locked: 'auth.passwordReset.otpLocked',
  reset_token_invalid: 'auth.passwordReset.tokenInvalid',
  password_reset_send_failed: 'auth.passwordReset.sendFailed',
  password_reset_unavailable: 'auth.passwordReset.unavailable',
  rate_limited: 'auth.passwordReset.rateLimited',
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { success, error: _showError, ToastContainer } = useToast();
  const { t } = useTranslation();

  // --- Step state ---
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Loading & error state ---
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<StepErrors>({});
  const [bannerError, setBannerError] = useState<ParsedAuthError | null>(null);

  // --- Timer state ---
  const [otpExpiresIn, setOtpExpiresIn] = useState(0); // seconds until OTP expires
  const [resendCooldown, setResendCooldown] = useState(0); // seconds until resend allowed
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Helpers ---

  /** Clear all timers on unmount / step transitions. */
  const clearTimers = useCallback(() => {
    if (otpTimerRef.current) {
      clearInterval(otpTimerRef.current);
      otpTimerRef.current = null;
    }
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /** Start the OTP expiry countdown. */
  const startOtpCountdown = useCallback((totalSeconds: number) => {
    clearTimers();
    setOtpExpiresIn(totalSeconds);
    otpTimerRef.current = setInterval(() => {
      setOtpExpiresIn((prev) => {
        if (prev <= 1) {
          if (otpTimerRef.current) clearInterval(otpTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimers]);

  /** Start the resend cooldown. */
  const startResendCooldown = useCallback((cooldownSeconds: number = 30) => {
    setResendCooldown(cooldownSeconds);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /** Format seconds into MM:SS */
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /** Transition to a new step and clear field errors. */
  const goToStep = (s: ResetStep) => {
    setStep(s);
    setFieldErrors({});
    setBannerError(null);
  };

  // --- Step 1: Start Reset (request OTP) ---

  const handleStartReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setBannerError(null);

    if (!email.trim() || !email.includes('@')) {
      setFieldErrors({ email: t('auth.signIn.emailInvalid') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithTimeout('/api/auth/password-reset/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok && data.code === 'rate_limited') {
        setFieldErrors({ email: t(OTP_ERROR_CODES.rate_limited) });
        return;
      }

      // Always move to OTP step — don't reveal whether the email exists.
      const expires = typeof data.expiresIn === 'number' ? data.expiresIn : 300;
      startOtpCountdown(expires);
      startResendCooldown(30);
      goToStep('otp');
    } catch {
      setFieldErrors({ email: t(OTP_ERROR_CODES.password_reset_unavailable) });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Verify OTP ---

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setBannerError(null);

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setFieldErrors({ otp: t('auth.passwordReset.otpInvalid') });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithTimeout('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data.code as string;
        if (code === 'reset_otp_locked' || code === 'reset_otp_expired') {
          // These are actionable — ask user to request a new code
          setFieldErrors({ otp: t(OTP_ERROR_CODES[code] || 'auth.passwordReset.otpGeneric') });
          if (data.action === 'request_new_code' || code === 'reset_otp_expired') {
            setOtpExpiresIn(0); // expire the timer so user sees "Request new code"
          }
        } else if (code === 'reset_otp_incorrect') {
          setFieldErrors({ otp: t(OTP_ERROR_CODES.reset_otp_incorrect) });
        } else if (code === 'rate_limited') {
          setFieldErrors({ otp: t(OTP_ERROR_CODES.rate_limited) });
        } else {
          setBannerError(parseAuthError(data));
        }
        return;
      }

      // Success — store resetToken in component state only.
      if (!data.resetToken) {
        setBannerError(parseAuthError({ message: t('auth.passwordReset.tokenInvalid') }));
        return;
      }
      setResetToken(data.resetToken);
      clearTimers();
      goToStep('password');
    } catch {
      setFieldErrors({ otp: t(OTP_ERROR_CODES.password_reset_unavailable) });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Resend OTP ---

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;

    setFieldErrors({});
    setBannerError(null);
    setIsLoading(true);

    try {
      const res = await fetchWithTimeout('/api/auth/password-reset/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      // Always succeed silently — don't reveal if email exists.
      const expires = typeof data.expiresIn === 'number' ? data.expiresIn : 300;
      startOtpCountdown(expires);
      startResendCooldown(30);
      setOtp('');
    } catch {
      setFieldErrors({ otp: t(OTP_ERROR_CODES.password_reset_unavailable) });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 3: Complete Reset (set new password) ---

  const validatePassword = (): boolean => {
    const errors: StepErrors = {};
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

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);
    setFieldErrors({});

    if (!validatePassword()) return;

    if (!resetToken) {
      setBannerError(parseAuthError({ message: t('auth.passwordReset.tokenInvalid') }));
      goToStep('email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchWithTimeout('/api/auth/password-reset/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        const parsed = parseAuthError(data);
        if (parsed.field === 'password') {
          setFieldErrors({ password: parsed.message || t('auth.register.validation.passwordLength') });
        } else if (parsed.code === 'reset_token_invalid') {
          setBannerError(parsed);
          // Token expired/invalid — user should restart the flow.
          setTimeout(() => goToStep('email'), 3000);
        } else if (parsed.code === 'rate_limited') {
          setBannerError(parsed);
        } else {
          setBannerError(parsed);
        }
        return;
      }

      // Success!
      goToStep('success');
      success(t('auth.resetPassword.success') || 'Password has been reset successfully.');
    } catch {
      setBannerError(parseAuthError(t(OTP_ERROR_CODES.password_reset_unavailable)));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step metadata ---

  const stepTitles: Record<ResetStep, string> = {
    email: t('auth.passwordReset.title'),
    otp: t('auth.passwordReset.otpTitle'),
    password: t('auth.passwordReset.newPasswordTitle'),
    success: t('auth.resetPassword.successTitle'),
  };

  const stepSubtitles: Record<ResetStep, string> = {
    email: t('auth.passwordReset.subtitle'),
    otp: t('auth.passwordReset.otpSubtitle'),
    password: t('auth.passwordReset.newPasswordSubtitle'),
    success: t('auth.resetPassword.successSubtitle'),
  };

  // --- Render helpers for each step ---

  const renderEmailStep = () => (
    <form onSubmit={handleStartReset} className="space-y-6" noValidate>
      <Input
        type="email"
        label={t('auth.passwordReset.emailLabel')}
        placeholder={t('auth.passwordReset.emailPlaceholder')}
        icon={<Mail size={16} className="text-secondary" />}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
        }}
        error={fieldErrors.email}
        autoComplete="email"
        required
        disabled={isLoading}
      />

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isLoading}
        disabled={!email.trim() || isLoading}
        className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
      >
        {t('auth.passwordReset.sendCode')}
        {!isLoading && <ArrowRight size={14} />}
      </Button>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-6" noValidate>
      {/* OTP input */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body block">
          {t('auth.passwordReset.otpLabel')}
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(val);
            if (fieldErrors.otp) setFieldErrors((p) => ({ ...p, otp: undefined }));
          }}
          disabled={isLoading}
          className="w-full bg-surface border border-outline-variant/30 rounded-[24px] px-6 py-4 text-center text-2xl tracking-[0.6em] font-mono text-primary placeholder:text-primary/20 outline-none transition-all focus:ring-2 focus:ring-secondary/30 focus:border-secondary disabled:opacity-50"
          aria-label={t('auth.passwordReset.otpLabel')}
          aria-invalid={fieldErrors.otp ? 'true' : 'false'}
          aria-describedby={fieldErrors.otp ? 'otp-error' : undefined}
        />
        {fieldErrors.otp && (
          <p id="otp-error" className="text-[10px] text-red-500 ml-1 flex items-center gap-1" role="alert">
            {fieldErrors.otp}
          </p>
        )}
      </div>

      {/* OTP expiry info */}
      {otpExpiresIn > 0 && (
        <p className="text-[11px] text-on-surface-variant/60 text-center">
          {t('auth.passwordReset.otpExpiresIn')}: <span className="font-mono font-semibold text-secondary">{formatTime(otpExpiresIn)}</span>
        </p>
      )}
      {otpExpiresIn === 0 && otp.length > 0 && (
        <p className="text-[11px] text-red-500/80 text-center">{t('auth.passwordReset.otpExpired')}</p>
      )}

      {/* Verify button */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isLoading}
        disabled={otp.length !== 6 || isLoading}
        className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
      >
        {t('auth.passwordReset.verifyCode')}
        {!isLoading && <ShieldCheck size={14} />}
      </Button>

      {/* Resend / Change email row */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => { clearTimers(); goToStep('email'); }}
          className="text-[10px] font-semibold text-on-surface-variant/50 hover:text-secondary transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={12} />
          {t('auth.passwordReset.changeEmail')}
        </button>

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || isLoading}
          className={`text-[10px] font-semibold flex items-center gap-1 transition-colors ${
            resendCooldown > 0
              ? 'text-on-surface-variant/30 cursor-not-allowed'
              : 'text-on-surface-variant/60 hover:text-secondary'
          }`}
        >
          {resendCooldown > 0 ? (
            <>{t('auth.passwordReset.resendIn')} {formatTime(resendCooldown)}</>
          ) : (
            <><RefreshCw size={12} /> {t('auth.passwordReset.resendCode')}</>
          )}
        </button>
      </div>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handleCompleteReset} className="space-y-6" noValidate>
      <PasswordField
        label={t('auth.passwordReset.newPasswordLabel')}
        placeholder={t('auth.passwordReset.newPasswordPlaceholder')}
        icon={<Lock size={16} className="text-secondary" />}
        value={newPassword}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setNewPassword(e.target.value);
          if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
        }}
        error={fieldErrors.password}
        autoComplete="new-password"
        required
        disabled={isLoading}
      />

      <PasswordField
        label={t('auth.passwordReset.confirmPasswordLabel')}
        placeholder={t('auth.passwordReset.confirmPasswordPlaceholder')}
        icon={<ShieldCheck size={16} className="text-secondary" />}
        value={confirmPassword}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setConfirmPassword(e.target.value);
          if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: undefined }));
        }}
        error={fieldErrors.confirm}
        autoComplete="new-password"
        required
        disabled={isLoading}
      />

      {bannerError && (
        <div className="text-[11px] text-red-500 text-center">{bannerError.message}</div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isLoading}
        disabled={!newPassword.trim() || !confirmPassword.trim() || isLoading}
        className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
      >
        {t('auth.resetPassword.submit')}
        {!isLoading && <KeyRound size={14} />}
      </Button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-secondary" />
      </div>
      <p className="text-sm text-on-surface-variant/80 text-center">
        {t('auth.passwordReset.successMessage')}
      </p>
      <Button
        type="button"
        fullWidth
        size="lg"
        onClick={() => router.push('/login')}
        className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
      >
        {t('auth.resetPassword.proceedToLogin')}
        {<ArrowRight size={14} />}
      </Button>
    </div>
  );

  return (
    <AuthShell>
      {ToastContainer}
      <div className="w-full max-w-md flex flex-col">
        <AuthHeader
          title={stepTitles[step]}
          subtitle={stepSubtitles[step]}
          showLogo={step !== 'success'}
        />

        <div className="p-4 sm:p-6 pt-0">
          <AuthFormCard>
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'password' && renderPasswordStep()}
            {step === 'success' && renderSuccessStep()}

            {/* Back to login link (hidden on success since there's a CTA button) */}
            {step !== 'success' && (
              <div className="text-center pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/50 hover:text-secondary transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft size={12} />
                  {t('auth.passwordReset.backToLogin')}
                </button>
              </div>
            )}
          </AuthFormCard>
        </div>
      </div>
    </AuthShell>
  );
}
