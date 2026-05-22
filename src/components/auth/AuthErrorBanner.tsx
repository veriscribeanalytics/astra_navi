import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { ParsedAuthError, getLocalizedErrorMessage } from '@/utils/authErrorParser';

interface AuthErrorBannerProps {
  message?: string;
  parsedError?: ParsedAuthError | null;
  onDismiss?: () => void;
  onActionClick?: (action: string) => void;
}

const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({
  message,
  parsedError,
  onDismiss,
  onActionClick,
}) => {
  const { t } = useTranslation();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Initialize and synchronize countdown if retryAfterSeconds exists
  useEffect(() => {
    if (parsedError && typeof parsedError.retryAfterSeconds === 'number' && parsedError.retryAfterSeconds > 0) {
      setRemainingSeconds(parsedError.retryAfterSeconds);
    } else {
      setRemainingSeconds(null);
    }
  }, [parsedError]);

  // Handle count down timer
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  // Determine base message to show
  const getDisplayMessage = (): string => {
    if (parsedError) {
      return getLocalizedErrorMessage(parsedError, t);
    }
    return message || t('auth.errors.generic');
  };

  // Determine if a CTA action button should be shown
  const getActionDetails = () => {
    const actionKey = parsedError?.action || parsedError?.code;
    if (!actionKey) return null;

    if (actionKey === 'email_not_registered' || actionKey === 'register') {
      return {
        label: t('login.dontHaveAccount') ? t('login.createAccount') : 'Create Account',
        action: 'register',
      };
    }
    if (actionKey === 'email_already_registered' || actionKey === 'login') {
      return {
        label: t('login.alreadyHaveAccount') ? t('login.signIn') : 'Login Now',
        action: 'login',
      };
    }
    if (actionKey === 'wrong_password' || actionKey === 'reset_password') {
      return {
        label: t('auth.signIn.forgotPassword') || 'Reset Password',
        action: 'reset_password',
      };
    }
    return null;
  };

  const displayMessage = getDisplayMessage();
  const actionDetails = getActionDetails();

  // Format lockout countdown
  const getLockoutText = (): string | null => {
    if (remainingSeconds === null || remainingSeconds <= 0) return null;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return t('auth.errors.retry_after', { minutes, seconds });
  };

  const lockoutText = getLockoutText();

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 flex flex-col gap-1 leading-snug">
          <span className="font-medium">{displayMessage}</span>
          {lockoutText && (
            <span className="text-xs text-red-400/90 font-semibold mt-0.5">
              {lockoutText}
            </span>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 p-0.5 rounded hover:bg-red-500/20 transition-colors"
            aria-label={t('auth.errorBanner.dismiss')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {actionDetails && onActionClick && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onActionClick(actionDetails.action)}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary-light transition-colors py-1.5 px-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-secondary/40"
          >
            {actionDetails.label}
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthErrorBanner;