'use client';

import React, { useState, useEffect } from 'react';
import { Phone, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AuthErrorBanner from './AuthErrorBanner';
import { useTranslation } from '@/hooks';

interface PhoneOtpFormProps {
  /**
   * Called after the OTP is successfully verified. Receives whatever the
   * verify endpoint returns (tokens / user) so the parent can complete the
   * next-auth session and redirect.
   */
  onVerified: (verifyResponse: unknown) => Promise<void> | void;
  disabled?: boolean;
}

type Step = 'phone' | 'otp';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Phone-number OTP sign-in — UI template (two steps: enter phone → enter OTP).
 *
 * The two network calls ({@link sendOtp}, {@link verifyOtp}) are stubbed below.
 * Replace their bodies with the real endpoints when the backend is ready.
 */
const PhoneOtpForm: React.FC<PhoneOtpFormProps> = ({ onVerified, disabled = false }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // ─── TODO(backend): stubbed API calls ──────────────────────────────────────
  // Adjust the paths and request/response shapes to match the real backend.

  /** POST /api/auth/otp/send  body: { phone: "+91..." }  ->  { ok: true } */
  const sendOtp = async (_phoneNumber: string): Promise<void> => {
    throw new Error(t('auth.phone.notConfigured') || 'Phone sign-in is not available yet.');
  };

  /** POST /api/auth/otp/verify  body: { phone, otp }  ->  { accessToken, refreshToken, user } */
  const verifyOtp = async (_phoneNumber: string, _code: string): Promise<unknown> => {
    throw new Error(t('auth.phone.notConfigured') || 'Phone sign-in is not available yet.');
  };

  const digitsOnly = phone.replace(/\D/g, '');
  const isValidPhone = digitsOnly.length >= 10;
  const isValidOtp = otp.replace(/\D/g, '').length === OTP_LENGTH;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhone) {
      setError(t('auth.phone.invalidPhone') || 'Please enter a valid phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sendOtp(phone.trim());
      setStep('otp');
      setResendIn(RESEND_SECONDS);
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
      setError(t('auth.phone.invalidOtp') || `Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyOtp(phone.trim(), otp.trim());
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
    try {
      await sendOtp(phone.trim());
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    }
  };

  return (
    <div className="space-y-4">
      {error && <AuthErrorBanner message={error} onDismiss={() => setError(null)} />}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t('auth.phone.phoneLabel') || 'Phone Number'}
            placeholder={t('auth.phone.phonePlaceholder') || '+91 98765 43210'}
            icon={<Phone size={16} className="text-secondary" />}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
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
            disabled={disabled || isSubmitting || !isValidPhone}
            className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
          >
            {t('auth.phone.sendCode') || 'Send Code'}
            {!isSubmitting && <ArrowRight size={14} />}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <p className="text-xs text-on-surface-variant/60 text-center">
            {(t('auth.phone.codeSentTo') || 'We sent a code to')} <span className="font-bold text-primary">{phone}</span>
          </p>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            label={t('auth.phone.otpLabel') || 'Verification Code'}
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
            {t('auth.phone.verify') || 'Verify & Sign In'}
            {!isSubmitting && <ArrowRight size={14} />}
          </Button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
              disabled={isSubmitting}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors"
            >
              <ArrowLeft size={12} />
              {t('auth.phone.changeNumber') || 'Change number'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0 || isSubmitting}
              className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendIn > 0
                ? `${t('auth.phone.resendIn') || 'Resend in'} ${resendIn}s`
                : (t('auth.phone.resendCode') || 'Resend code')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneOtpForm;
