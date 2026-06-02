'use client';

import React, { useState, useEffect } from 'react';
import { Phone, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AuthErrorBanner from './AuthErrorBanner';
import { useTranslation } from '@/hooks';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

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
const RESEND_COOLDOWN_SECONDS = 30;

const PhoneOtpForm: React.FC<PhoneOtpFormProps> = ({ onVerified, disabled = false }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
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

  /** POST /api/auth/phone/start  body: { phoneNumber: "+91..." }  ->  { sent: true, expiresIn: 300 } */
  const sendOtp = async (phoneNumber: string): Promise<number> => {
    const res = await fetchWithTimeout('/api/auth/phone/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
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

  /** POST /api/auth/phone/verify  body: { phoneNumber, code }  ->  session envelope */
  const verifyOtp = async (phoneNumber: string, code: string): Promise<unknown> => {
    const res = await fetchWithTimeout('/api/auth/phone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      const errCode = data.code;
      const msg = data.message || data.error || 'Invalid code.';
      if (errCode === 'otp_expired') {
        throw new Error(t('auth.phone.otpExpired'));
      } else if (errCode === 'otp_incorrect') {
        throw new Error(t('auth.phone.otpIncorrect'));
      } else if (errCode === 'otp_locked') {
        throw new Error(t('auth.phone.otpLocked'));
      }
      throw new Error(msg);
    }
    return data;
  };

  // E.164 Regex Validation - restricted to India (+91 followed by 10 digits)
  const phoneRegex = /^\+91\d{10}$/;
  const isValidPhone = !!phone && phoneRegex.test(phone);
  const isValidOtp = otp.replace(/\D/g, '').length === OTP_LENGTH;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhone) {
      setError(t('auth.phone.invalidPhone'));
      return;
    }
    setIsSubmitting(true);
    try {
      const expiresIn = await sendOtp(phone.trim());
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
      setError(t('auth.phone.invalidOtp'));
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
    setIsSubmitting(true);
    try {
      await sendOtp(phone.trim());
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <style>{`
        .PhoneInputCountrySelect {
          background-color: #121214 !important;
          color: #ffffff !important;
        }
        .PhoneInputCountrySelect option {
          background-color: #1e1e22 !important;
          color: #ffffff !important;
        }
        .PhoneInputCountrySelect:focus {
          outline: none !important;
        }
        .PhoneInputCountryIcon img {
          border-radius: 2px !important;
        }
      `}</style>
      {error && <AuthErrorBanner message={error} onDismiss={() => setError(null)} />}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <div className="space-y-2 w-full text-left">
            <label className="text-[10px] sm:text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body block">
              {t('auth.phone.phoneLabel')}
              <span className="text-secondary ml-1">*</span>
            </label>
            <div className="relative flex items-center w-full">
              <PhoneInput
                defaultCountry="IN"
                countries={['IN']}
                flags={flags}
                placeholder={t('auth.phone.phonePlaceholder')}
                value={phone}
                onChange={(val) => {
                  setPhone(val || '');
                  if (error) setError(null);
                }}
                disabled={disabled || isSubmitting}
                className="flex items-center w-full bg-surface border border-outline-variant/30 hover:border-secondary/30 focus-within:ring-2 focus-within:ring-secondary/30 focus-within:border-secondary transition-all rounded-[20px] sm:rounded-[24px] px-3 sm:px-4 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base text-primary outline-none"
                numberInputProps={{
                  className: "w-full bg-transparent border-none outline-none text-primary placeholder:text-primary/40 font-body pl-2",
                }}
              />
            </div>
          </div>
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={disabled || isSubmitting || !isValidPhone}
            className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
          >
            {t('auth.phone.sendCode')}
            {!isSubmitting && <ArrowRight size={14} />}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <p className="text-xs text-on-surface-variant/60 text-center font-body">
            {t('auth.phone.codeSentTo')} <span className="font-bold text-primary font-headline">{phone}</span>
          </p>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            label={t('auth.phone.otpLabel')}
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
            {t('auth.phone.verify')}
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
              {t('auth.phone.changeNumber')}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0 || isSubmitting}
              className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendIn > 0
                ? `${t('auth.phone.resendIn')} ${resendIn}s`
                : t('auth.phone.resendCode')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneOtpForm;
