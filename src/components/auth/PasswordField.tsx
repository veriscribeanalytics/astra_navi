'use client';

import React, { useState, type HTMLProps } from 'react';
import Input from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps extends Omit<HTMLProps<HTMLInputElement>, 'type' | 'label' | 'ref'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
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
  ...inputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = id || `password-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="relative">
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
        className={className}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-4 top-[38px] text-on-surface-variant/40 hover:text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 rounded"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export default PasswordField;