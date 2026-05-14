import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AuthErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({ message, onDismiss }) => {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1 leading-snug">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:bg-red-500/20 transition-colors"
          aria-label="Dismiss error"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default AuthErrorBanner;