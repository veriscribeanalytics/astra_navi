import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  allowOverflow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = true,
  allowOverflow = false,
}) => {
  const baseStyles = `transition-all duration-300 rounded-[1.5rem] sm:rounded-[2.5rem] ${allowOverflow ? '' : 'overflow-hidden'}`;
  
  const variants = {
    default: 'bg-surface/80 backdrop-blur-2xl border border-secondary/10',
    elevated: 'bg-surface shadow-xl shadow-secondary/5 border border-secondary/5',
    bordered: 'bg-transparent border-2 border-secondary/20',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-12',
    xl: 'p-10 sm:p-16',
  };

  const hoverStyles = hoverable 
    ? 'hover:border-secondary/30 hover:shadow-2xl hover:shadow-secondary/10' 
    : '';

  const combinedClasses = `
    ${baseStyles} 
    ${variants[variant]} 
    ${paddings[padding]} 
    ${hoverStyles} 
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

export default Card;
