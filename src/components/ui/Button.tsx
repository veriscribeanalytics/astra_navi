import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  href?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  href,
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-bold font-body transition-all duration-300 rounded-xl active:scale-95';
  
  // Variant styles
  const variants = {
    primary: 'gold-gradient text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/30',
    secondary: 'text-primary border border-secondary/20 hover:bg-secondary/5',
    ghost: 'text-primary hover:bg-secondary/5',
  };
  
  // Size styles
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-4 text-lg',
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

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
