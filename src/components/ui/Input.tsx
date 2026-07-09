import React, { InputHTMLAttributes, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
    label?: string;
    error?: string;
    helperText?: string;
    /** Visual variant. "cosmic" applies the dark glassy auth-form styling. */
    variant?: 'default' | 'cosmic';
}

const Input: React.FC<InputProps> = ({ icon, rightElement, label, error, helperText, variant = 'default', className = '', id, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;
    const isCosmic = variant === 'cosmic';

    return (
        <div className="space-y-2 w-full text-left">
            {label && (
                isCosmic ? (
                    <label htmlFor={inputId} className="auth-label">
                        {label}
                        {props.required && <span className="auth-label-star">*</span>}
                    </label>
                ) : (
                    <label
                        htmlFor={inputId}
                        className="text-[11px] sm:text-xs uppercase tracking-widest text-foreground font-bold ml-1 font-body block"
                    >
                        {label}
                        {props.required && <span className="text-secondary ml-1">*</span>}
                    </label>
                )
            )}
            <div className="relative">
                {icon && (
                    <div
                        className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                            isCosmic ? '[&>svg]:3xl:w-[26px] [&>svg]:3xl:h-[26px]' : ''
                        } ${
                            error
                                ? 'text-red-500'
                                : isFocused
                                    ? (isCosmic ? 'text-secondary' : 'text-secondary')
                                    : (isCosmic ? 'text-secondary' : 'text-secondary/70')
                        }`}
                        aria-hidden="true"
                    >
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    id={inputId}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                    className={
                        isCosmic
                            ? `auth-input ${icon ? 'pl-14' : 'px-5'} ${rightElement ? 'pr-14' : ''} ${error ? 'auth-input-error' : ''} ${className}`
                            : `w-full bg-surface border transition-all outline-none
                               text-foreground placeholder:text-foreground/55 font-body
                               rounded-[20px] sm:rounded-[24px]
                               ${icon ? 'pl-10 sm:pl-12' : 'px-3 sm:px-4'} ${rightElement ? 'pr-10 sm:pr-12' : 'pr-3 sm:pr-4'}
                               py-3 sm:py-3.5 md:py-4
                               text-[15px] sm:text-base
                                ${error
                                    ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
                                    : 'border-outline-variant/45 hover:border-outline-variant/65 focus:ring-2 focus:ring-[rgba(201,151,46,0.30)] focus:border-secondary/70'
                                }
                               disabled:opacity-50 disabled:cursor-not-allowed
                               ${className}`
                    }
                />
                {rightElement && (
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && (
                <p id={`${inputId}-error`} className="text-[10px] sm:text-xs text-red-500 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">
                    <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {error}
                </p>
            )}
            {helperText && !error && (
                                <p id={`${inputId}-helper`} className="text-xs text-text-muted ml-1">
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
