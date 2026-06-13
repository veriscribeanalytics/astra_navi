import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'sm' | 'muted' | 'secondary' | 'accent' | 'default';
}

const Label: React.FC<LabelProps> = ({
  children,
  className = '',
  variant = 'default',
}) => {
  const variants = {
    default: 'text-ui-caption font-bold text-foreground/50 uppercase tracking-[0.2em]',
    sm: 'text-ui-micro font-bold uppercase tracking-[0.15em] text-foreground/40',
    muted: 'text-ui-caption font-medium text-foreground/30 italic tracking-wide lowercase first-letter:uppercase',
    secondary: 'text-ui-caption font-bold uppercase tracking-[0.2em] text-secondary',
    accent: 'text-ui-caption font-bold uppercase tracking-[0.2em] text-pink-400',
  };

  const combinedClasses = `${variants[variant]} ${className}`.trim();

  return (
    <span className={combinedClasses}>
      {children}
    </span>
  );
};

export default Label;
