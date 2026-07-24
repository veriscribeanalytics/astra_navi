'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthErrorBanner from './AuthErrorBanner';
import { useTranslation } from '@/hooks';
import { ParsedAuthError, parseAuthError, getLocalizedErrorMessage } from '@/utils/authErrorParser';

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => Promise<{ error?: string; parsedError?: ParsedAuthError | null } | void>;
  disabled?: boolean;
  disabledReason?: string;
  onForgotPassword: () => void;
  onActionClick?: (action: string) => void;
  /**
   * "login" (default) renders the normal sign-in form. "restore" repurposes the
   * same email + password fields to revive a soft-deleted account: the submit
   * button reads "Restore my account", the forgot-password link is hidden
   * (a deleted account can't reset), and the email field is locked to the value
   * the user just tried to sign in with.
   */
  variant?: 'login' | 'restore';
  /** When variant === 'restore', the email field is read-only and pre-filled. */
  lockedEmail?: string;
  /** In restore mode, a secondary control to abandon the flow and sign in fresh. */
  onBackToSignIn?: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({
  onSubmit,
  disabled = false,
  disabledReason,
  onForgotPassword,
  onActionClick,
  variant = 'login',
  lockedEmail,
  onBackToSignIn,
}) => {
  const { t } = useTranslation();
  const isRestore = variant === 'restore';
  const [email, setEmail] = useState(lockedEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [bannerError, setBannerError] = useState<ParsedAuthError | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!bannerError && !Object.keys(fieldErrors).length) return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    firstInvalid?.focus();
  }, [fieldErrors, bannerError]);

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
    setFieldErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit({ email: email.trim(), password });
      if (result && (result.error || result.parsedError)) {
        const parsed = result.parsedError || parseAuthError(result.error);
        if (parsed.field === 'email') {
          setFieldErrors({ email: getLocalizedErrorMessage(parsed, t) });
        } else if (parsed.field === 'password') {
          setFieldErrors({ password: getLocalizedErrorMessage(parsed, t) });
        } else {
          setBannerError(parsed);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = disabled || isSubmitting || !email.trim() || !password.trim();
  const inputCls = (hasError: boolean) =>
    `auth-input pl-14 pr-4 ${hasError ? 'auth-input-error' : ''}`;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {bannerError && (
        <AuthErrorBanner
          parsedError={bannerError}
          onDismiss={() => setBannerError(null)}
          onActionClick={onActionClick}
        />
      )}

      {isRestore && (
        <p className="text-[12px] leading-relaxed text-on-surface-variant/80 -mb-1">
          {t('auth.restore.explainer')}
        </p>
      )}

      {/* Email */}
      <div className="space-y-2.5">
        <label className="auth-label">
          {t('auth.signIn.emailLabel')}
          <span className="auth-label-star">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary" aria-hidden="true">
            <Mail size={18} className="3xl:w-[26px] 3xl:h-[26px]" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder={t('auth.signIn.emailPlaceholder')}
            autoComplete="email"
            required
            disabled={disabled || isSubmitting}
            readOnly={isRestore}
            aria-invalid={fieldErrors.email ? 'true' : 'false'}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            className={inputCls(!!fieldErrors.email)}
          />
        </div>
        {fieldErrors.email && (
          <p id="email-error" className="text-[10px] text-red-400 ml-2" role="alert">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2.5">
        <label className="auth-label">
          {t('auth.signIn.passwordLabel')}
          <span className="auth-label-star">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary" aria-hidden="true">
            <Lock size={18} className="3xl:w-[26px] 3xl:h-[26px]" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder={t('auth.signIn.passwordPlaceholder')}
            autoComplete="current-password"
            required
            disabled={disabled || isSubmitting}
            aria-invalid={fieldErrors.password ? 'true' : 'false'}
            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            className={`${inputCls(!!fieldErrors.password)} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled || isSubmitting}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-[color-mix(in_srgb,var(--on-surface-variant)_55%,transparent)] hover:text-[color-mix(in_srgb,var(--on-surface-variant)_80%,transparent)] transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
            aria-label={showPassword ? t('auth.signIn.hidePassword') : t('auth.signIn.showPassword')}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} className="3xl:w-[26px] 3xl:h-[26px]" /> : <Eye size={18} className="3xl:w-[26px] 3xl:h-[26px]" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="text-[10px] text-red-400 ml-2" role="alert">{fieldErrors.password}</p>
        )}
      </div>

      {/* Forgot password — hidden in restore mode (a deleted account can't
          reset its password) */}
      {!isRestore && (
        <div className="flex justify-end -mt-2.5">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[13px] font-medium text-secondary hover:opacity-80 transition-opacity focus:outline-none focus-visible:underline"
          >
            {t('auth.signIn.forgotPassword')}
          </button>
        </div>
      )}

      {/* Submit — bright gold gradient */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="auth-btn-gold mt-1"
      >
        {isSubmitting ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <>
            {disabled
              ? (disabledReason || t('auth.signIn.submit'))
              : isRestore ? t('auth.restore.submit') : t('auth.signIn.submit')}
            {!disabled && <ArrowRight size={22} strokeWidth={2.5} className="3xl:w-7 3xl:h-7" />}
          </>
        )}
      </button>

      {/* In restore mode, offer an escape hatch back to the normal sign-in
          form (e.g. the user realized this isn't their deleted account). */}
      {isRestore && onBackToSignIn && (
        <button
          type="button"
          onClick={onBackToSignIn}
          className="w-full text-[12px] font-medium text-on-surface-variant/70 hover:text-secondary transition-colors focus:outline-none focus-visible:underline"
        >
          {t('auth.restore.backToSignIn')}
        </button>
      )}
    </form>
  );
};

export default SignInForm;
