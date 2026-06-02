'use client';

import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AuthErrorBanner from './AuthErrorBanner';
import { useTranslation } from '@/hooks';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

interface EmailOtpFormProps {
  /**
   * Called after the OTP is successfully verified. Receives whatever the
   * verify endpoint returns (tokens / user) so the parent can complete the
   * next-auth session and redirect.
   */
  onVerified: (verifyResponse: unknown) => Promise<void> | void;
  disabled?: boolean;
}

type Step = 'email' | 'otp';

const OTP_LENGTH = 6;
// Short cooldown before "Resend" re-enables — kept independent of the code's
// expiry (~5 min) so a user whose email never arrives isn't locked out of
// requesting a new one.
const RESEND_COOLDOWN_SECONDS = 30;

const EmailOtpForm: React.FC<EmailOtpFormProps> = ({ onVerified, disabled = false }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  /** POST /api/auth/email-otp/start  body: { email: "x@y.com" }  ->  { sent: true, expiresIn: 300 } */
  const sendOtp = async (emailAddress: string): Promise<number> => {
    const res = await fetchWithTimeout('/api/auth/email-otp/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAddress }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      const code = data.code;
      const msg = data.message || data.error || 'Could not send the code.';
      if (code === 'otp_rate_limited') {
        throw new Error(msg || 'Too many verification attempts. Please try again in an hour.');
      }
      throw new Error(msg);
    }
    return data.expiresIn || 300;
  };

  /** POST /api/auth/email-otp/verify  body: { email, code }  ->  session envelope */
  const verifyOtp = async (emailAddress: string, code: string): Promise<unknown> => {
    const res = await fetchWithTimeout('/api/auth/email-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAddress, code }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      const errCode = data.code;
      const msg = data.message || data.error || 'Invalid code.';
      if (errCode === 'otp_expired') {
        throw new Error(t('auth.email.otpExpired') || 'Code expired — resend');
      } else if (errCode === 'otp_incorrect') {
        throw new Error(t('auth.email.otpIncorrect') || 'Incorrect code');
      } else if (errCode === 'otp_locked') {
        throw new Error(t('auth.email.otpLocked') || 'Too many incorrect attempts. Please request a new code.');
      }
      throw new Error(msg);
    }
    return data;
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = !!email && emailRegex.test(email);
  const isValidOtp = otp.replace(/\D/g, '').length === OTP_LENGTH;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail) {
      setError(t('auth.email.invalidEmail') || 'Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sendOtp(email.trim());
      setStep('otp');
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidOtp) {
      setError(t('auth.email.invalidOtp') || `Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyOtp(email.trim(), otp.trim());
      await onVerified(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await sendOtp(email.trim());
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <AuthErrorBanner message={error} onDismiss={() => setError(null)} />}

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            label={t('auth.email.emailLabel') || 'Email Address'}
            placeholder={t('auth.email.emailPlaceholder') || 'you@example.com'}
            icon={<Mail size={16} className="text-secondary" />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={disabled || isSubmitting}
            required
          />
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={disabled || isSubmitting || !isValidEmail}
            className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
          >
            {t('auth.email.sendCode') || 'Send Code'}
            {!isSubmitting && <ArrowRight size={14} />}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <p className="text-xs text-on-surface-variant/60 text-center font-body">
            {(t('auth.email.codeSentTo') || 'We sent a code to')} <span className="font-bold text-primary font-headline">{email}</span>
          </p>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={OTP_LENGTH}
            label={t('auth.email.otpLabel') || 'Verification Code'}
            placeholder={'•'.repeat(OTP_LENGTH)}
            icon={<KeyRound size={16} className="text-secondary" />}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''));
              if (error) setError(null);
            }}
            className="tracking-[0.5em] text-center font-bold"
            disabled={disabled || isSubmitting}
            required
          />
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={disabled || isSubmitting || !isValidOtp}
            className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
          >
            {t('auth.email.verify') || 'Verify & Sign In'}
            {!isSubmitting && <ArrowRight size={14} />}
          </Button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors"
            >
              <ArrowLeft size={12} />
              {t('auth.email.changeEmail') || 'Change Email'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0 || isSubmitting}
              className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendIn > 0
                ? `${t('auth.email.resendIn') || 'Resend in'} ${resendIn}s`
                : (t('auth.email.resendCode') || 'Resend code')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EmailOtpForm;
