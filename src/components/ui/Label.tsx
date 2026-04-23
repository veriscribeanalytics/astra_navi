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
    default: 'text-[11px] font-bold text-foreground/50 uppercase tracking-[0.2em]',
    sm: 'text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/40',
    muted: 'text-[12px] font-medium text-foreground/30 italic tracking-wide lowercase first-letter:uppercase',
    secondary: 'text-[11px] font-bold uppercase tracking-[0.2em] text-secondary',
    accent: 'text-[11px] font-bold uppercase tracking-[0.2em] text-pink-400',
  };

  const combinedClasses = `${variants[variant]} ${className}`.trim();

  return (
    <span className={combinedClasses}>
      {children}
    </span>
  );
};

export default Label;
