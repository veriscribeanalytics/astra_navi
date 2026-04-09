import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  href?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  href,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center gap-1.5 sm:gap-2 font-bold font-body transition-all duration-300 rounded-xl active:scale-95 cursor-pointer relative overflow-hidden min-h-[44px]';
  
  // Variant styles
  const variants = {
    primary: 'gold-gradient text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    secondary: 'text-primary border border-secondary/20 hover:bg-secondary/5 hover:border-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    ghost: 'text-primary hover:bg-secondary/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
  };
  
  // Size styles
  const sizes = {
    sm: 'px-3 sm:px-4 py-2 sm:py-2 text-xs sm:text-sm',
    md: 'px-4 sm:px-5 md:px-6 py-2.5 sm:py-2.5 md:py-2.5 text-sm sm:text-base',
    lg: 'px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 text-base sm:text-lg',
  };
  
  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const combinedClasses = `
    ${baseStyles} 
    ${variants[variant]} 
    ${sizes[size]} 
    ${widthStyle} 
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const content = (
    <>
      {loading && (
        <span className="material-symbols-outlined animate-spin text-current" aria-hidden="true">
          autorenew
        </span>
      )}
      {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={combinedClasses} aria-disabled={loading}>
        {content}
      </Link>
    );
  }

  return (
    <button 
      className={combinedClasses} 
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
