import React, { InputHTMLAttributes, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label?: string;
    error?: string;
    helperText?: string;
}

const Input: React.FC<InputProps> = ({ icon, label, error, helperText, className = '', id, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;
    
    return (
        <div className="space-y-2 w-full text-left">
            {label && (
                <label 
                    htmlFor={inputId}
                    className="text-[10px] sm:text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body block"
                >
                    {label}
                    {props.required && <span className="text-secondary ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div 
                        className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                            error ? 'text-red-500' : isFocused ? 'text-secondary' : 'text-secondary/60'
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
                    className={`
                        w-full bg-surface/40 backdrop-blur-md border transition-all outline-none
                        text-primary placeholder:text-primary/40 font-body
                        rounded-[20px] sm:rounded-[24px]
                        ${icon ? 'pl-10 sm:pl-12 pr-3 sm:pr-4' : 'px-3 sm:px-4'} 
                        py-3 sm:py-3.5 md:py-4
                        text-sm sm:text-base
                        ${error 
                            ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500' 
                            : 'border-outline-variant/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${className}
                    `}
                />
            </div>
            {error && (
                <p id={`${inputId}-error`} className="text-[10px] sm:text-xs text-red-500 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">
                    <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p id={`${inputId}-helper`} className="text-[10px] sm:text-xs text-on-surface-variant/60 ml-1">
                    {helperText}
                </p>
            )}
        </div>
    );
};

export default Input;
