'use client';

import React, { useState, type HTMLProps } from 'react';
import Input from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps extends Omit<HTMLProps<HTMLInputElement>, 'type' | 'label' | 'ref'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  /** Visual variant passed through to Input. */
  variant?: 'default' | 'cosmic';
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label = 'Password',
  error,
  helperText,
  icon,
  id,
  autoComplete = 'current-password',
  disabled,
  className,
  variant,
  ...inputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = id || `password-${label?.replace(/\s+/g, '-').toLowerCase()}`;
  const isCosmic = variant === 'cosmic';

  return (
    <Input
      {...inputProps}
      id={fieldId}
      type={showPassword ? 'text' : 'password'}
      label={label}
      error={error}
      helperText={helperText}
      icon={icon}
      autoComplete={autoComplete}
      disabled={disabled}
      variant={variant}
      className={className}
      rightElement={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={`flex items-center justify-center transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 h-10 w-10 ${
            isCosmic
              ? 'text-[color-mix(in_srgb,var(--on-surface-variant)_55%,transparent)] hover:text-[color-mix(in_srgb,var(--on-surface-variant)_80%,transparent)]'
              : 'text-on-surface-variant/40 hover:text-secondary'
          }`}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={isCosmic ? 18 : 16} /> : <Eye size={isCosmic ? 18 : 16} />}
        </button>
      }
    />
  );
};

export default PasswordField;
