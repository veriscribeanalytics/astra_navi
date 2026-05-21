'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AuthErrorBanner from './AuthErrorBanner';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInFormProps {
  /** Called when user clicks submit. Should call signIn('credentials', ...). */
  onSubmit: (data: SignInFormData) => Promise<{ error?: string } | void>;
  /** Whether the form should be disabled (e.g. account locked). */
  disabled?: boolean;
  /** Disabled reason shown on the submit button. */
  disabledReason?: string;
  /** Called when "Forgot Password?" is clicked. */
  onForgotPassword: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({
  onSubmit,
  disabled = false,
  disabledReason,
  onForgotPassword,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [bannerError, setBannerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = t('auth.signIn.emailRequired');
    else if (!email.includes('@')) errors.email = t('auth.signIn.emailInvalid');
    if (!password.trim()) errors.password = t('auth.signIn.passwordRequired');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({ email: email.trim(), password });
      if (result && result.error) {
        setBannerError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = disabled || isSubmitting || !email.trim() || !password.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {bannerError && (
        <AuthErrorBanner message={bannerError} onDismiss={() => setBannerError(null)} />
      )}

      <Input
        type="email"
        label={t('auth.signIn.emailLabel')}
        placeholder={t('auth.signIn.emailPlaceholder')}
        icon={<Mail size={16} className="text-secondary" />}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
        }}
        error={fieldErrors.email}
        autoComplete="email"
        required
        disabled={disabled || isSubmitting}
      />

      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          label={t('auth.signIn.passwordLabel')}
          placeholder={t('auth.signIn.passwordPlaceholder')}
          icon={<Lock size={16} className="text-secondary" />}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
          }}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
          disabled={disabled || isSubmitting}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled || isSubmitting}
          className="absolute right-4 top-[38px] text-on-surface-variant/40 hover:text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 rounded"
          aria-label={showPassword ? t('auth.signIn.hidePassword') : t('auth.signIn.showPassword')}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-secondary transition-colors"
        >
          {t('auth.signIn.forgotPassword')}
        </button>
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitDisabled}
        className="!rounded-xl font-bold text-[12px] uppercase tracking-widest gap-2 gold-gradient shadow-lg"
      >
        {disabled ? disabledReason || t('auth.signIn.submit') : t('auth.signIn.submit')}
        {!isSubmitting && !disabled && <ArrowRight size={14} />}
      </Button>
    </form>
  );
};

export default SignInForm;