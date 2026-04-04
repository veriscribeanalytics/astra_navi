import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  allowOverflow?: boolean;
  colorScheme?: 'default' | 'ivory' | 'lavender' | 'midnight' | 'galaxy';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = true,
  allowOverflow = false,
  colorScheme = 'default',
}) => {
  const baseStyles = `transition-all duration-300 rounded-3xl ${allowOverflow ? '' : 'overflow-hidden'}`;
  
  const colorSchemes = {
    default: {
      default: 'bg-surface/50 dark:bg-surface/70 border-secondary/10',
      elevated: 'bg-surface/50 dark:bg-surface/70 shadow-secondary/5 border-secondary/5',
      bordered: 'bg-surface/50 dark:bg-surface/70 border-secondary/20',
    },
    ivory: {
      default: 'bg-background border-outline-variant/30',
      elevated: 'bg-background shadow-lg shadow-outline-variant/20 border-outline-variant/20',
      bordered: 'bg-background/85 border-outline-variant/40',
    },
    lavender: {
      default: 'bg-surface/50 dark:bg-surface/70 border-outline-variant/30',
      elevated: 'bg-surface/50 dark:bg-surface/70 shadow-lg shadow-outline-variant/20 border-outline-variant/20',
      bordered: 'bg-surface/50 dark:bg-surface/70 border-outline-variant/40',
    },
    midnight: {
      default: 'bg-surface-variant/95 border-secondary/15',
      elevated: 'bg-surface-variant shadow-lg shadow-secondary/5 border-secondary/10',
      bordered: 'bg-surface-variant/85 border-secondary/25',
    },
    galaxy: {
      default: 'bg-surface/95 border-outline-variant/40',
      elevated: 'bg-surface shadow-lg shadow-outline-variant/10 border-outline-variant/30',
      bordered: 'bg-surface/85 border-outline-variant/60',
    }
  };

  const variants = {
    default: `${colorSchemes[colorScheme].default} backdrop-blur-md border`,
    elevated: `${colorSchemes[colorScheme].elevated} backdrop-blur-md shadow-xl border`,
    bordered: `${colorSchemes[colorScheme].bordered} backdrop-blur-sm border-[1.5px]`,
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-12',
    xl: 'p-10 sm:p-16',
  };

  const hoverStyles = hoverable 
    ? `hover:border-secondary/40 hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-300`
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
